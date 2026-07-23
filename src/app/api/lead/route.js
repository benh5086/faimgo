/*
  Faimgo lead + funnel endpoint (v3).

  Accepts two payload types from the assessment:
    { type: "event", name, sid, ts }                 — funnel steps: start, s1_done, s2_done, gate_view
    { type: "lead", sid, email, answers, results,
      otherIdea?, protectFrom?, version, ts }        — the submitted lead WITH the results we showed them

  Storage today: structured console.log, visible in Vercel → Project → Logs.
    Search "FAIMGO LEAD"  → submitted leads
    Search "FAIMGO EVENT" → funnel events (compute drop-off per sid)

  Real destination (no code change needed): set the env var LEAD_WEBHOOK_URL
  in Vercel → Project → Settings → Environment Variables, and every payload is
  also POSTed there as JSON. Point it at a Google Apps Script web app (writes
  to a Sheet), Formspree, Zapier, or anything that accepts JSON.
*/

async function forward(payload) {
  const url = process.env.LEAD_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000),
    });
  } catch (e) {
    console.error("[FAIMGO WEBHOOK ERROR]", e?.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (body?.type === "event") {
      console.log("[FAIMGO EVENT]", JSON.stringify({ name: body.name, sid: body.sid, ts: body.ts }));
      await forward(body);
      return Response.json({ ok: true });
    }
    // default: treat as lead
    const { sid, email, answers, results, otherIdea, protectFrom, version, ts } = body || {};
    console.log("[FAIMGO LEAD]", JSON.stringify({ sid, email, version, ts, otherIdea, protectFrom, results, answers }));
    await forward(body);
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[FAIMGO LEAD ERROR]", e?.message);
    return Response.json({ ok: false }, { status: 400 });
  }
}
