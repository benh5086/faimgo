-- Faimgo — coach credits (Sep 14 2026). Payments skeleton, Layer 1.
--
-- Run ONCE, by hand, in the Neon SQL editor (paste this whole file -> Run).
-- Idempotent, same as 001-006 -- safe to re-run.
--
-- WHY: until now the coach allowance was a fixed $5 (ALLOWANCE_CENTS in
-- api/coach/route.js). To support paid top-ups, each device/account now carries
-- its OWN credit balance, and usage draws it down:
--     remaining = credit_cents - total_cost_cents   (all in real backend cost cents)
-- credit_cents DEFAULTS to 500 (the same $5 free grant), so this change is
-- behaviour-preserving until a purchase adds credits. Lowering the free grant is
-- a one-line change in src/lib/pricing.js (FREE_GRANT_CENTS), not here.
--
-- credit_grants is the purchase ledger: one row per paid top-up, keyed by the
-- payment id, so applying a Stripe webhook twice can NEVER double-credit
-- (addCredits() in db.js relies on this PK for idempotency). It also gives a
-- clean audit trail of what was sold. Layer 2 (Stripe) writes here; nothing in
-- Layer 1 does yet, so this table simply sits empty until payments are wired.

ALTER TABLE ai_usage
  ADD COLUMN IF NOT EXISTS credit_cents INTEGER NOT NULL DEFAULT 500;

CREATE TABLE IF NOT EXISTS credit_grants (
  payment_id         TEXT PRIMARY KEY,        -- Stripe session/PI id; PK = idempotency
  fid                TEXT,                     -- device the credit is applied to
  person_id          TEXT,                     -- account, when known
  tier               TEXT,                     -- 'starter' | 'plus' | 'pro'
  amount_paid_cents  INTEGER,                  -- what the customer actually paid (retail)
  credits_cents      INTEGER,                  -- cost-basis credits added to the balance
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS credit_grants_fid_idx    ON credit_grants (fid);
CREATE INDEX IF NOT EXISTS credit_grants_person_idx ON credit_grants (person_id);
