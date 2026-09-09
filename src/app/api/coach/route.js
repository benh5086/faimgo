/*
  Faimgo — the AI coach endpoint.

  Server-side ONLY on purpose: ANTHROPIC_API_KEY must never reach the
  browser, so every call to buildGroundingContext()/callCoach() (src/lib/coach.js)
  happens here, never client-side.

  TWO CALLERS, ONE ROUTE, SAME SHAPE AS EVERY OTHER API ROUTE HERE (see
  api/step/route.js, api/lead/route.js): { kind, ...payload } in, try/catch,
  Response.json out, console.error tagged [FAIMGO ... ERROR] on failure.

  { kind: "classify_idea", text }
    — the assessment's free-text "something else" answer. See
      claude/faimgo-plan-redesign-batch-sep6.md for the bug this replaces
      (a fixed keyword list, silently discarding unmatched text).

  { kind: "stuck_help", focusPlayId, situationText, path, gap, doneIds }
    — the `help.ai-coach` seam in plan/page.js's check-in routing, honestly
      labelled "not built yet" since Aug 24
      (claude/faimgo-return-coaching-loop-v1.md).

  BEFORE ANTHROPIC_API_KEY IS SET IN VERCEL: this route always returns
  { ok:false, reason:"not_configured" } via callCoach()'s own check — inert,
  same as Gate.js shipping switched off (money-seams §3.3). No caller should
  ever treat a non-ok response as an error to show; both wiring points must
  degrade to what they do today (never a wall — coach-constraints.md rule 4).

  GLOBAL DAILY COST CEILING (money-seams §3.6) — same honest-limit pattern
  as MAX_SENDS_PER_DAY in api/lead/route.js: a module-memory counter is a
  speed bump, not a wall, until shared state exists (it resets on every cold
  start / new deployment). It exists so a runaway client bug or an abuse
  attempt cannot spend an unbounded amount of Ben's Anthropic balance
  overnight while nobody is looking. Raise this once real usage data says
  it's too low, per money-seams' "chosen ranges, tuned once real usage exists"
  discipline applied to every other number in this project.

  PER-FID / PER-IP RATE LIMITING (added Sep 8 2026) — same overLimit()
  shape api/lead/route.js and api/profile/route.js already use, its own
  independent instance (module state isn't shared across route files —
  same reasoning those files already give: a limit here doesn't need to
  know anything about lead-sending or profile limits). This exists
  separately from the $5 allowance below: the allowance stops someone once
  they've spent real money, this stops a tight retry loop from spending it
  FAST, in the seconds before the allowance check would even see it.

  THE $5 ALLOWANCE (added Sep 8 2026) — the build-out of the decision
  already on record in claude/faimgo-ai-coach-usage-pricing-sep6.md: the AI
  coach carries a starting allowance of $5 of real usage per person,
  tracked in Postgres (sql/004_ai_usage.sql — see that file for why it's
  keyed by fid, not person_id) so it survives cold starts, unlike the
  in-memory counters above. Checked BEFORE calling the model at all (an
  exhausted allowance costs nothing to detect); the real cost of an actual
  call is recorded AFTER, computed from Anthropic's own reported token
  counts × published pricing — never estimated. On exhaustion this returns
  an ordinary { ok:false } — both callers (assessment/page.js,
  plan/page.js) already treat any non-ok reply as "fall back to the honest
  pre-AI behavior," so this needed zero client-side changes to degrade
  correctly (coach-constraints.md rule 4 / money-seams §2.4: never a wall,
  never phrased as "you're out of tokens" — the existing fallback copy in
  both callers already reads as a person, not a token-meter error).
*/

import { buildGroundingContext, callCoach } from "../../../lib/coach.js";
import { getAiUsageCents, recordAiUsage } from "../../../lib/db.js";

const MAX_COACH_CALLS_PER_DAY = 300;
let ceilingDayKey = null;
let ceilingCount = 0;

function overDailyCeiling() {
  const today = new Date().toISOString().slice(0, 10);
  if (ceilingDayKey !== today) {
    ceilingDayKey = today;
    ceilingCount = 0;
  }
  ceilingCount += 1;
  return ceilingCount > MAX_COACH_CALLS_PER_DAY;
}

const HOUR = 60 * 60 * 1000;
const MAX_PER_FID_PER_HOUR = 20; // a real conversation-ish session, generously
const MAX_PER_IP_PER_HOUR = 30;  // a household/shared IP running a few sessions

