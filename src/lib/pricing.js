/*
  FAIMGO — coach credits + paid tiers (single source of truth).

  Everything here is in REAL backend-cost cents, the SAME unit as
  ai_usage.total_cost_cents (what a coach turn actually costs us on the model).
  That is deliberate: it lets the coach route compare directly with
     remaining = creditCents - usedCents
  and it means "give the customer 100% of what they bought" is literally true,
  because the credit they hold is measured in the same cents we spend.

  The MARGIN is NOT taken out of the customer's usage (we never shrink the
  amount). It lives entirely in the SELL PRICE: we charge a retail price well
  above the cost basis a tier grants (see TIERS below), the wholesale→retail
  spread Ben described. On top of that, the true model cost (Haiku) is a
  fraction of even that basis, so there is a second, quieter margin. Neither is
  advertised; the store just looks simple and generous.

  NOTHING here is shown to the user as a number. The route turns usedCents into
  a coarse "% used" for a gauge (usedPct below); the customer never sees cents,
  dollars-of-usage, or an exact "N left". Store prices (below) ARE shown — that
  is a storefront, which is fine; the no-dollar-figure rule is about USAGE.
*/

// ── The free grant every device starts with ────────────────────────────────
// THE key business knob. This is the current $5 placeholder (Ben, Sep 8), which
// at ~0.5¢ per coach exchange is roughly a THOUSAND free exchanges — so today
// the paywall almost never triggers. That is fine while payments are OFF. Before
// payments go live, Ben will almost certainly want this much lower (e.g. 25–50¢,
// ~50–100 exchanges) so there is a real reason to buy. Changing it is this one
// line. Kept at 500 for now so today's free experience does not change.
export const FREE_GRANT_CENTS = 500;

// ── Paid one-time packs (Ben, Sep 14) ──────────────────────────────────────
// priceCents = what the customer PAYS (retail, shown in the store).
// creditCents = the cost-basis of usage the pack grants (NOT shown), ~2x below
//   the price, so there is a built-in spread. At ~0.5¢/exchange these grant very
//   roughly: starter ~800, plus ~2000, pro ~5000 back-and-forths — all generous.
// One-time packs only for now; a subscription tier can be added later if wanted.
export const TIERS = [
  { id: "starter", label: "Starter", priceCents: 799, creditCents: 400 },
  { id: "plus", label: "Plus", priceCents: 1999, creditCents: 1000, best: true },
  { id: "pro", label: "Pro", priceCents: 4999, creditCents: 2500 },
];

// ── First-upgrade discount (Ben, Sep 14) ────────────────────────────────────
// Shown ONCE, the first time someone hits the wall, as a real one-time offer:
// take it now, or it's full price later. It must genuinely be one-time (not a
// permanent fake "was $X") — that honesty is the whole point. Exact promo
// numbers are Ben's to finalize; 20% is the current placeholder. (When picking
// the final framing, compare "20% off" vs a flat "$N off" at the real price —
// a percentage usually reads bigger on small prices, a flat amount can feel
// more concrete; decide per tier.)
export const FIRST_UPGRADE_DISCOUNT = { pct: 20, oneTime: true };

export function tierById(id) {
  return TIERS.find((t) => t.id === id) || null;
}

export function discountedPriceCents(priceCents) {
  return Math.round((priceCents * (100 - FIRST_UPGRADE_DISCOUNT.pct)) / 100);
}

// Coarse "% used" for the gauge. Deliberately rounded to the nearest 5 so it
// reads as "about how much", never a precise ledger, and never a dollar/number.
export function usedPct(usedCents, creditCents) {
  const c = creditCents > 0 ? creditCents : FREE_GRANT_CENTS;
  const raw = (Number(usedCents || 0) / c) * 100;
  const clamped = Math.max(0, Math.min(100, raw));
  return Math.round(clamped / 5) * 5;
}
