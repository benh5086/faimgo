/*
  Faimgo lead + funnel endpoint (v6).

  Accepts two payload types from the assessment:
    { type: "event", name, sid, fid, visits, ts }    — funnel steps: start, s1_done, s2_done,
                                                       gate_view, resumed, plan_reopened, restart,
                                                       retry_sent, retry_failed
    { type: "lead", sid, fid, visits, email, answers, results,
      otherIdea?, protectFrom?, version, ts }        — the submitted lead WITH the results we showed them

  WHAT CHANGED IN v6 — this endpoint stops being an open email sender.
  Until now anyone could POST an address here and we would mail them, with no
  rate limit and no check that the payload was a real assessment. The Resend
  sandbox sender was the only thing containing it: sends to anyone but the
  account owner fail with 403. The moment PLAN_FROM points at a verified
  domain, that containment disappears and this becomes a way to send mail from
  our domain to any address on earth — which costs us the domain's reputation
  and, plausibly, the Resend account. So the guard lands BEFORE the domain,
  not after.

  Three checks now stand in front of sendPlan():
    1. The payload has to look like a real assessment — enough answers, and
       results naming paths that actually exist.
    2. Rate limits per IP, per address, and a global daily ceiling.
    3. A server-side email format check. The client's check is a convenience,
       not a control; anything that only runs in the browser is advisory.

  A blocked request still returns ok:true with emailed:false. The person on
  the other end sees their plan and the honest "we couldn't send it" card with
  a retry button; they never see an error. Every block is logged.

  HONEST LIMIT: these counters live in module memory, which on Vercel means
  per serverless instance, reset on cold start, and there may be several
  instances at once. They are speed bumps, not a wall. Real enforcement needs
  shared state — it arrives with the database.

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
                     Do not set this until the guard above is live.
    PLAN_REPLY_TO    where replies land. The email invites them; someone
                     has to be there. Set Aug 2, 2026.
    SITE_URL         used for the "open Faimgo again" link. Defaults to the live site.
    LEAD_WEBHOOK_URL optional: every payload is also POSTed there as JSON
                     (Google Apps Script → Sheet, Zapier, etc).
    FEEDBACK_WEBHOOK_URL optional: mail failures are POSTed here too, so a
                     broken send reaches somewhere a human actually looks.

  Storage today: structured console.log, visible in Vercel → Project → Logs.
    Search "FAIMGO LEAD"    → submitted leads
    Search "FAIMGO EVENT"   → funnel events (compute drop-off per sid)
    Search "FAIMGO MAIL"    → send outcome per lead
    Search "FAIMGO BLOCKED" → requests the guard refused

  NOTE: Vercel's Hobby plan keeps runtime logs for ONE HOUR. These lines are
  for debugging, not for record-keeping. The Sheet behind LEAD_WEBHOOK_URL is
  the only durable copy of a lead until the database exists.
*/

import { renderPlanEmail } from "../../../lib/planEmail.js";
import { PATHS } from "../../../lib/paths.js";

const SANDBOX_FROM = "Faimgo <onboarding@resend.dev>";

/* ============================================================
   THE GUARD
   ============================================================ */

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const MAX_PER_IP_PER_HOUR = 5;      // a real person needs one, maybe two after a retry
const MAX_PER_ADDRESS_PER_DAY = 3;  // same, per inbox
const MAX_SENDS_PER_DAY = 200;      // global backstop, far above any honest day we've had

const VALID_PATH_IDS = new Set(PATHS.map((p) => p.id));
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* keyed "ip:1.2.3.4" / "to:someone@example.com" → array of timestamps */
const hits = new Map();
let dayStamp = 0;
let daySends = 0;

