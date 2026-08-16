/*
  Faimgo — cross-device restore ("Already did this? Get your plan back").

  Two actions in one endpoint, dispatched by `body.action`, mirroring the
  single-endpoint-typed-payload pattern already used in api/lead/route.js
  rather than spreading this across more route files than the feature needs:

    { action: "request", email, fid }
      → generates a one-time token (see src/lib/db.js's createMagicToken),
        emails a restore link to that address, and returns { ok: true } —
        NEVER reveals whether the email is actually known to us. Doing so
        would let anyone probe which addresses have used Faimgo, which is
        exactly the kind of thing a privacy-minded product must not leak.
        The email itself is the only place that distinction is visible, and
        only to the address's own owner.

    { action: "verify", token, fid }
      → checks the token (src/lib/db.js's verifyMagicToken, which FAILS
        CLOSED — see its own comment), links this device (fid) to the
        person if valid, and returns their saved plans for the client to
        merge into localStorage (src/lib/store.js's mergeRestoredPlans()).

  RATE LIMITING — same shape as api/lead/route.js's guard, its own
  independent instance (module state isn't shared across route files, which
  is fine — a limit on "how many restore emails per address per day" doesn't
  need to know anything about lead-sending limits). Same honest caveat as
  that file: this is in-memory per serverless instance, a speed bump, not a
  wall, until real shared state exists.
*/

import { createMagicToken, verifyMagicToken } from "../../../lib/db.js";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const MAX_PER_ADDRESS_PER_DAY = 5; // higher than the lead limit — a lost/expired link is a normal reason to ask again
const MAX_PER_IP_PER_HOUR = 8;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SANDBOX_FROM = "Faimgo <onboarding@resend.dev>";

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
    const keep = list.filter((t) => now - t < DAY);
    if (keep.length) hits.set(k, keep); else hits.delete(k);
  }
}

const C = { green: "#1B3A2D", gold: "#8A6A14", cream: "#F1F4F2", ink: "#15181B", gray: "#464C54" };
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function renderRestoreEmail(restoreUrl) {
  const subject = "Get your Faimgo plan back";
  const html = `<div style="max-width:520px;margin:0 auto;padding:32px 24px;font:15px/1.6 Helvetica,Arial,sans-serif;color:${C.ink};">
    <div style="font:700 20px/1.3 Helvetica,Arial,sans-serif;color:${C.green};margin:0 0 16px;">Reconnect this device to your plans</div>
    <p style="margin:0 0 20px;">Someone — hopefully you — asked to see your Faimgo plans on this browser. Click below within 30 minutes to bring them over. If this wasn't you, just ignore this email; nothing happens unless the link is clicked.</p>
    <a href="${esc(restoreUrl)}" style="display:inline-block;background:${C.green};color:${C.cream};text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;">Get my plans</a>
    <p style="margin:24px 0 0;font-size:13px;color:${C.gray};">This link works once and expires in 30 minutes. You'll only need to do this the first time on a new device — after that, this browser remembers you the same as before.</p>
  </div>`;
  const text = `Reconnect this device to your Faimgo plans.\n\nSomeone (hopefully you) asked to see your plans on this browser. Open this link within 30 minutes:\n${restoreUrl}\n\nIf this wasn't you, ignore this email — nothing happens unless the link is clicked.\n\nThis link works once. You'll only need to do this the first time on a new device.`;
  return { subject, html, text };
}

async function sendRestoreEmail({ email, restoreUrl }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return "skipped:no-api-key";
  const mail = renderRestoreEmail(restoreUrl);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.PLAN_FROM || SANDBOX_FROM,
        to: [email],
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[FAIMGO RESTORE MAIL FAIL]", res.status, detail.slice(0, 300));
      return "error:" + res.status;
    }
    return "sent";
  } catch (e) {
    console.error("[FAIMGO RESTORE MAIL ERROR]", e?.message);
    return "error:network";
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const now = Date.now();
    const ip = (request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
    prune(now);

    if (body?.action === "request") {
      const email = String(body.email || "").toLowerCase().trim();
      const fid = body.fid || null;

      // Always the same response shape whether the guard trips or not — see
      // the file header on why this must never reveal which branch ran.
      const respondOk = () => Response.json({ ok: true });

      if (!EMAIL_RE.test(email)) return respondOk();
      if (overLimit("ip:" + ip, MAX_PER_IP_PER_HOUR, HOUR, now)) {
        console.warn("[FAIMGO RESTORE BLOCKED]", JSON.stringify({ reason: "ip-rate", ip }));
        return respondOk();
      }
      if (overLimit("to:" + email, MAX_PER_ADDRESS_PER_DAY, DAY, now)) {
        console.warn("[FAIMGO RESTORE BLOCKED]", JSON.stringify({ reason: "address-rate", email }));
        return respondOk();
      }

      const token = await createMagicToken({ email, fid });
      if (!token) {
        // No database configured, or the write failed — log it, but still
        // return ok:true so the response shape never leaks which case this
        // is. There is genuinely no link to send; that's a server-side
        // problem to fix, not something to describe differently to a
        // stranger probing the endpoint.
        console.error("[FAIMGO RESTORE ERROR] could not create token for", email);
        return respondOk();
      }

      const site = process.env.SITE_URL || "https://faimgo.com";
      const restoreUrl = site + "/restore?token=" + encodeURIComponent(token);
      const mailStatus = await sendRestoreEmail({ email, restoreUrl });
      console.log("[FAIMGO RESTORE REQUEST]", JSON.stringify({ email, ip, mailStatus }));
      return respondOk();
    }

    if (body?.action === "verify") {
      const token = String(body.token || "");
      const fid = body.fid || null;
      if (!token) return Response.json({ ok: false });

      // A blunt IP throttle on verify attempts too — this is the one place
      // in the feature where getting the guard wrong in the loose direction
      // has real teeth (see verifyMagicToken's own fail-closed design), so a
      // brute-force attempt against short-lived tokens gets slowed here as
      // well, not just relying on token entropy alone.
      if (overLimit("verify-ip:" + ip, 20, HOUR, now)) {
        console.warn("[FAIMGO RESTORE BLOCKED]", JSON.stringify({ reason: "verify-ip-rate", ip }));
        return Response.json({ ok: false });
      }

      const result = await verifyMagicToken({ token, fid });
      console.log("[FAIMGO RESTORE VERIFY]", JSON.stringify({ ok: result.ok, ip }));
      if (!result.ok) return Response.json({ ok: false });
      return Response.json({ ok: true, email: result.email, plans: result.plans || [] });
    }

    return Response.json({ ok: false }, { status: 400 });
  } catch (e) {
    console.error("[FAIMGO RESTORE ROUTE ERROR]", e?.message);
    return Response.json({ ok: false }, { status: 400 });
  }
}
