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
/* Sep 7 2026 — Ben wants multiple plans kept per account (like separate
   chat threads on different topics), not one plan silently overwriting the
   last. store.js's MAX_PLANS already caps a single DEVICE at 5, dropping
   the oldest with no warning — that was fine when a device and a person
   were the same thing, but an account can now outlive any one device, so
   the cap has to live here too, and it has to be a real stop, not a quiet
   drop: once a person already has 5 plans on file, a genuinely NEW one is
   refused (see the check below) rather than silently evicting an old one
   they might still want. Updating one of the 5 they already have (same
   planId) is always allowed — that's not growth, it's an edit. */
const MAX_PLANS_PER_PERSON = 5;

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

    // Only a genuinely new plan_id counts against the cap — resubmitting/
    // editing one already on file must never be blocked by it.
    const existing = await db`SELECT plan_id FROM person_plans WHERE person_id = ${person.id}`;
    const isNewPlan = !existing.some((r) => r.plan_id === planId);
    if (isNewPlan && existing.length >= MAX_PLANS_PER_PERSON) {
      return "limit";
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
  List every plan on file for a person — the account page's "your saved
  plans" list. Same raw row shape verifyMagicToken already returns for
  /restore (plan_id, answers, results, protect_from, other_idea, ...),
  deliberately NOT trimmed down to a display-only shape: /account's "Open"
  action on one of these plans reuses store.js's mergeRestoredPlans() —
  the exact same merge path /restore already uses to hydrate a plan onto a
  device that has never seen it — and that function needs the real
  `answers` to do that. Shipping a lighter payload here would work fine for
  drawing the list itself but would silently break Open on any device other
  than the one that originally submitted the plan, which defeats the point
  of an account in the first place. Newest-updated first, same ordering
  verifyMagicToken uses.
*/
export async function listPlansForPerson(personId) {
  const db = sql();
  if (!db || !personId) return [];
  try {
    const rows = await db`
      SELECT plan_id, answers, results, protect_from, other_idea, created_at, updated_at
      FROM person_plans WHERE person_id = ${personId}
      ORDER BY updated_at DESC
    `;
    return rows;
  } catch (e) {
    console.error("[FAIMGO DB ERROR] listPlansForPerson", e?.message);
    return [];
  }
}

/*
  Delete one saved plan. The caller (api/profile/route.js) must have
  already verified personId via verifyEditSession — this function trusts
  whatever personId it's given, same separation of concerns as
  updateProfile. Scoped to (person_id, plan_id) together so there is no way
  to pass someone else's plan_id and delete a stranger's row.
*/
export async function deletePlanForPerson({ personId, planId }) {
  const db = sql();
  if (!db || !personId || !planId) return false;
  try {
    await db`DELETE FROM person_plans WHERE person_id = ${personId} AND plan_id = ${planId}`;
    return true;
  } catch (e) {
    console.error("[FAIMGO DB ERROR] deletePlanForPerson", e?.message);
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

    return { ok: true, email: row.email, personId: person.id, plans };
  } catch (e) {
    console.error("[FAIMGO DB ERROR] verifyMagicToken", e?.message);
    return { ok: false };
  }
}

/*
  ---------- account/profile + completion record + reviews (added Sep 6) ----------

  See claude/faimgo-profile-scope-sep6.md for the full reasoning. Follows the
  same conventions as everything above: best-effort/fail-open for anything
  called from a hot path a person is mid-action on (mirrorStep, same
  discipline as mirrorPlan); fail-closed only for the one function that
  decides whether a write is authorized (verifyEditSession, mirroring
  verifyMagicToken's own fail-closed reasoning — the harm of wrongly allowing
  a profile edit is not symmetric with the harm of wrongly refusing one).
*/

/*
  Best-effort mirror of a single step completion into Postgres. Called from
  /plan's onToggle right after markStep() succeeds locally — never on the
  critical path of the click itself (the local write already happened;
  losing this one is a missed public completed-count, never a lost local
  record). Upserts the person by email (same as mirrorPlan — the email came
  from their own submitted assessment, no proof-of-ownership token needed to
  record their own action against their own address), then upserts the step.

  `done=false` deletes the row rather than leaving a done:false record —
  matches markStep()'s own local behaviour (un-marking removes the entry
  entirely, it doesn't keep a false flag around).
*/
export async function mirrorStep({ email, fid, playId, done, note }) {
  const db = sql();
  if (!db || !email || !playId) return false;
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

    if (done) {
      await db`
        INSERT INTO person_steps (person_id, play_id, note)
        VALUES (${person.id}, ${playId}, ${note || null})
        ON CONFLICT (person_id, play_id) DO UPDATE SET
          note = EXCLUDED.note, updated_at = now()
      `;
    } else {
      await db`DELETE FROM person_steps WHERE person_id = ${person.id} AND play_id = ${playId}`;
    }
    return true;
  } catch (e) {
    console.error("[FAIMGO DB ERROR] mirrorStep", e?.message);
    return false;
  }
}

