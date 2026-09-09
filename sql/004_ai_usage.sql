-- Faimgo — AI coach usage ledger (the $5-per-person allowance).
--
-- Run ONCE, by hand, in the Neon SQL editor (Neon dashboard -> your project ->
-- SQL Editor -> paste this whole file -> Run). Idempotent, same as 001/002/003
-- -- safe to re-run.
--
-- Sep 8 2026. This is the build-out of a decision already on record from
-- Sep 6 (see claude/faimgo-ai-coach-usage-pricing-sep6.md): the AI coach
-- carries a starting allowance of real usage per person -- $5 worth, Ben's
-- placeholder number, same "chosen range, tuned once real usage exists"
-- status as every other unvalidated number in this project. The plan and
-- the full walkthrough stay free forever and are NEVER touched by this --
-- this only gates src/lib/coach.js's two calls (classify_idea, stuck_help),
-- the personalized/conversational layer, never the plan itself.
--
-- KEYED BY fid, NOT person_id -- deliberately. Both AI touchpoints fire
-- before an email/person necessarily exists (classify_idea fires mid-
-- assessment, well before the email gate; stuck_help fires from /plan,
-- which never sends an email to /api/coach at all). fid is the one
-- identity every caller always has, the same reason it's the backbone of
-- every other seam in this project before an email upgrades it to a real
-- person. This means the $5 is really "per device," not "per person" --
-- someone using two devices or clearing storage gets a fresh allowance.
-- Same honest tradeoff as every other soft limit already in this codebase
-- (see api/lead/route.js's own "speed bump, not a wall" language) -- a
-- real per-person ledger needs merging usage across a person's linked
-- devices (person_devices already has the links), which is a real
-- improvement worth making once real usage data shows this leak matters,
-- not before.
--
-- total_cost_cents is a running total in US cents, computed server-side
-- from each call's real token usage x published Anthropic pricing (see
-- api/coach/route.js) -- never estimated, never a flat per-call charge.

CREATE TABLE IF NOT EXISTS ai_usage (
  fid TEXT PRIMARY KEY,
  total_cost_cents INTEGER NOT NULL DEFAULT 0,
  calls INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Verify after running:
--   SELECT * FROM ai_usage LIMIT 1;
