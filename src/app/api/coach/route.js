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
*/

import { buildGroundingContext, callCoach } from "../../../lib/coach.js";

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

export async function POST(request) {
  try {
    const body = await request.json();
    const kind = String(body?.kind || "");

    if (kind !== "classify_idea" && kind !== "stuck_help") {
      return Response.json({ ok: false, reason: "bad_kind" }, { status: 400 });
    }

    if (overDailyCeiling()) {
      return Response.json({ ok: false, reason: "daily_ceiling" });
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
