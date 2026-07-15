/*
  Faimgo lead capture — v1 stub.

  For now this logs each assessment lead to the server console, which is
  visible in Vercel → Project → Logs. It always returns ok so the user's
  results are never blocked.

  NEXT STEP (when ready): swap the console.log for a real destination —
  e.g. Resend (email), a Google Sheet via API, or a form service.
  The client code in /assessment never needs to change.
*/

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, answers, otherIdea, ts } = body || {};
    console.log("[FAIMGO LEAD]", JSON.stringify({ email, otherIdea, ts, answers }));
    return Response.json({ ok: true });
  } catch (e) {
    console.error("[FAIMGO LEAD ERROR]", e?.message);
    return Response.json({ ok: false }, { status: 400 });
  }
}
