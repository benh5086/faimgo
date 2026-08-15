/*
  Faimgo money seams — metering and entitlement.

  WHY THIS FILE EXISTS BEFORE THERE IS ANYTHING TO METER
  There is no paid feature live today. The AI coach is designed and not
  built (see plan/page.js's honest "Not built yet" block). This file exists
  anyway, on purpose, per claude/faimgo-money-seams.md §3: the call site is
  supposed to exist before the capability does, so that turning billing on
  later is a config change inside these two functions instead of a retrofit
  across every place a chargeable action might eventually live.

  THE TWO FUNCTIONS, AND WHY THEY ARE SEPARATE
  meter() RECORDS that a chargeable thing happened. allowance() DECIDES
  whether one is currently allowed to happen. A system that only has the
  first can bill accurately but never say no in time to matter; a system
  that only has the second can gate access but never reconcile what it
  actually cost. Both are needed and neither substitutes for the other.

  THE GOVERNING RULE FROM THE MONEY-SEAMS DOC, RESTATED HERE SO IT ISN'T
  MISSED BY WHOEVER WIRES THE FIRST REAL CALLER: degrade, never refuse.
  When allowance() eventually says no, the caller's job is to step down to
  something free (the static playbook, a person) — never to show a wall.
  allowance() enforces this by always returning a `reason` alongside a
  `false` ok, specifically so the caller has something honest to say instead
  of a generic "upgrade now."

  BOTH FUNCTIONS MUST NEVER THROW AND NEVER BLOCK THE PAGE. Same rule as
  track.js's analytics calls: a metering or entitlement failure is our
  problem, and it must never be the reason someone can't use the product.
*/

/*
  Record that a chargeable action happened. Fire-and-forget, exactly like
  track() in track.js — the caller does not await this to decide whether to
  proceed; allowance() is the pre-check for that.

  kind: a short string naming what was consumed (e.g. "coach_ask"). Not
  constrained to an enum here for the same reason event names in track.js
  aren't whitelisted — the Sheet-side handling reads by field name, not by a
  fixed list, so a new kind works the moment it's sent.

  unitsIn / unitsOut: whatever unit the eventual capability actually bills
  in (tokens today, could be something else later — a support-ticket count,
  a generated-image count). Left as plain numbers rather than typed, since
  the unit itself is not yet decided (money-seams.md §2.9).

  TODAY: posts to /api/lead with type:"usage". route.js logs it to Vercel
  (searchable as "FAIMGO USAGE", same pattern as FAIMGO EVENT) and forwards
  the raw payload to LEAD_WEBHOOK_URL exactly like every other payload type.
  The moment a "Usage" tab and its header row exist in the Apps Script's
  HEADERS map (a one-line edit — see the Apps Script notes in
  claude/faimgo-open-items.md), this data starts landing in the Sheet with
  no further code change here. Until then it's still real, still visible in
  Vercel logs, and still forwarded — nothing is thrown away waiting for the
  Sheet side to catch up.

  LATER: this function's body changes to write to the database and,
  eventually, to Stripe. The signature does not need to change, which is the
  entire point of writing it now.
*/
export function meter(args) {
  try {
    const { fid, sid, kind, unitsIn, unitsOut } = args || {};
    fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "usage",
        kind: kind || "unknown",
        fid: fid || null,
        sid: sid || null,
        unitsIn: typeof unitsIn === "number" ? unitsIn : null,
        unitsOut: typeof unitsOut === "number" ? unitsOut : null,
        ts: new Date().toISOString(),
      }),
      keepalive: true,
    }).catch(() => {});
  } catch (e) { /* metering must never break the flow */ }
}

/*
  Is this chargeable action currently allowed for this person?

  Returns a Promise, deliberately, even though today's answer is always the
  same generous constant and could be computed synchronously. Every future
  caller (starting with <Gate> in Gate.js) already awaits this. When the
  body changes to a real balance lookup against the database — the only
  version of this function that can ever refuse anyone — no call site
  changes, which is the actual seam this function exists to bury.

  `need` names what's being asked for (e.g. "coach_ask"), unused today but
  threaded through now so a per-capability balance is a body change here,
  not a new parameter every caller has to be updated to pass.

  TODAY: always { ok: true, remaining: Infinity, reason: null }. No real
  person can be refused by something that doesn't exist yet.

  LATER: reads a real balance. reason must always be filled in on a `false`
  — see the file header. A refusal with no reason is a wall; a refusal with
  a reason is a place to degrade to.
*/
export async function allowance(fid, need) {
  return { ok: true, remaining: Infinity, reason: null };
}
