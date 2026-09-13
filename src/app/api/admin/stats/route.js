/*
  Faimgo — admin stats endpoint (read-only funnel/activity dashboard for Ben).

  Powers the /admin page. Returns aggregate counts from Postgres (getAdminStats
  in lib/db.js). Adds NO schema and reads no single user's private content —
  only COUNTS.

  AUTH — fail CLOSED (the opposite of the user-data fail-open pattern used
  everywhere else in this codebase, on purpose):
    - ADMIN_TOKEN must be set in the environment (Vercel env var). If it is
      NOT set, this route is DISABLED (503) — it never falls open to public.
    - The caller must send that exact token in the `x-admin-token` header.
      Compared in constant time. Wrong/absent token -> 401.
  The token is a shared secret Ben sets in Vercel; it is never sent in a URL
  (so it can't leak via logs/referrers), only in a request header. Rotate it
  by changing the Vercel env var.

  This is deliberately a low-tech gate (one shared secret), matching the
  product's stage: it protects a counts-only board, not user PII. If the admin
  surface ever grows to expose individual records, upgrade this to a real
  per-user admin login first.
*/

import crypto from "node:crypto";
import { getAdminStats } from "../../../../lib/db.js";

export const dynamic = "force-dynamic"; // never cache — always live counts
export const runtime = "nodejs";        // needs node:crypto

function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  try {
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

export async function GET(request) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    // No token configured -> the dashboard is off, not open.
    return Response.json({ ok: false, reason: "admin_disabled" }, { status: 503 });
  }
  const provided = request.headers.get("x-admin-token") || "";
  if (!safeEqual(provided, expected)) {
    return Response.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  }
  try {
    const stats = await getAdminStats();
    return Response.json(stats);
  } catch (e) {
    console.error("[FAIMGO ADMIN ROUTE]", e?.message);
    return Response.json({ ok: false, reason: "error" }, { status: 500 });
  }
}
