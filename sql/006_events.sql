-- Faimgo — events mirror (Sep 13 2026).
--
-- Run ONCE, by hand, in the Neon SQL editor (Neon dashboard -> your project ->
-- SQL Editor -> paste this whole file -> Run). Idempotent, same as 001-005 --
-- safe to re-run.
--
-- WHY: track() (src/lib/track.js) already fires an event on EVERY arrival
-- ('landed:<page>'), plus 'cta_click:*', 'start', 'step_done:*', etc. Until now
-- those events went ONLY to the Google Sheet (via LEAD_WEBHOOK_URL) and were
-- never queryable — so /admin could show accounts/plans but NOT "how many
-- people just showed up and left." This table is the queryable mirror: the
-- api/lead event branch writes here too (best-effort, fail-open), and
-- getAdminStats() reads it for arrivals / unique visitors / bounce funnel.
--
-- NOT a replacement for the Sheet — both get every event. And it is NOT
-- backfilled: arrivals only start accumulating here from the deploy that adds
-- the mirror; older visits live only in the Sheet.
--
-- Volume note: one row per pageview grows over time. Fine at this stage; when
-- it gets large, roll up into a daily-aggregate table and trim raw rows. The
-- endpoint is public+unauthenticated (it has to be — it's a browser beacon),
-- so treat counts as directional, not audited.

CREATE TABLE IF NOT EXISTS events (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,                          -- e.g. 'landed:home', 'cta_click:Start', 'start'
  fid         TEXT,                                   -- device id (person proxy); null if storage was off
  sid         TEXT,                                   -- this sitting
  visits      INTEGER,                                -- visit counter from store.js at fire time
  src         TEXT,                                   -- first-touch attribution source
  ref         TEXT,                                   -- first-touch referrer
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS events_name_idx    ON events (name);
CREATE INDEX IF NOT EXISTS events_created_idx ON events (created_at DESC);
CREATE INDEX IF NOT EXISTS events_fid_idx     ON events (fid);
