-- Faimgo — real name fields, separate from the public display name.
--
-- Run ONCE, by hand, in the Neon SQL editor (Neon dashboard → your project →
-- SQL Editor → paste this whole file → Run). Idempotent, same as 001/002 —
-- safe to re-run.
--
-- Ben asked (Sep 7 2026) to have a real name on file for each person,
-- separate from the "Your Faimgo name" they pick for themselves
-- (people.username — already existed since 001_identity.sql, now required
-- at profile setup instead of optional; see account/page.js). These three
-- columns are deliberately NEVER returned by getPublicProfile() — private,
-- for Ben's own records, visible only to the person themselves on their own
-- /account edit form (and only after proving ownership via their edit-
-- session token — see api/profile/route.js's "get" action), never shown to
-- anyone else and never on the public /u/[id] page.
--
-- middle_name is optional by design — most people don't use one day to
-- day, and no comparable signup flow requires it; first_name/last_name are
-- required at the app level (not a DB constraint, since existing rows may
-- not have them yet).

ALTER TABLE people ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS middle_name TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Verify after running:
--   SELECT first_name, middle_name, last_name FROM people LIMIT 1;
