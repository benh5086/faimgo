/*
  Faimgo — thin Postgres access layer, Neon's serverless driver.

  WHY THIS EXISTS
  Every plan submission has always been saved two places: localStorage (this
  device only — see store.js) and the Leads Sheet (append-only, not queryable
  by "give me everyone's plans for this email"). Neither can answer "let this
  person see their plans on a device that has never seen them." This file is
  the third place a plan lands — the one built to answer that question — and
  the schema behind it is sql/001_identity.sql (run once, by hand, in Neon's
  SQL editor; there's no migration tool in this project and this doesn't need
  one yet).

  MUST-NEVER-BREAK-THE-FLOW, same discipline as meter.js and track.js. A
  database hiccup must never turn a successful assessment submission into a
  failed one, or block a plan email — every write in this file that's called
  from that hot path (api/lead/route.js's mirrorPlan()) is wrapped so it can
  only ever fail silently (logged, not thrown).

  The one deliberate exception is verifyMagicToken(): it FAILS CLOSED, the
  opposite of everything else here, because showing someone a stranger's
  saved plans on a swallowed error would be a real harm, unlike a missed
  metering event. See its own comment below.

  CONNECTION
  Uses @neondatabase/serverless's HTTP-based driver — no persistent pool, no
  edge/runtime config needed, works from an ordinary Next.js API route. Reads
  DATABASE_URL from the environment (already set in Vercel — see the Neon
  section of claude/faimgo-open-items.md); this file never contains a
  connection string itself, same key-hygiene rule as everywhere else in this
  repo.

  VERIFICATION NOTE (Aug 16, 2026): this container cannot run `npm install`
  (the registry 403s here, a long-standing limitation — see the "Shipping"
  section of claude/faimgo-open-items.md), so @neondatabase/serverless has
  never actually been resolved or executed in this environment. Every
  function below is written correctly against the package's documented API,
  not proven against a live import or a real database. `bun build --no-bundle`
  on this file will fail to resolve the `@neondatabase/serverless` import for
  exactly that reason — that failure is expected here and is not a sign the
  code itself is wrong. Real verification is: (1) `npm install
  @neondatabase/serverless` added to package.json so Vercel's build — which
  DOES run a real npm install — can resolve it, and (2) a live check against
  the Neon SQL editor after deploy. Both need to happen together with Ben,
  not assumed from this end.
*/

import { neon } from "@neondatabase/serverless";

let _sql = null;
function sql() {
  if (_sql) return _sql;
  const url = process.env.DATABASE_URL;
  if (!url) return null; // no database configured — every caller below must tolerate this
  _sql = neon(url);
  return _sql;
}

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/*
  Best-effort mirror of a submitted plan into Postgres. Called from
  api/lead/route.js right after a lead is processed — never awaited in a way
  that could delay or fail the actual response; wrapped so a database problem
  can only ever be logged, never surfaced.

  Upserts the person by email, upserts the device link (so this fid is now
  known to belong to them), and upserts the plan itself keyed by
  (person_id, plan_id) — a resubmit of the same plan (same id, from
  store.js's fingerprint matching) updates the row in place instead of
  duplicating it, exactly mirroring how savePlan() already behaves locally.

  Returns true on success, false on any failure (including "no database
  configured") — callers should log false, never surface it to the person.
*/
export async function mirrorPlan({ email, fid, planId, answers, results, protectFrom, otherIdea }) {
  const db = sql();
  if (!db || !email || !planId) return false;
  try {
    const [person] = await db`
      INSERT INTO people (email) VALUES (${String(email).toLowerCase()})
      ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
      RETURNING id
    `;
    if (!person) return false;

    if (fid) {
      await db`
        INSERT INTO person_devices (person_id, fid)
        VALUES (${person.id}, ${fid})
        ON CONFLICT (person_id, fid) DO UPDATE SET last_seen_at = now()
      `;
    }

    await db`
      INSERT INTO person_plans (person_id, plan_id, answers, results, protect_from, other_idea)
      VALUES (${person.id}, ${planId}, ${JSON.stringify(answers || {})}, ${JSON.stringify(results || null)}, ${protectFrom || null}, ${otherIdea || null})
      ON CONFLICT (person_id, plan_id) DO UPDATE SET
        answers = EXCLUDED.answers,
        results = EXCLUDED.results,
        protect_from = EXCLUDED.protect_from,
        other_idea = EXCLUDED.other_idea,
        updated_at = now()
    `;
    return true;
  } catch (e) {
    console.error("[FAIMGO DB ERROR] mirrorPlan", e?.message);
    return false;
  }
}

/*
  Create a one-time restore token for an email. Stores only its SHA-256 hash
  — the raw token exists only in the email that gets sent and in this
  function's return value, never at rest, the same reason a password is
  hashed rather than stored. 30-minute expiry: long enough that someone slow
  to check their inbox isn't punished, short enough that a leaked or
  forwarded link goes stale on its own.

  Returns the raw token string on success, null on any failure (no database
  configured, or a write error) — the caller must treat null as "could not
  create a restore link" and say so honestly, never claim one was sent.
*/
export async function createMagicToken({ email, fid }) {
  const db = sql();
  if (!db || !email) return null;
  try {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    const hash = await sha256Hex(token);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    await db`
      INSERT INTO magic_tokens (token_hash, email, requesting_fid, expires_at)
      VALUES (${hash}, ${String(email).toLowerCase()}, ${fid || null}, ${expiresAt})
    `;
    return token;
  } catch (e) {
    console.error("[FAIMGO DB ERROR] createMagicToken", e?.message);
    return null;
  }
}

/*
  Verify a restore token and, if valid, return every plan on record for that
  email plus the person's id — so the caller can link this device and hand
  the plans back to the client to merge into localStorage.

  FAILS CLOSED, deliberately the opposite of the rest of this file: any
  doubt at all — no database, malformed token, not found, expired, already
  used, or a query error — returns { ok: false }. Showing someone a
  stranger's plans because of a swallowed error is a real harm in a way a
  missed metering event never is; this is the one function in the project
  that must NOT follow the fail-open pattern used everywhere else (see
  Gate.js and meter.js, which fail open on purpose for the opposite reason).

  Single-use, enforced atomically: the token is marked used in the same
  statement that checks it (`UPDATE ... WHERE used_at IS NULL`, not a
  separate check-then-write), so two requests racing on the same token
  cannot both succeed.
*/
export async function verifyMagicToken({ token, fid }) {
  const db = sql();
  if (!db || !token) return { ok: false };
  try {
    const hash = await sha256Hex(token);
    const [row] = await db`
      UPDATE magic_tokens
      SET used_at = now()
      WHERE token_hash = ${hash} AND used_at IS NULL AND expires_at > now()
      RETURNING email
    `;
    if (!row || !row.email) return { ok: false };

    const [person] = await db`
      INSERT INTO people (email) VALUES (${row.email})
      ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
      RETURNING id
    `;
    if (!person) return { ok: false };

    if (fid) {
      await db`
        INSERT INTO person_devices (person_id, fid)
        VALUES (${person.id}, ${fid})
        ON CONFLICT (person_id, fid) DO UPDATE SET last_seen_at = now()
      `;
    }

    const plans = await db`
      SELECT plan_id, answers, results, protect_from, other_idea, updated_at
      FROM person_plans WHERE person_id = ${person.id}
      ORDER BY updated_at DESC
    `;

    return { ok: true, email: row.email, plans };
  } catch (e) {
    console.error("[FAIMGO DB ERROR] verifyMagicToken", e?.message);
    return { ok: false };
  }
}
