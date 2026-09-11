-- Faimgo — AI coach multi-turn conversations (Phase 2).
--
-- Run ONCE, by hand, in the Neon SQL editor (Neon dashboard -> your project ->
-- SQL Editor -> paste this whole file -> Run). Idempotent, same as 001-004 --
-- safe to re-run.
--
-- Sep 11 2026. This is the storage half of Phase 2 (multi-turn dialogue) --
-- see claude/faimgo-phase2-multiturn-design.md. It holds the running
-- conversation the coach has with a person at either surface (the
-- assessment's "something else" free text, or /plan's "I'm stuck" seam), so
-- a conversation can be resumed and so the transcripts become the coach's
-- own future training/tuning data (coach-constraints.md §5).
--
-- ONE TABLE, MESSAGES AS A JSONB ARRAY -- deliberately the fewest moving
-- parts. Each turn the API route overwrites the whole `messages` array (it
-- holds the full running history), so there is no array-append SQL and no
-- second table to keep in sync. A chat is bounded by the route's hard turn
-- cap, so the row stays small.
--
-- KEYED BY fid, person_id CARRIED WHEN KNOWN -- same identity model as
-- ai_usage (004) and every other seam here: fid is the one id every caller
-- always has (both coach surfaces fire before an email necessarily exists),
-- and person_id is set/kept once the device is linked to a verified person so
-- the conversation can follow them across devices. Same honest tradeoff as
-- ai_usage: a device that clears storage starts a new conversation id.
--
-- BEST-EFFORT, NEVER LOAD-BEARING -- db.js's helpers fail open (never throw),
-- and the API route only PERSISTS here; the chat itself works in-session even
-- with no database, exactly like every other write in this codebase.

CREATE TABLE IF NOT EXISTS coach_conversations (
  conversation_id TEXT PRIMARY KEY,                       -- client-generated, like planId
  fid             TEXT NOT NULL,
  person_id       TEXT,                                   -- null until email-verified; set on upgrade
  surface         TEXT NOT NULL,                          -- 'assessment' | 'plan'
  context         JSONB NOT NULL DEFAULT '{}'::jsonb,     -- {path, gap, planId, focusPlayId} frozen at start
  messages        JSONB NOT NULL DEFAULT '[]'::jsonb,     -- [{role, content, meta, ts}]
  status          TEXT NOT NULL DEFAULT 'open',           -- 'open' | 'escalated' | 'resolved'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coach_conversations_fid_idx    ON coach_conversations (fid, updated_at DESC);
CREATE INDEX IF NOT EXISTS coach_conversations_person_idx ON coach_conversations (person_id, updated_at DESC);

-- Verify after running:
--   SELECT conversation_id, surface, status, jsonb_array_length(messages) AS turns, updated_at
--   FROM coach_conversations ORDER BY updated_at DESC LIMIT 5;
