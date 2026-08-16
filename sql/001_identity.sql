-- Faimgo — identity + cross-device restore schema.
--
-- Run ONCE, by hand, in the Neon SQL editor (Neon dashboard → your project →
-- SQL Editor → paste this whole file → Run). There is no migration tool in
-- this project and this doesn't need one yet — every statement below is
-- IF NOT EXISTS / idempotent, so re-running this file after it has already
-- succeeded once is harmless.
--
-- Design notes (see claude/faimgo-storage-and-identity.md and the Aug 16
-- discussion in claude/faimgo-open-items.md for the full reasoning):
--
--   people — the identity anchor, keyed by email. `username` / `avatar_url` /
--   `bio` / `profile_public` are reserved for the future community/profile
--   layer and are deliberately not rendered anywhere in the product yet —
--   they exist now, empty, so that turning that layer on later is "add a
--   column's worth of UI," not "redesign the table and migrate everyone."
--
--   person_devices — links a browser's `fid` (see src/lib/store.js) to a
--   person, once that browser has proven ownership of the email via a magic
--   link. This is what lets a NEW device recognise someone who already has
--   history on another one.
--
--   person_plans — the server-side mirror of what's already saved to
--   localStorage on every submit (store.js's `plans` array). localStorage
--   never leaves the device it was written on, so this table is the part
--   that actually makes cross-device restore possible. Keyed by
--   (person_id, plan_id) so a resubmit of the same plan — same id, per
--   store.js's answersFingerprint() matching — updates the row in place
--   instead of duplicating it, exactly mirroring the local behaviour.
--
--   magic_tokens — never stores the raw token, only its SHA-256 hash. Same
--   reason a password is hashed rather than stored: if this table ever
--   leaked, it must not hand out working restore links.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Reserved for the community/profile layer — deliberately not built yet.
  -- See claude/faimgo-open-items.md, Aug 16 discussion: built this way on
  -- purpose so turning it on later is additive, not a migration.
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  profile_public BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS person_devices (
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  fid TEXT NOT NULL,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (person_id, fid)
);

CREATE TABLE IF NOT EXISTS person_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL,        -- matches the client-side id from store.js's savePlan()
  answers JSONB NOT NULL,
  results JSONB,
  protect_from TEXT,
  other_idea TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (person_id, plan_id)
);

CREATE TABLE IF NOT EXISTS magic_tokens (
  token_hash TEXT PRIMARY KEY,   -- sha256(raw token) — the raw token is never stored
  email TEXT NOT NULL,
  requesting_fid TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS person_plans_person_id_idx ON person_plans(person_id);
CREATE INDEX IF NOT EXISTS magic_tokens_email_idx ON magic_tokens(email);

-- Verify after running: both queries below should return with no error.
--   SELECT count(*) FROM people;
--   SELECT count(*) FROM magic_tokens;
