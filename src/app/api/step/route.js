/*
  Faimgo — mirrors a single step completion into Postgres (person_steps).

  Called from /plan's onToggle right after markStep() has already succeeded
  locally — this is a best-effort background call, never on the critical
  path of the click. The local write (store.js) is the one thing that must
  never fail; this call can silently fail without the person noticing
  anything except that their public completed-count doesn't move yet.

  No auth beyond "you know your own email" — same trust level as
  api/lead's mirrorPlan: this only ever records a person's own action
  against their own already-submitted address, it doesn't read or expose
  anyone else's data, so a proof-of-ownership token would be friction with
  no matching security benefit here.

  { email, fid, playId, done, note }
*/

import { mirrorStep } from "../../../lib/db.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body?.email || "").trim();
    const fid = body?.fid || null;
    const playId = String(body?.playId || "").trim();
    const done = Boolean(body?.done);
    const note = body?.note ? String(body.note).slice(0, 500) : null;

    if (!email || !playId) return Response.json({ ok: false }, { status: 400 });

    const ok = await mirrorStep({ email, fid, playId, done, note });
    return Response.json({ ok });
  } catch (e) {
    console.error("[FAIMGO STEP ROUTE ERROR]", e?.message);
    return Response.json({ ok: false }, { status: 400 });
  }
}