const hits = new Map();
function overLimit(key, limit, windowMs, now) {
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) { hits.set(key, recent); return true; }
  recent.push(now);
  hits.set(key, recent);
  return false;
}
function prune(now) {
  if (hits.size < 2000) return;
  for (const [k, list] of hits) {
    const keep = list.filter((t) => now - t < HOUR);
    if (keep.length) hits.set(k, keep); else hits.delete(k);
  }
}

// Real per-million-token pricing (see claude/faimgo-ai-coach-cost-estimate-sep6.md,
// checked live against Anthropic's published rates) — cents per token, not
// dollars, so the arithmetic below stays in integers until the final round.
const PRICE_CENTS_PER_TOKEN = {
  haiku: { in: 100 / 1_000_000, out: 500 / 1_000_000 },
  sonnet: { in: 200 / 1_000_000, out: 1000 / 1_000_000 },
};
const ALLOWANCE_CENTS = 500; // $5, Ben's placeholder — see the file header

function costCentsFor(modelAlias, usage) {
  const price = PRICE_CENTS_PER_TOKEN[modelAlias] || PRICE_CENTS_PER_TOKEN.haiku;
  const inTok = usage?.input_tokens || 0;
  const outTok = usage?.output_tokens || 0;
  return inTok * price.in + outTok * price.out;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const kind = String(body?.kind || "");
    const fid = body?.fid || null;
    const now = Date.now();
    const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
    prune(now);

    if (kind !== "classify_idea" && kind !== "stuck_help") {
      return Response.json({ ok: false, reason: "bad_kind" }, { status: 400 });
    }

    if (overDailyCeiling()) {
      return Response.json({ ok: false, reason: "daily_ceiling" });
    }

    // Per-caller rate limiting — see the file header. Checked before the
    // $5 allowance on purpose: a tight retry loop should hit this first,
    // cheaply, rather than needing a database round-trip to be turned away.
    if (fid && overLimit("fid:" + fid, MAX_PER_FID_PER_HOUR, HOUR, now)) {
      return Response.json({ ok: false, reason: "rate_limited" });
    }
    if (overLimit("ip:" + ip, MAX_PER_IP_PER_HOUR, HOUR, now)) {
      return Response.json({ ok: false, reason: "rate_limited" });
    }

    // The $5-per-fid allowance (claude/faimgo-ai-coach-usage-pricing-sep6.md)
    // — see the file header for why this fails open on a database problem
    // rather than refusing a real person over an unreadable balance.
    if (fid) {
      const spent = await getAiUsageCents(fid);
      if (spent >= ALLOWANCE_CENTS) {
        return Response.json({ ok: false, reason: "allowance_exhausted" });
      }
    }

    const ctx = buildGroundingContext(
      kind === "classify_idea"
        ? { kind, text: body?.text }
        : {
            kind,
            focusPlayId: body?.focusPlayId,
            situationText: body?.situationText,
            path: body?.path,
            gap: body?.gap,
            doneIds: body?.doneIds,
          }
    );

    if (!ctx) return Response.json({ ok: false, reason: "bad_input" }, { status: 400 });

    const result = await callCoach({ userContent: ctx.userContent, model: ctx.model });
    if (!result.ok) return Response.json({ ok: false, reason: result.reason });

    // Record the real cost of THIS call against the fid's running total —
    // best-effort (recordAiUsage never throws). Not airtight against two
    // genuinely concurrent requests from the same fid both reading the
    // balance before either write lands — same "speed bump, not a wall"
    // status as every other soft limit in this codebase (see api/lead's
    // own rate limiter), not worth a database transaction to close for a
    // $5 allowance.
    if (fid) {
      const costCents = costCentsFor(ctx.model, result.usage);
      if (costCents > 0) await recordAiUsage({ fid, costCents });
    }

    /* Fire-and-forget usage log, same shape as meter() in meter.js — this
       route calls it directly server-side rather than importing meter()
       (which posts back to /api/lead from the browser) so the usage record
       and the API call happen in the same request instead of a second
       round-trip the client would have to remember to make. */
    try {
      fetch(new URL("/api/lead", request.url).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "usage",
          kind: "coach_" + kind,
          fid: body?.fid || null,
          sid: body?.sid || null,
          unitsIn: result?.usage?.input_tokens ?? null,
          unitsOut: result?.usage?.output_tokens ?? null,
          ts: new Date().toISOString(),
        }),
      }).catch(() => {});
    } catch (e) { /* metering must never break the reply */ }

    return Response.json({ ok: true, reply: result.reply });
  } catch (e) {
    console.error("[FAIMGO COACH ROUTE ERROR]", e?.message);
    return Response.json({ ok: false, reason: "server_error" }, { status: 400 });
  }
}
