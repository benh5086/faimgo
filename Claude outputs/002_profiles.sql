-- Faimgo — account/profile + completion-record + reviews schema.
--
-- Run ONCE, by hand, in the Neon SQL editor (same place sql/001_identity.sql
-- was run — Neon dashboard → your project → SQL Editor → paste this whole
-- file → Run). Every statement is IF NOT EXISTS / idempotent, so re-running
-- after it has already succeeded once is harmless, same discipline as 001.
--
-- Written Sep 6, 2026, at Ben's request — see claude/faimgo-profile-scope-sep6.md
-- for the full reasoning. Two real gaps this closes:
--
--   1. `people.username` / `avatar_url` / `bio` / `profile_public` were
--      reserved back in 001 but never populated or rendered anywhere. This
--      migration doesn't touch that table — those columns are finally used
--      by the app code in this same batch, no schema change needed there.
--
--   2. Completed steps have ONLY ever lived in localStorage (store.js's
--      `steps` object, written by markStep()). That means the one number
--      the whole business direction points at — how many people finish a
--      step — evaporates the moment someone clears their browser or opens
--      a second device, exactly the same problem person_plans already
--      solved for submitted answers. `person_steps` below is the missing
--      server-side mirror, so a profile page (viewed by someone else, or
--      by the same person on a different device) can actually show a real
--      completed-count instead of always reading zero.
--
--   3. Nothing anywhere records that a real exchange happened and how it
--      went. `reviews` is deliberately loose (`reviewer_label` is free
--      text, not a foreign key) because the first real matches are brokered
--      by Ben by hand and the "reviewer" side may not be a Faimgo member at
--      all — forcing a strict foreign key here would block recording the
--      very first reviews the whole trust model depends on. Tightening this
--      once both sides of a match are reliably Faimgo accounts is a later,
--      separate migration, not a blocker on shipping this one.

-- `headline` — "Working on: Freelancing Your Skill" style, auto-derived
-- client-side from the person's own most recent plan (src/lib/paths.js's
-- PATHS list) and saved verbatim, never typed by hand. Nullable: someone
-- who verifies their account from a brand-new device with no local plan
-- data simply doesn't have one yet, and the profile page renders that as
-- an absence, not a guess.
ALTER TABLE people ADD COLUMN IF NOT EXISTS headline TEXT;

CREATE TABLE IF NOT EXISTS person_steps (
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  play_id TEXT NOT NULL,
  note TEXT,
  done_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (person_id, play_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewee_person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  reviewer_label TEXT NOT NULL,      -- free text: who left it, e.g. "Sarah, matched via Etsy path" —
                                      -- not a foreign key on purpose, see note above
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  exchange_note TEXT,                -- what the exchange actually was, e.g. "built a logo for X"
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Edit sessions: proof that a browser verified email ownership for ACCOUNT
-- purposes (as opposed to person_devices, which just links a browser to a
-- person for reading their own plans). Required before any write to a
-- person's public-facing profile fields (username/bio) — knowing someone's
-- email must never be enough to edit their profile. Long-lived (~1 year) on
-- purpose, matching this project's standing "verify once per device, then
-- trust it" pattern (see faimgo-storage-and-identity.md and /restore's own
-- copy: "you'll only need to do this once"). Only its hash is stored, same
-- reason magic_tokens hashes rather than stores its raw token.
CREATE TABLE IF NOT EXISTS edit_sessions (
  token_hash TEXT PRIMARY KEY,
  person_id UUID NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS person_steps_person_id_idx ON person_steps(person_id);
CREATE INDEX IF NOT EXISTS reviews_reviewee_idx ON reviews(reviewee_person_id);
CREATE INDEX IF NOT EXISTS edit_sessions_person_id_idx ON edit_sessions(person_id);

-- Verify after running: all three queries below should return with no error.
--   SELECT count(*) FROM person_steps;
--   SELECT count(*) FROM reviews;
--   SELECT count(*) FROM edit_sessions;
