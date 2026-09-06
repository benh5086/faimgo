/*
  Faimgo — account/profile API.

  See claude/faimgo-profile-scope-sep6.md for the full reasoning behind this
  batch. Four actions, dispatched by `body.action`, same single-endpoint-
  typed-payload pattern as api/lead and api/restore:

    { action: "request", email, fid }
      → same shape as api/restore's request: mints a token via
        createMagicToken (src/lib/db.js — the SAME magic_tokens table
        restore already uses; only the email template and destination URL
        differ, there is no reason to duplicate the token machinery for a
        second purpose), emails an "access your account" link, and always
        returns { ok: true } regardless of whether the email is known — same
        no-probing reasoning as restore's own comment.

    { action: "verify", token, fid }
      → verifyMagicToken (FAILS CLOSED — see db.js), and on success also
        mints a long-lived edit-session token (createEditSession) so this
        device doesn't need to re-verify on every future visit to /account,
        matching the "verify once per device" pattern the rest of the
        product already uses for /restore. Returns { ok, email, personId,
        editSessionToken }.

    { action: "get", personId }
      → PUBLIC, no auth — this is the link-shareable profile view
        (getPublicProfile in db.js already omits anything private).

    { action: "update", personId, editSessionToken, username, bio }
      → requires editSessionToken to verify (server-side) to the SAME
        personId being updated. A bare personId is never sufficient to
        write — only a verified session is. Delegates the actual write to
        updateProfile (db.js), which owns the UNIQUE-username collision
        handling.

  RATE LIMITING — own independent instance, same shape and same honest
  caveat as every other route in this file (in-memory per serverless
  instance — a speed bump, not a wall, until real shared state exists).
*/

import { createMagicToken, verifyMagicToken, createEditSession, verifyEditSession, getPublicProfile, updateProfile } from "../../../lib/db.js";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const MAX_PER_ADDRESS_PER_DAY = 5;
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

function renderAccountEmail(accountUrl) {
  const subject = "Access your Faimgo account";
  const html = `<div style="max-width:520px;margin:0 auto;padding:32px 24px;font:15px/1.6 Helvetica,Arial,sans-serif;color:${C.ink};">
    <div style="font:700 20px/1.3 Helvetica,Arial,sans-serif;color:${C.green};margin:0 0 16px;">Get into your account</div>
    <p style="margin:0 0 20px;">Someone — hopefully you — asked to access the Faimgo account tied to this email. Click below within 30 minutes. If this wasn't you, just ignore this email; nothing happens unless the link is clicked.</p>
    <a href="${esc(accountUrl)}" style="display:inline-block;background:${C.green};color:${C.cream};text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;">Open my account</a>
    <p style="margin:24px 0 0;font-size:13px;color:${C.gray};">This link works once and expires in 30 minutes. You'll only need to do this the first time on a new device — after that, this browser remembers you.</p>
  </div>`;
  const text = `Get into your Faimgo account.\n\nSomeone (hopefully you) asked to access the account tied to this email. Open this link within 30 minutes:\n${accountUrl}\n\nIf this wasn't you, ignore this email — nothing happens unless the link is clicked.\n\nThis link works once. You'll only need to do this the first time on a new device.`;
  return { subject, html, text };
}

async function sendAccountEmail({ email, accountUrl }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return "skipped:no-api-key";
  const mail = renderAccountEmail(accountUrl);
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
      console.error("[FAIMGO ACCOUNT MAIL FAIL]", res.status, detail.slice(0, 300));
      return "error:" + res.status;
    }
    return "sent";
  } catch (e) {
    console.error("[FAIMGO ACCOUNT MAIL ERROR]", e?.message);
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
      const respondOk = () => Response.json({ ok: true });

      if (!EMAIL_RE.test(email)) return respondOk();
      if (overLimit("ip:" + ip, MAX_PER_IP_PER_HOUR, HOUR, now)) {
        console.warn("[FAIMGO ACCOUNT BLOCKED]", JSON.stringify({ reason: "ip-rate", ip }));
        return respondOk();
      }
      if (overLimit("to:" + email, MAX_PER_ADDRESS_PER_DAY, DAY, now)) {
        console.warn("[FAIMGO ACCOUNT BLOCKED]", JSON.stringify({ reason: "address-rate", email }));
        return respondOk();
      }

      const token = await createMagicToken({ email, fid });
      if (!token) {
        console.error("[FAIMGO ACCOUNT ERROR] could not create token for", email);
        return respondOk();
      }

      const site = process.env.SITE_URL || "https://faimgo.com";
      const accountUrl = site + "/account?token=" + encodeURIComponent(token);
      const mailStatus = await sendAccountEmail({ email, accountUrl });
      console.log("[FAIMGO ACCOUNT REQUEST]", JSON.stringify({ email, ip, mailStatus }));
      return respondOk();
    }

    if (body?.action === "verify") {
      const token = String(body.token || "");
      const fid = body.fid || null;
      if (!token) return Response.json({ ok: false });

      if (overLimit("verify-ip:" + ip, 20, HOUR, now)) {
        console.warn("[FAIMGO ACCOUNT BLOCKED]", JSON.stringify({ reason: "verify-ip-rate", ip }));
        return Response.json({ ok: false });
      }

      const result = await verifyMagicToken({ token, fid });
      if (!result.ok || !result.personId) return Response.json({ ok: false });

      const editSessionToken = await createEditSession(result.personId);
      console.log("[FAIMGO ACCOUNT VERIFY]", JSON.stringify({ ok: true, ip, hasSession: Boolean(editSessionToken) }));
      return Response.json({ ok: true, email: result.email, personId: result.personId, editSessionToken });
    }

    if (body?.action === "get") {
      const personId = String(body.personId || "");
      if (!personId) return Response.json({ ok: false });
      if (overLimit("get-ip:" + ip, 60, HOUR, now)) {
        return Response.json({ ok: false });
      }
      const profile = await getPublicProfile(personId);
      if (!profile) return Response.json({ ok: false });
      return Response.json({ ok: true, profile });
    }

    if (body?.action === "update") {
      const editSessionToken = String(body.editSessionToken || "");
      if (!editSessionToken) return Response.json({ ok: false, reason: "no-session" });

      if (overLimit("update-ip:" + ip, 30, HOUR, now)) {
        return Response.json({ ok: false, reason: "rate-limited" });
      }

      const personId = await verifyEditSession(editSessionToken);
      if (!personId) return Response.json({ ok: false, reason: "session-invalid" });

      const username = String(body.username || "").trim().slice(0, 40) || null;
      const bio = String(body.bio || "").trim().slice(0, 500) || null;
      // Only pass headline through when the caller actually sent one —
      // see updateProfile()'s own comment on why `undefined` vs `null`
      // matters here.
      const headline = body.headline !== undefined
        ? (String(body.headline || "").trim().slice(0, 80) || null)
        : undefined;
      const result = await updateProfile({ personId, username, bio, headline });
      return Response.json(result);
    }

    return Response.json({ ok: false }, { status: 400 });
  } catch (e) {
    console.error("[FAIMGO ACCOUNT ROUTE ERROR]", e?.message);
    return Response.json({ ok: false }, { status: 400 });
  }
}
