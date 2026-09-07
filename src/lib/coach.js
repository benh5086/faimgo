/*
  Faimgo — the AI coach's one grounded call.

  WHY ONE FUNCTION FOR TWO DIFFERENT MOMENTS
  There is exactly one thing this codebase needed an LLM for, appearing in
  two places: (1) the assessment's free-text "something else" answer, which
  today is matched by a fixed keyword list and silently discarded if nothing
  matches (the exact bug a real test surfaced — see
  claude/faimgo-plan-redesign-batch-sep6.md); and (2) the `help.ai-coach`
  seam that has sat honestly labelled "not built yet" in plan/page.js and
  router.js since Aug 24 (see claude/faimgo-return-coaching-loop-v1.md).
  Both are the same underlying capability — read this person's own words +
  the library + their record, answer grounded in what's actually there — so
  they share one system prompt and one call shape (`kind` picks the framing),
  instead of two bespoke integrations that could quietly drift apart.

  GROUNDING, PER claude/faimgo-coach-constraints.md
  This function never lets the model free-associate. Every call is fed only:
  the written play library (plays.json — its `concrete`, `if_it_stalls`,
  `checkin`, named tools), and this person's own record (path, gap, completed
  step ids). Nothing else. If the library doesn't cover something, the model
  is instructed to say so plainly (`coverage: "partial"`) rather than pad
  with generic advice — see coach-constraints.md §2.

  STRUCTURED OUTPUT, NOT FREE TEXT PARSING
  The model is forced (tool_choice) to return one JSON object shaped exactly
  like COACH_REPLY_TOOL below. This is deliberate: parsing a model's free-form
  prose for "did it name a tool" is brittle and silently wrong in ways that
  are hard to catch without a live account to test against. Forcing the shape
  means a caller either gets a well-formed reply or an honest `ok:false` —
  never a half-parsed guess.

  THE AFFILIATE SEAM NEEDS NOTHING NEW HERE
  When the model names a tool, it is instructed to use the EXACT string from
  a play's `concrete.tools[].name` — the same string `toolHref()` in
  affiliate.js already matches against AFFILIATE. So the moment Ben enrolls in
  a program and adds one line to affiliate.js (see
  claude/faimgo-affiliate-checklist.md), any tool this coach recommends that
  happens to be enrolled becomes a revenue link automatically. This file does
  not need to know affiliate.js exists, and that separation is the point —
  the coach recommends the tool that's actually right for the step (never for
  Faimgo's benefit — coach-constraints.md rule 8), and monetization is a
  fact about the link, decided elsewhere.

  COST DISCIPLINE, PER claude/faimgo-money-seams.md §2.4/§3
  Model defaults to Haiku (cheap, tiered) for both kinds today — even
  "stuck_help" doesn't need Sonnet's reasoning depth for a single grounded
  next-step answer, and tiering the model (not the person) is the explicit
  rule. Escalate later only if real transcripts show Haiku falling short on
  the harder "stuck_help" turns. Every call is metered by the caller (the API
  route), never by this file, so this file has no side effects if
  ANTHROPIC_API_KEY isn't set — see callCoach()'s first check.
*/

import plays from "./plays.json";
import { PATHS } from "./paths.js";

const PLAYS = plays.plays || [];

function findPlay(id) {
  return PLAYS.find((p) => p.id === id) || null;
}

/*
  The coach's entire behavioral contract, condensed from
  claude/faimgo-coach-constraints.md into a system prompt. Full document is
  the source of truth if these ever need to be re-derived; this is that
  document's rules, not a new invention.
*/
export const COACH_SYSTEM_PROMPT = `You are the Faimgo coach. Faimgo helps people build real side income, one honest step at a time.

HONESTY IS THE ONLY MOAT. When in doubt, the honest answer beats the impressive one. You would rather say "I don't have that" than invent it.

YOU ANSWER ONLY FROM what is provided to you in this message: the written play library content (goals, concrete tools/numbers/wording, if-it-stalls fixes, check-in options) and this person's own record (their path, their gap, their completed steps). You may use general, non-fabricated knowledge only to fill small gaps the library doesn't cover, and when you do, you say so plainly rather than dressing a guess as fact.

HARD RULES, NEVER BROKEN:
1. Never fabricate a number, tool, price, or statistic. No invented "most people earn $X." No made-up tool.
2. Never promise income or guarantee outcomes. No "you'll make $500," no "this is guaranteed." Speak in real ranges and honest odds, never promises.
3. Never shame or pressure. No "you're behind/lazy/procrastinating." No streaks, no guilt, no time-language like "it's been N days." Someone returning after a month gets "welcome back," never a reference to how long it's been.
4. Never advise anything that gets the user banned or is dishonest to others (fake reviews, spam outreach, evading platform rules).
5. Never give personalized financial, legal, or investment advice.
6. Never call something "free" that isn't, and never recommend a tool because it benefits Faimgo — recommend the best tool for THIS person's step, full stop.
7. Never claim a feature exists that doesn't (the marketplace/community is manual today; say so if it comes up).
8. If the library doesn't cover this person's situation, say so plainly (coverage: "partial") instead of padding with generic advice.

HOW TO ANSWER: give the single, concrete, next action sized for right now — not a wall of text. If a specific named tool from the provided library content actually fits, name it exactly as given. Be warm, direct, and adult — never a hype-man, never sycophantic. Guide, don't push: "you can do this now; one honest note is..." rather than blocking or nagging.

You must respond by calling the coach_reply tool. Never respond in plain prose.`;

