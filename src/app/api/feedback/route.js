/*
  Faimgo feedback endpoint.

  Accepts: { rating?, message?, email?, context, page, ts }
  Storage today: structured console.log, visible in Vercel → Project → Logs
    (search "FAIMGO FEEDBACK").

  Real destination (no code change needed): set env var FEEDBACK_WEBHOOK_URL
  in Vercel → Project → Settings → Environment Variables. Every submission is
  also POSTed there as JSON — point it at a Google Apps Script web app that
  appends to a Sheet (and can expose a protected read link the weekly
  scheduled-task summarizer fetches).
*/

async function forward(payload) {
  const url = process.env.FEEDBACK_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000),
    });
  } catch (e) {
    console.error("[FAIMGO FEEDBACK WEBHOOK ERROR]", e?.message);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { rating, message, email, context, page, ts } = body || {};
    console.log("[FAIMGO FEEDBACK]", JSON.stringify({ rating, message, email, context, page, ts }));
    await forward({ rating, message, email, context, page, ts });
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[FAIMGO FEEDBACK ERROR]", e?.message);
    return Response.json({ ok: false }, { status: 400 });
  }
}