function overLimit(key, limit, windowMs, now) {
  const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

function overDailyCap(now) {
  const day = Math.floor(now / DAY);
  if (day !== dayStamp) { dayStamp = day; daySends = 0; }
  if (daySends >= MAX_SENDS_PER_DAY) return true;
  daySends += 1;
  return false;
}

/* Keep the map from growing without bound on a long-lived instance. */
function prune(now) {
  if (hits.size < 2000) return;
  for (const [k, list] of hits) {
    const keep = list.filter((t) => now - t < DAY);
    if (keep.length) hits.set(k, keep);
    else hits.delete(k);
  }
}

/*
  Does this payload look like someone who actually took the assessment?
  A real submission carries several answer keys and results naming paths from
  our own library. An empty {} used to render a perfectly valid email — which
  is exactly what an abuser would send.
*/
function looksLikeRealAssessment(answers, results) {
  if (!answers || typeof answers !== "object") return false;
  const answered = Object.keys(answers).filter((k) => k.startsWith("q"));
  if (answered.length < 3) return false;
  if (!results || typeof results !== "object") return false;
  const ids = [results.chosen, results.fastestWin, results.longTerm].filter(Boolean);
  if (!ids.length) return false;
  return ids.every((id) => VALID_PATH_IDS.has(id));
}

/* Returns null if the request may send, or a short reason string if not. */
function blockReason({ ip, email, answers, results }, now) {
  if (!email || !EMAIL_RE.test(String(email))) return "bad-address";
  if (!looksLikeRealAssessment(answers, results)) return "not-an-assessment";
  if (overLimit("ip:" + ip, MAX_PER_IP_PER_HOUR, HOUR, now)) return "ip-rate";
  if (overLimit("to:" + String(email).toLowerCase(), MAX_PER_ADDRESS_PER_DAY, DAY, now)) return "address-rate";
  if (overDailyCap(now)) return "daily-cap";
  return null;
}

/* ============================================================
   OUTBOUND
   ============================================================ */

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
  Tell a human when the send breaks.
  Without this, a failing send is visible only in Vercel's logs — which on the
  Hobby plan are gone within the hour. This puts it in the same Sheet the
  feedback goes to, which is somewhere we actually look.
*/
async function alertMailFailure({ status, email, sid, fid }) {
  const url = process.env.FEEDBACK_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "alert",
        category: "mail-failure",
        message: `Plan email did not send (${status}) for ${email}`,
        email,
        context: JSON.stringify({ status, sid, fid }),
        page: "/api/lead",
        ts: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(4000),
    });
  } catch (e) {
    console.error("[FAIMGO ALERT ERROR]", e?.message);
  }
}

/*
  Send the plan. Returns a short status string for logging.
  This function must never throw — a mail failure is our problem,
  not something the person should ever see instead of their results.
*/
async function sendPlan({ email, answers, results, otherIdea, protectFrom, planId }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return "skipped:no-api-key";
  if (!email) return "skipped:no-address";

  const site = process.env.SITE_URL || "https://faimgo.com";
  // planId, when present, makes the link point at THIS submission specifically —
  // without it, /plan falls back to whatever is most recently active on the
  // device that opens the link, which is the single-slot overwrite this batch fixes.
  const planUrl = site + "/plan" + (planId ? "?id=" + encodeURIComponent(planId) : "");
  let mail;
  try {
    mail = renderPlanEmail({
      answers, results, otherIdea, protectFrom,
      planUrl,
      editUrl: site + "/assessment",
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

/* ============================================================
   HANDLER
   ============================================================ */

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
    const { sid, fid, visits, email, answers, results, otherIdea, protectFrom, planId, version, ts } = body || {};
    console.log("[FAIMGO LEAD]", JSON.stringify({ sid, fid, visits, email, version, ts, otherIdea, protectFrom, results, answers, planId }));

    const now = Date.now();
    const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
    prune(now);
    const blocked = blockReason({ ip, email, answers, results }, now);

    if (blocked) {
      // Log it, still record the lead, send nothing. A real person who trips a
      // limit sees the retry card, never an error.
      console.warn("[FAIMGO BLOCKED]", JSON.stringify({ reason: blocked, ip, email, sid, fid }));
      await forward(body);
      return Response.json({ ok: true, emailed: false });
    }

    const [mail] = await Promise.all([
      sendPlan({ email, answers, results, otherIdea, protectFrom, planId }),
      forward(body),
    ]);
    console.log("[FAIMGO MAIL]", JSON.stringify({ sid, fid, email, status: mail }));

    if (String(mail).startsWith("error")) {
      await alertMailFailure({ status: mail, email, sid, fid });
    }

    // `emailed` lets the results screen tell the truth about what happened.
    return Response.json({ ok: true, emailed: mail === "sent" });
  } catch (e) {
    console.error("[FAIMGO LEAD ERROR]", e?.message);
    return Response.json({ ok: false }, { status: 400 });
  }
}