/*
  Forced structured output — see file header. `tool_name`, when set, MUST be
  copied verbatim from a `concrete.tools[].name` given in this message, never
  invented — this is what lets toolHref()/affiliate.js work with zero
  awareness of this file.
*/
const COACH_REPLY_TOOL = {
  name: "coach_reply",
  description: "The coach's structured reply. Always call this — never reply in plain prose.",
  input_schema: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "The next concrete action or honest read of the situation, in the coach's voice, grounded only in the content provided in this message.",
      },
      tool_name: {
        type: ["string", "null"],
        description: "The exact `name` of one tool from the provided concrete.tools list, if one genuinely fits this reply. Copied verbatim, never invented. Null if none fits.",
      },
      path_id: {
        type: ["string", "null"],
        description: "classify_idea only: the id of the path this idea actually matches, from the provided list. Null if it's genuinely a different idea with no written playbook. Always null for stuck_help.",
      },
      coverage: {
        type: "string",
        enum: ["full", "partial"],
        description: "'full' if the provided library content actually covers this person's situation well; 'partial' if it only partly applies and the message should say so honestly.",
      },
    },
    required: ["message", "coverage", "tool_name", "path_id"],
  },
};

/*
  Build the user-turn content for one of the two call shapes. Deliberately
  scoped to only the relevant play(s), never the whole 26-play library —
  coach-constraints.md §5: load the record up front, fewer/cheaper/sharper
  turns, not a bigger context window.
*/
export function buildGroundingContext(params) {
  const kind = params?.kind;

  if (kind === "classify_idea") {
    const text = String(params?.text || "").slice(0, 1000);
    const pathList = PATHS.map((p) => ({ id: p.id, name: p.name, plain: p.plain }));
    return {
      model: "haiku",
      userContent: JSON.stringify({
        instructions:
          "Someone was asked to describe, in their own words, the side-income idea they're actually pursuing (not one of the listed paths). Read what they wrote. If it genuinely matches one of the path descriptions below, return that path's id. If it's a real, different idea with no written playbook for it, return path_id: null, coverage: 'partial', and a short honest message (quoting their own words if it helps) explaining that this specific idea isn't one Faimgo has a written walkthrough for yet, so what follows will be the closest scored fit as a funding path while they validate their own idea.",
        their_own_words: text,
        available_paths: pathList,
      }),
    };
  }

  if (kind === "stuck_help") {
    const focusPlayId = params?.focusPlayId || null;
    const situationText = String(params?.situationText || "").slice(0, 1000);
    const path = params?.path || null;
    const gap = params?.gap || null;
    const doneIds = Array.isArray(params?.doneIds) ? params.doneIds.slice(0, 40) : [];
    const focus = findPlay(focusPlayId);

    const focusSlim = focus
      ? {
          id: focus.id,
          name: focus.name,
          goal: focus.content?.goal,
          concrete: focus.concrete || null,
          if_it_stalls: focus.if_it_stalls || null,
          checkin: focus.checkin || null,
        }
      : null;

    return {
      model: "haiku",
      userContent: JSON.stringify({
        instructions:
          "This person is on a specific step of their Faimgo plan and asked for help (either they said what's wrong in their own words, or a check-in answer routed them here). Answer with the single next concrete action, grounded only in the step content below. If they described something the step content doesn't cover, say so honestly (coverage: 'partial') rather than guessing.",
        their_path: path,
        their_gap: gap,
        completed_step_ids: doneIds,
        current_step: focusSlim,
        what_they_said: situationText || null,
      }),
    };
  }

  return null;
}

/*
  The actual Anthropic call. Returns { ok:false, reason } on ANY problem —
  no key configured, network failure, bad response, model declining to use
  the tool — so every caller can degrade exactly like the rest of this
  codebase (money-seams §2.4 / coach-constraints.md rule 4: degrade, never
  refuse). Never throws.
*/
export async function callCoach({ userContent, model }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return { ok: false, reason: "not_configured" };
  if (!userContent) return { ok: false, reason: "bad_input" };

  /* Dated snapshots, not the bare aliases, so a model refresh upstream is a
     deliberate one-line bump here rather than a silent behavior change under
     us — same discipline as pinning any other dependency. */
  const MODEL_IDS = {
    haiku: "claude-haiku-4-5-20251001",
    sonnet: "claude-sonnet-4-5-20250929",
  };
  const modelId = MODEL_IDS[model] || MODEL_IDS.haiku;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 500,
        system: COACH_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
        tools: [COACH_REPLY_TOOL],
        tool_choice: { type: "tool", name: "coach_reply" },
      }),
    });

    if (!res.ok) {
      let bodyText = "";
      try { bodyText = await res.text(); } catch (e) { /* best effort only */ }
      console.error("[FAIMGO COACH API ERROR]", res.status, bodyText.slice(0, 500));
      return { ok: false, reason: "api_error", status: res.status };
    }

    const data = await res.json();
    const toolUse = Array.isArray(data?.content) ? data.content.find((c) => c.type === "tool_use" && c.name === "coach_reply") : null;
    if (!toolUse || !toolUse.input) return { ok: false, reason: "no_structured_reply" };

    const { message, tool_name, path_id, coverage } = toolUse.input;
    if (typeof message !== "string" || !message.trim()) return { ok: false, reason: "empty_reply" };

    return {
      ok: true,
      reply: {
        message: message.trim(),
        toolName: tool_name || null,
        pathId: path_id || null,
        coverage: coverage === "partial" ? "partial" : "full",
      },
      usage: data?.usage || null,
      model: modelId,
    };
  } catch (e) {
    console.error("[FAIMGO COACH NETWORK ERROR]", e?.message);
    return { ok: false, reason: "network_error" };
  }
}