/*
  Public read for a profile page (/u/[id]) — no auth, by design: this is the
  link-shareable view, the same trust boundary as "anyone with the link" on
  a shared doc. Returns null for an id that doesn't exist or on any failure,
  never partial data — the page treats null as "nothing here."

  Deliberately does NOT return email or any other private field — only what
  the profile page is meant to show. Rating is omitted entirely (not "0")
  when there are no reviews yet, so the page can render an honest "no
  reviews yet" instead of a misleadingly low number.
*/
/*
  Private read of the real-name fields — first/middle/last — added Sep 7
  2026 (see sql/003_names.sql). Deliberately a separate function from
  getPublicProfile rather than a parameter on it: the two are different
  trust levels (public link vs. proven owner), and keeping them as two
  functions means a future call site can never accidentally leak these by
  reusing the public one. Called only from api/profile/route.js's "get"
  action, and only after that route has independently verified the
  requester's edit-session token against this same personId.
*/
export async function getPrivateNameFields(personId) {
  const db = sql();
  if (!db || !personId) return null;
  try {
    const [person] = await db`
      SELECT first_name, middle_name, last_name FROM people WHERE id = ${personId}
    `;
    if (!person) return null;
    return {
      firstName: person.first_name || null,
      middleName: person.middle_name || null,
      lastName: person.last_name || null,
    };
  } catch (e) {
    console.error("[FAIMGO DB ERROR] getPrivateNameFields", e?.message);
    return null;
  }
}

export async function getPublicProfile(personId) {
  const db = sql();
  if (!db || !personId) return null;
  try {
    const [person] = await db`
      SELECT id, username, avatar_url, bio, headline, profile_public, created_at
      FROM people WHERE id = ${personId}
    `;
    if (!person) return null;

    const [{ count: completedCount }] = await db`
      SELECT count(*)::int AS count FROM person_steps WHERE person_id = ${personId}
    `;

    const [{ count: reviewCount, avg: ratingAvg }] = await db`
      SELECT count(*)::int AS count, avg(rating)::numeric(10,2) AS avg
      FROM reviews WHERE reviewee_person_id = ${personId}
    `;

    return {
      id: person.id,
      username: person.username || null,
      avatarUrl: person.avatar_url || null,
      bio: person.bio || null,
      headline: person.headline || null,
      memberSince: person.created_at,
      completedCount: completedCount || 0,
      reviewCount: reviewCount || 0,
      ratingAvg: reviewCount > 0 ? Number(ratingAvg) : null,
    };
  } catch (e) {
    console.error("[FAIMGO DB ERROR] getPublicProfile", e?.message);
    return null;
  }
}

/*
  Create a long-lived (~1 year) edit-session token for a person, right after
  their email ownership was just proven via verifyMagicToken. Same
  hash-at-rest pattern as magic_tokens, different lifetime — this is meant
  to be verified-once-per-device the same way `linkedEmail` already works
  for reading plans (see store.js), not re-checked on every visit.

  Returns the raw token on success (the client stores it, same as
  linkedEmail), null on any failure.
*/
export async function createEditSession(personId) {
  const db = sql();
  if (!db || !personId) return null;
  try {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    const hash = await sha256Hex(token);
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    await db`
      INSERT INTO edit_sessions (token_hash, person_id, expires_at)
      VALUES (${hash}, ${personId}, ${expiresAt})
    `;
    return token;
  } catch (e) {
    console.error("[FAIMGO DB ERROR] createEditSession", e?.message);
    return null;
  }
}

/*
  Verify an edit-session token. FAILS CLOSED, same reasoning as
  verifyMagicToken: any doubt at all (no database, malformed token, not
  found, expired) returns null rather than guessing. Does NOT single-use
  this token (unlike magic_tokens) — it's meant to authorize many edits
  over the life of the session, not one restore.
*/
export async function verifyEditSession(token) {
  const db = sql();
  if (!db || !token) return null;
  try {
    const hash = await sha256Hex(token);
    const [row] = await db`
      SELECT person_id FROM edit_sessions
      WHERE token_hash = ${hash} AND expires_at > now()
    `;
    return row ? row.person_id : null;
  } catch (e) {
    console.error("[FAIMGO DB ERROR] verifyEditSession", e?.message);
    return null;
  }
}

