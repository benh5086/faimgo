/*
  Faimgo — Stripe webhook: credit a coach top-up on successful payment (Layer 2).

  Stripe calls this after a Checkout Session completes. We verify the signature
  against STRIPE_WEBHOOK_SECRET (so only real Stripe events are honoured), read
  the metadata the checkout route stamped on the session (fid, creditCents,
  tier), and add those credits to the device's balance via addCredits() — which
  is idempotent on the session id, so Stripe's automatic retries can never
  double-credit.

  Signature verification needs the RAW request body, so we read request.text()
  and never JSON.parse it ourselves.

  INERT UNTIL CONFIGURED: no keys -> 503, nothing happens.
*/

import Stripe from "stripe";
import { addCredits } from "../../../../lib/db.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const key = process.env.STRIPE_SECRET_KEY;
  const whsec = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key || !whsec) return Response.json({ ok: false, reason: "not_configured" }, { status: 503 });

  const stripe = new Stripe(key);
  const sig = request.headers.get("stripe-signature") || "";
  const raw = await request.text();

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, whsec);
  } catch (e) {
    console.error("[FAIMGO PAY WEBHOOK] bad signature", e?.message);
    return Response.json({ ok: false, reason: "bad_signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object || {};
      const m = s.metadata || {};
      const cents = parseInt(m.creditCents, 10);
      const fid = m.fid || null;
      if (fid && Number.isFinite(cents) && cents > 0 && s.payment_status === "paid") {
        await addCredits({
          fid,
          personId: m.personId || null,
          cents,
          paymentId: s.id, // idempotency key
          tier: m.tier || null,
          amountPaidCents: typeof s.amount_total === "number" ? s.amount_total : null,
        });
      }
    }
  } catch (e) {
    // 500 so Stripe retries; addCredits is idempotent, so a retry is safe.
    console.error("[FAIMGO PAY WEBHOOK] handler error", e?.message);
    return Response.json({ ok: false }, { status: 500 });
  }

  return Response.json({ received: true });
}
