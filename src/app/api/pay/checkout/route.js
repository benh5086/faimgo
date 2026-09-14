/*
  Faimgo — create a Stripe Checkout Session for a coach top-up (payments Layer 2).

  Flow: the coach's "you've used the free coaching" offer POSTs { tier, fid,
  personId } here. We build a hosted Stripe Checkout Session (Stripe holds the
  card page, we never touch card data) and return its URL for the client to
  redirect to. On success Stripe fires checkout.session.completed to
  api/pay/webhook, which credits the balance.

  MERCHANT OF RECORD: the account uses Stripe Managed Payments, so Stripe is the
  seller of record and handles sales tax / VAT automatically at the account
  level. Inline price_data below is fine; no Product/Price needs pre-creating.

  INERT UNTIL CONFIGURED: with no STRIPE_SECRET_KEY set, this returns
  { ok:false, reason:"not_configured" } and the coach shows its honest
  "top-ups coming" copy instead of a button that can't work. Same discipline as
  the coach before ANTHROPIC_API_KEY existed.

  Prices come from src/lib/pricing.js (the single source). The one-time
  first-upgrade discount is applied HERE, server-side, and only if this device
  has never bought before (hasCreditGrant) — so it can't be replayed.
*/

import Stripe from "stripe";
import { tierById, discountedPriceCents } from "../../../../lib/pricing.js";
import { hasCreditGrant } from "../../../../lib/db.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return Response.json({ ok: false, reason: "not_configured" });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, reason: "bad_input" }, { status: 400 });
  }
  const tier = tierById(body?.tier);
  const fid = body?.fid ? String(body.fid) : null;
  const personId = body?.personId ? String(body.personId) : null;
  if (!tier || !fid) return Response.json({ ok: false, reason: "bad_input" }, { status: 400 });

  try {
    const stripe = new Stripe(key);
    const firstTime = !(await hasCreditGrant(fid));
    const unit = firstTime ? discountedPriceCents(tier.priceCents) : tier.priceCents;
    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: unit,
            product_data: { name: "Faimgo coaching — " + tier.label },
          },
        },
      ],
      // Everything the webhook needs to credit the right device is carried here.
      metadata: {
        fid,
        personId: personId || "",
        tier: tier.id,
        creditCents: String(tier.creditCents),
        firstTime: firstTime ? "1" : "0",
      },
      success_url: origin + "/plan?topup=success",
      cancel_url: origin + "/plan?topup=cancel",
    });

    return Response.json({ ok: true, url: session.url });
  } catch (e) {
    console.error("[FAIMGO PAY CHECKOUT ERROR]", e?.message);
    return Response.json({ ok: false, reason: "error" }, { status: 500 });
  }
}