/*
  Update the self-entered half of a profile (display name, bio). Requires an
  already-verified personId (the caller — api/profile/route.js — must have
  called verifyEditSession first; this function does not check
  authorization itself, same separation of concerns as the rest of this
  file: routes decide who's allowed, db.js just writes).

  `username` is UNIQUE on the people table — a collision returns
  { ok: false, reason: "taken" } rather than throwing, so the page can say
  something useful instead of a generic error.
*/
export async function updateProfile({ personId, username, bio, headline, firstName, middleName, lastName }) {
  const db = sql();
  if (!db || !personId) return { ok: false, reason: "no-db" };
  try {
    // username/bio always take whatever the form currently holds — this
    // one statement is where a taken-username collision is caught, before
    // anything else below runs.
    await db`
      UPDATE people SET
        username = ${username || null},
        bio = ${bio || null}
      WHERE id = ${personId}
    `;

    // headline, and now firstName/middleName/lastName (added Sep 7 2026,
    // see sql/003_names.sql): each is only ever sent by a caller that
    // actually means to set it — headline from the person's own local plan
    // data, the name fields from the one-time profile-setup form (see
    // account/page.js). `undefined` means "the caller didn't send this
    // field this time" (e.g. an ordinary bio-only edit afterwards) and must
    // NOT overwrite a previously-saved value with null. Four separate
    // guarded statements rather than one dynamic one — plainer to read,
    // and a stray typo in one can't corrupt the others.
    if (headline !== undefined) {
      await db`UPDATE people SET headline = ${headline || null} WHERE id = ${personId}`;
    }
    if (firstName !== undefined) {
      await db`UPDATE people SET first_name = ${firstName || null} WHERE id = ${personId}`;
    }
    if (middleName !== undefined) {
      await db`UPDATE people SET middle_name = ${middleName || null} WHERE id = ${personId}`;
    }
    if (lastName !== undefined) {
      await db`UPDATE people SET last_name = ${lastName || null} WHERE id = ${personId}`;
    }
    return { ok: true };
  } catch (e) {
    const msg = e?.message || "";
    if (msg.includes("people_username_key") || msg.toLowerCase().includes("unique")) {
      return { ok: false, reason: "taken" };
    }
    console.error("[FAIMGO DB ERROR] updateProfile", msg);
    return { ok: false, reason: "error" };
  }
}

/*
  ---------- AI coach usage ledger (added Sep 8 2026) ----------

  See sql/004_ai_usage.sql for the schema and the full reasoning on why this
  is keyed by fid rather than person_id. This is the build-out of the $5
  allowance already decided in claude/faimgo-ai-coach-usage-pricing-sep6.md
  -- gates ONLY src/lib/coach.js's two calls, never the plan/walkthrough.

  FAILS OPEN, deliberately, unlike verifyMagicToken/verifyEditSession above.
  Those two protect against showing a stranger someone else's private data
  -- a real harm a swallowed error must never risk. This protects against
  overspending during a database hiccup -- a cost risk, not a privacy one,
  and the wrong failure mode here (silently refusing real help because a
  balance check couldn't be read) is worse than the risk it's guarding
  against, per this whole file's "must never break the flow" discipline
  (see mirrorPlan/mirrorStep above). A DB outage is also rare and short —
  the global MAX_COACH_CALLS_PER_DAY ceiling in api/coach/route.js is the
  backstop that still applies even if this fails open.
*/
export async function getAiUsageCents(fid) {
  const db = sql();
  if (!db || !fid) return 0; // no database, or no device id at all — fail open, see above
  try {
    const [row] = await db`SELECT total_cost_cents FROM ai_usage WHERE fid = ${fid}`;
    return row ? row.total_cost_cents : 0;
  } catch (e) {
    console.error("[FAIMGO DB ERROR] getAiUsageCents", e?.message);
    return 0; // fail open — see comment above
  }
}

/*
  Best-effort record of one coach call's real cost, in cents, computed by
  the caller (api/coach/route.js) from the actual token usage Anthropic's
  API reports back and its published per-model pricing — never estimated
  or flat-rated here. Never blocks or throws; a failed write here only
  ever costs accuracy of the running total, never the reply the person is
  waiting on (same discipline as mirrorStep).
*/
export async function recordAiUsage({ fid, costCents }) {
  const db = sql();
  if (!db || !fid || !Number.isFinite(costCents) || costCents <= 0) return false;
  try {
    await db`
      INSERT INTO ai_usage (fid, total_cost_cents, calls)
      VALUES (${fid}, ${Math.round(costCents)}, 1)
      ON CONFLICT (fid) DO UPDATE SET
        total_cost_cents = ai_usage.total_cost_cents + EXCLUDED.total_cost_cents,
        calls = ai_usage.calls + 1,
        updated_at = now()
    `;
    return true;
  } catch (e) {
    console.error("[FAIMGO DB ERROR] recordAiUsage", e?.message);
    return false;
  }
}
