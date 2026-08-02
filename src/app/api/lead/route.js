/*
  Faimgo lead + funnel endpoint (v5).

  Accepts two payload types from the assessment:
    { type: "event", name, sid, fid, visits, ts }    — funnel steps: start, s1_done, s2_done,
                                                       gate_view, resumed, plan_reopened, restart
    { type: "lead", sid, fid, visits, email, answers, results,
      otherIdea?, protectFrom?, version, ts }        — the submitted lead WITH the results we showed them

  WHAT CHANGED IN v5 — identity.
  Every payload now carries `fid` as well as `sid`. `sid` is one sitting;
  `fid` is the person, and it persists in their browser across visits. Until
  v5 the id was regenerated on every page mount, which meant a single person
  who refreshed the page was logged as two strangers and there was no way to
  tell a returning visitor from a new one. There are still no accounts — but
  from today the data has a spine, so when accounts arrive the history we've
  been collecting can be attached to the right person instead of discarded.

  WHAT CHANGED IN v4 — we now actually send the plan.
  The gate asks "Where should we send your plan so you don't lose it?"
  Until now we collected the address and sent nothing, which meant the
  first promise the product ever makes was one it broke. This route now
  emails the full plan (see lib/planEmail.js) via Resend.

  Env vars (Vercel → Project → Settings → Environment Variables):
    RESEND_API_KEY   required for sending. Without it we log and skip —
                     the user still sees their results, nothing breaks.
    PLAN_FROM        e.g. "Faimgo <plan@yourdomain.com>". Defaults to the
                     Resend sandbox sender, which only delivers to your own
                     address — fine for testing, not for real users.
    PLAN_REPLY_TO    where replies land. The email invites them; someone
                     has to be there.
    SITE_URL         used for the "retake" link. Defaults to the live site.
    LEAD_WEBHOOK_URL optional: every payload is also POSTed there as JSON
                     (Google Apps Script → Sheet, Zapier, etc).

  Storage today: structured console.log, visible in Vercel → Project → Logs.
    Search "FAIMGO LEAD"  → submitted leads
    Search "FAIMGO EVENT" → funnel events (compute drop-off per sid)
    Search "FAIMGO MAIL"  → send outcome per lead
*/

import { renderPlanEmail } from "../../../lib/planEmail.js";

const SANDBOX_FROM = "Faimgo <onboarding@resend.dev>";

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

/*
  Send the plan. Returns a short status string for logging.
  This function must never throw — a mail failure is our problem,
  not something the person should ever see instead of their results.
*/
async function sendPlan({ email, answers, results, otherIdea, protectFrom }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return "skipped:no-api-key";
  if (!email) return "skipped:no-address";

  const site = process.env.SITE_URL || "https://faimgo.vercel.app";
  let mail;
  try {
    mail = renderPlanEmail({
      answers, results, otherIdea, protectFrom,
      planUrl: site + "/assessment",
    });
  } catch (e) {
    console.error("[FAIMGO MAIL RENDER ERROR]", e?.message);
    return "error:render";
  }

  const body = {
    from: process.env.PLAN_FROM || SANDBOX_FROM,
    to: [email],
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
  };
  if (process.env.PLAN_REPLY_TO) body.reply_to = process.env.PLAN_REPLY_TO;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[FAIMGO MAIL FAIL]", res.status, detail.slice(0, 300));
      return "error:" + res.status;
    }
    return "sent";
  } catch (e) {
    console.error("[FAIMGO MAIL ERROR]", e?.message);
    return "error:network";
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    if (body?.type === "event") {
      console.log("[FAIMGO EVENT]", JSON.stringify({
        name: body.name, sid: body.sid, fid: body.fid, visits: body.visits, ts: body.ts,
      }));
      await forward(body);
      return Response.json({ ok: true });
    }

    // default: treat as lead
    const { sid, fid, visits, email, answers, results, otherIdea, protectFrom, version, ts } = body || {};
    console.log("[FAIMGO LEAD]", JSON.stringify({ sid, fid, visits, email, version, ts, otherIdea, protectFrom, results, answers }));

    const [mail] = await Promise.all([
      sendPlan({ email, answers, results, otherIdea, protectFrom }),
      forward(body),
    ]);
    console.log("[FAIMGO MAIL]", JSON.stringify({ sid, fid, email, status: mail }));

    // `emailed` lets the results screen tell the truth about what happened.
    return Response.json({ ok: true, emailed: mail === "sent" });
  } catch (e) {
    console.error("[FAIMGO LEAD ERROR]", e?.message);
    return Response.json({ ok: false }, { status: 400 });
  }
}
