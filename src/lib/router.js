/* ============================================================
   FAIMGO — PLAY ROUTER
   Turns an assessment result into an ordered, honest walkthrough.

   WHY THIS FILE EXISTS
   Until now the results page ended with a button that said
   "Start my 30/60/90 →" and pointed at the homepage anchor. There
   was nothing behind it. The assessment could tell someone which
   road to take and then had no directions for the road — which is
   the same broken-promise pattern we spent the last release
   removing from the email flow, just larger.

   WHAT IT IS AND IS NOT
   This is rules, not intelligence. It reads the play library the
   same way the assessment reads the path library, and it does four
   things: pick the plays that fit the path, keep them in the order
   the library already declares, split them by what has to be TRUE
   before each one is possible, and report what it could not cover.

   The fourth job is the one that matters most. The library does not
   cover every path, and the honest response to that is to say so on
   the screen — not to pad the sequence with universal steps and let
   a short plan read like a complete one. Everything here that looks
   like a limitation being tracked (coverage, spineApplies,
   notBuiltYet, warnings) exists so the view can be truthful.

   THE MODEL-UPGRADE TEST
   A stronger base model makes this MORE valuable, not less: the
   scarce thing is not the reasoning, it is the written library and
   the honest map of its edges. A better model reading a better map
   goes further. A better model with no map still guesses.
   ============================================================ */

import LIB from "./plays.json";
import { pathById } from "./paths.js";

const ALL = LIB.plays || [];

/* ---------- state facts ----------
   A prerequisite is either a play id ("offer.define") or a fact
   about the person's situation ("has:first-client"). Only the second
   kind can gate a horizon, because play ids are things they will do
   inside the plan and facts are things the world has to hand them. */
const isStateFact = (s) => typeof s === "string" && s.includes(":");

/* How deep into the journey a fact sits. Unknown facts are treated as
   deep rather than shallow — putting a step too late is a smaller lie
   than putting it too early. */
const FACT_DEPTH = {
  "has:first-client": 1,
  "has:one-testimonial": 2,
  "has:repeat-or-recurring-income": 2,
  /* Content earns in a different order: nothing is sold until an audience
     exists, so the facts that gate its horizons are about publishing and
     signal, not about clients. */
  "has:published-12": 1,
  "has:content-pattern": 2,
  "has:owned-audience": 2,
  /* Gig work earns in week one, so its facts are about what you have
     learned rather than what you have built. */
  "has:first-gig-payout": 1,
  "has:real-hourly": 2,
};
const factDepth = (f) => (FACT_DEPTH[f] === undefined ? 2 : FACT_DEPTH[f]);

const FACT_LABEL = {
  "has:first-client": "your first paying client",
  "has:one-testimonial": "one testimonial you can show",
  "has:repeat-or-recurring-income": "money arriving more than once",
  "has:published-12": "twelve pieces published",
  "has:content-pattern": "a pattern you can repeat",
  "has:owned-audience": "an audience list of your own",
  "has:first-gig-payout": "your first payout",
  "has:real-hourly": "your real hourly rate",
};
export const factLabel = (f) => FACT_LABEL[f] || f;

/* ---------- the three horizons ----------
   Deliberately derived, not assigned by hand. A play sits in the
   window that opens once the fact it waits on is true, which is why
   the split lands where it does instead of where a marketer would
   put it. */
const HORIZONS_DEFAULT = [
  {
    key: "d30",
    label: "Days 1–30",
    aim: "Get to where a stranger could hire you — then ask one.",
    opensWhen: null,
  },
  {
    key: "d60",
    label: "Days 31–60",
    aim: "Turn the first yes into proof, and into money that comes back.",
    opensWhen: "has:first-client",
  },
  {
    key: "d90",
    label: "Days 61–90",
    aim: "Stop quoting from scratch, and make the rough things good.",
    opensWhen: "has:one-testimonial",
  },
];

/* Content does not go client → testimonial → package; it goes publish →
   signal → audience → money. Handing it the horizon labels above would
   describe a journey it is not on, which is the same mistake as handing it
   a cold-outreach list. Paths not listed here use the default. */
const HORIZONS_BY_PATH = {
  content: [
    {
      key: "d30",
      label: "Days 1–30",
      aim: "Pick the lane, then get twelve pieces out before you judge anything.",
      opensWhen: null,
    },
    {
      key: "d60",
      label: "Days 31–60",
      aim: "Read what actually worked, make more of it, and move that attention somewhere you own.",
      opensWhen: "has:published-12",
    },
    {
      key: "d90",
      label: "Days 61–90",
      aim: "Turn the people already listening into the first dollar.",
      opensWhen: "has:content-pattern",
    },
  ],
  /* Gig is the only path that pays in week one, so its first window is
     about getting approved rather than getting ready — and its last window
     is honest about a ceiling the other paths do not have. */
  gig: [
    {
      key: "d30",
      label: "Days 1–30",
      aim: "Get approved, then work only the hours that actually pay.",
      opensWhen: null,
    },
    {
      key: "d60",
      label: "Days 31–60",
      aim: "Find out what an hour of this is really worth after fuel, wear and tax.",
      opensWhen: "has:first-gig-payout",
    },
    {
      key: "d90",
      label: "Days 61–90",
      aim: "Cut the dead time — and start something that keeps earning when you stop.",
      opensWhen: "has:real-hourly",
    },
  ],
};

/* ---------- what we hold back, and why ----------
   These plays are written and good. They describe a service that does
   not exist yet, and a card that describes a service is indistinguishable
   from a promise of one. They come back the day the thing behind them
   is real; until then the view names them as not-built rather than
   rendering them as available. */
const NOT_BUILT_YET = ["help.faimgo-help", "help.ai-coach"];

/* community.sell-your-skill asks for this itself:
   surface_as: "opportunity, not need — never in the help rail by default". */
const NOT_IN_RAIL = ["community.sell-your-skill"];

/* ---------- gap: how far someone stands from the frame, and where ----------
   income = a problem × your ability to solve it × a channel to reach them.
   The library was written Jul 26 with a `gap` array on every core play —
   which of has-skill / can-market / stuck / scratch that step genuinely
   speaks to — and until this batch nothing ever read it. `gapFrom()` below
   was the placeholder: derive a weak guess from the relationship question,
   used only for wording. The assessment now asks directly (`qgap`), so the
   real answer is used when it exists and the guess only covers old saved
   plans from before this question existed. */
const GAP_LABEL = {
  "has-skill": "you have something to offer but haven't found buyers for it yet",
  "can-market": "you're good at reaching people but don't have a solid offer yet",
  stuck: "you already started and got stuck somewhere along the way",
  scratch: "you're starting from zero — no offer, no plan yet",
};
export const gapLabel = (g) => GAP_LABEL[g] || GAP_LABEL.scratch;

/* ---------- pacing: how fast the windows move ----------
   Two answers govern this together — hours available and how soon they want
   a first dollar — because both are really the same question asked twice:
   how much runway does this person actually have. Combined into one
   multiplier rather than two separate levers so the arithmetic stays
   checkable; splitting them into independent axes is a reasonable future
   refinement once real users show whether this granularity is even needed. */
const HOURS_LABEL = { lt5: "under 5 hours a week", "5to10": "5–10 hours a week", "10to20": "10–20 hours a week", "20plus": "20+ hours a week" };
const TIME_LABEL = { week: "this week", month: "within a month", quarter: "1–3 months out", norush: "with no rush" };
export function paceMultiplier(A) {
  const a = A || {};
  let m = 1;
  if (a.qhours === "lt5") m *= 1.5;
  else if (a.qhours === "5to10") m *= 1.2;
  else if (a.qhours === "20plus") m *= 0.8;
  if (a.qtime === "week") m *= 0.85;
  else if (a.qtime === "norush") m *= 1.15;
  return Math.max(0.6, Math.min(1.8, m));
}
function windowLabels(count, mult) {
  const width = Math.max(10, Math.round((30 * mult) / 5) * 5);
  const out = [];
  let start = 1;
  for (let i = 0; i < count; i += 1) {
    const end = start + width - 1;
    out.push(`Days ${start}–${end}`);
    start = end + 1;
  }
  return out;
}
export function paceNote(A) {
  const a = A || {};
  const mult = paceMultiplier(A);
  const hoursTxt = HOURS_LABEL[a.qhours];
  const timeTxt = TIME_LABEL[a.qtime];
  if (!hoursTxt && !timeTxt) return null;
  const dir = mult > 1.08 ? "so the windows below run longer than the default 30/60/90"
    : mult < 0.92 ? "so the windows below are tighter than the default 30/60/90"
    : "which lines up with the standard 30/60/90 pace";
  const bits = [hoursTxt ? `you said ${hoursTxt}` : null, timeTxt ? `wanting a first dollar ${timeTxt}` : null].filter(Boolean);
  return `${bits.join(" and ")}, ${dir}.`;
}

/* ---------- protect-from: which reassurance leads ----------
   The assessment's optional "what should your plan protect you from" answer
   used to only shape the results-page tone. It never reached the walkthrough
   itself, which is the page someone actually returns to. */
const PROTECT_TONE = {
  steam: "This page is built as a day-by-day sequence on purpose — the thing that kills momentum is deciding what's next, so the order below decides it for you.",
  scared: "Every step here starts with the free version. Nothing on this page asks you to spend before something has already worked.",
  start: "You said not knowing where to start was the risk — the card below always points at exactly one next step, never a list to choose from.",
  time: "You said time is the risk. Nothing below has a deadline attached to it; pick it up whenever you get a real block of time, in any order the steps allow.",
  first: "First real attempt — the steps below assume nothing and explain everything, including what to do when one doesn't work.",
};
export function protectTone(protectFrom) {
  return PROTECT_TONE[protectFrom] || null;
}

/* ---------- helpers ---------- */

export function primaryPathId(results) {
  const r = results || {};
  return r.chosen || r.fastestWin || null;
}

/* The second road, if there is one worth naming. When they chose a path
   we show the fast win beside it; when we matched them, the fast win IS
   the primary, so the long-term one is the companion. */
export function secondPathId(results) {
  const r = results || {};
  const first = primaryPathId(r);
  const second = r.chosen ? r.fastestWin : r.longTerm;
  return second && second !== first ? second : null;
}

function coverageOf(pathId) {
  const cov = LIB.path_coverage || {};
  if (!pathId) return "starter";
  if ((cov.full || []).includes(pathId)) return "full";
  if ((cov.partial || []).includes(pathId)) return "partial";
  return "starter";
}

/* ---------- the router ---------- */

export function buildPlan(A, results, protectFrom) {
  const answers = A || {};
  const r = results || {};
  /* The real answer when it exists (qgap, added this batch); the old weak
     guess only for plans saved before this question existed. */
  const gap = answers.qgap || gapFrom(answers);
  const pathId = primaryPathId(r);
  const path = pathId ? pathById(pathId) : null;
  const secondId = secondPathId(r);
  const second = secondId ? pathById(secondId) : null;

  const spineOff = (LIB.spine_does_not_apply && LIB.spine_does_not_apply.paths) || [];
  const hasSpine = (id) => Boolean(id) && !spineOff.includes(id);

  /* ---------- which path do we actually walk? ----------
     Until now this was `pathId` and nothing else, which produced the worst
     page in the product. Someone who chooses content creation gets a
     walkthrough with ZERO steps — content is in spine_does_not_apply — and
     three "get help" cards. Meanwhile their fastest first win is very often
     freelancing, whose spine is complete, and the results page has ALREADY
     told them to do it first: "Freelancing money funds your first months of
     content creation — you're earning by day 30." The product knew the
     answer and the walkthrough threw it away.

     So: walk the first path that has a spine. Their choice comes first and
     is normally the answer. If it has no spine, borrow the fast win — which
     is not a substitution of their goal, it is the funder we already named.
     The page must SAY it borrowed, every time; a plan quietly retitled is
     worse than an honest empty one. */
  const walkId = hasSpine(pathId)
    ? pathId
    : [r.fastestWin, r.longTerm].find((id) => id && id !== pathId && hasSpine(id)) || null;
  const walkPath = walkId ? pathById(walkId) : null;
  const borrowed = Boolean(walkId) && walkId !== pathId;

  const spineApplies = Boolean(walkId);
  const spineOffWhy = hasSpine(pathId) ? null : (LIB.spine_does_not_apply || {}).why || null;

  const coverage = coverageOf(walkId);
  const chosenCoverage = coverageOf(pathId);
  const warnings = [];

  const fits = (p) => p.paths.includes("*") || (walkId && p.paths.includes(walkId));

  /* Order comes from the library file itself — the array IS the spine.
     validateLibrary() below is what keeps that claim true. */
  const chosen = spineApplies
    ? ALL.filter((p) => (p.type === "core" || p.type === "consolidation") && fits(p))
    : [];

  const inSequence = new Set(chosen.map((p) => p.id));

  /* Labels only — the aim text and the opensWhen fact stay exactly as the
     library declares them, since those describe what happens in the window,
     not how long it runs. Only the day range is a function of the pace. */
  const baseHZ = HORIZONS_BY_PATH[walkId] || HORIZONS_DEFAULT;
  const mult = paceMultiplier(answers);
  const labels = windowLabels(baseHZ.length, mult);
  const HZ = baseHZ.map((h, i) => ({ ...h, label: labels[i] || h.label }));

  const horizonIndex = (p) => {
    const facts = (p.prerequisites || []).filter(isStateFact);
    if (!facts.length) return 0;
    return Math.min(HZ.length - 1, Math.max(...facts.map(factDepth)));
  };

  const buckets = HZ.map((h) => ({ ...h, plays: [] }));
  let n = 0;

  chosen.forEach((p) => {
    /* A prerequisite play that got filtered out for this path is not an
       error — it means the library says that step does not apply here.
       We record it so a real gap can be told apart from a deliberate one. */
    const missingSteps = (p.prerequisites || []).filter((q) => !isStateFact(q) && !inSequence.has(q));
    if (missingSteps.length) {
      warnings.push(`${p.id} lists ${missingSteps.join(", ")} as a prerequisite, but that play does not apply to "${walkId}".`);
    }
    n += 1;
    buckets[horizonIndex(p)].plays.push({
      ...p,
      n,
      waitsOn: (p.prerequisites || []).filter(isStateFact),
      /* Whether THIS step is what the library says speaks to THIS person's
         gap. A play with no `gap` array (none of the core spine omits it,
         but this stays defensive) counts as fitting everyone. This is the
         one piece of the plan's structure that varies per person without
         touching order or removing anything — every step still appears,
         nothing is hidden, the difference is only which ones are marked as
         the direct answer to what they said they're missing. */
      fitsGap: !Array.isArray(p.gap) || p.gap.includes(gap),
    });
  });

  /* A horizon with nothing in it is not shown. Better an honest two-window
     plan than a third window padded to look complete. */
  const phases = buckets.filter((b) => b.plays.length > 0);

  const onDemand = ALL.filter((p) => p.type === "on-demand" && fits(p));
  const helpRail = onDemand.filter((p) => !NOT_BUILT_YET.includes(p.id) && !NOT_IN_RAIL.includes(p.id));
  const notBuiltYet = ALL.filter((p) => NOT_BUILT_YET.includes(p.id));

  /* Unlock targets the library points at but never defines. The view must
     never render a link to one of these. */
  const known = new Set(ALL.map((p) => p.id));
  const dangling = [];
  ALL.forEach((p) => {
    (p.unlocks || []).forEach((u) => {
      if (!known.has(u) && !dangling.includes(u)) dangling.push(u);
    });
  });

  const firstPlay = phases.length ? phases[0].plays[0] : null;

  return {
    pathId,
    path,
    second,
    /* The path whose steps are below. Equal to `path` unless we borrowed. */
    walkPath,
    borrowed,
    coverage,
    chosenCoverage,
    spineApplies,
    spineOffWhy,
    /* Real as of this batch — see the comment above `gap` near the top of
       this function. `gapFrom()` below stays only as the fallback it now is. */
    gap,
    gapLabel: gapLabel(gap),
    pace: mult,
    paceNote: paceNote(answers),
    protectFrom: protectFrom || null,
    protectTone: protectTone(protectFrom),
    phases,
    stepCount: n,
    firstPlay,
    helpRail,
    notBuiltYet,
    /* Only meaningful when the sequence is empty or thin — the path's own
       opening moves from the assessment, so the page is never a dead end. */
    starterMoves: path ? path.moves || [] : [],
    starterKit: path ? path.kit || [] : [],
    dangling,
    warnings,
    libraryVersion: LIB.version || null,
  };
}

/* The library's `gap` enum, derived from what the assessment already asks.
   Not used to filter — every core play lists most of the four values, so
   filtering on it would remove almost nothing and occasionally remove
   something essential. It is used for wording. */
export function gapFrom(A) {
  const rel = (A || {}).qrel;
  if (rel === "pro" || rel === "hobby") return "has-skill";
  if (rel === "moneyresearch" || rel === "new") return "scratch";
  return "scratch";
}

/* ---------- library self-check ----------
   The router's whole ordering claim is "the array in plays.json is already
   the spine." This is what makes that claim checkable instead of assumed.
   Returns a list of problems; empty means the file is sound. */
export function validateLibrary() {
  const problems = [];
  const seen = new Set();
  const known = new Set(ALL.map((p) => p.id));

  ALL.forEach((p) => {
    if (seen.has(p.id)) problems.push(`duplicate id: ${p.id}`);
    (p.prerequisites || []).forEach((q) => {
      if (isStateFact(q)) return;
      if (!known.has(q)) problems.push(`${p.id} requires unknown play ${q}`);
      else if (!seen.has(q)) problems.push(`${p.id} appears before its prerequisite ${q}`);
    });
    seen.add(p.id);
  });

  ALL.forEach((p) => {
    (p.checkin ? p.checkin.options || [] : []).forEach((o) => {
      if (o.routes_to && !known.has(o.routes_to)) {
        problems.push(`${p.id} check-in routes to undefined play ${o.routes_to}`);
      }
    });
  });

  /* unlocks / cross_path_unlock point forward at plays the way prerequisites
     point backward. Same shape of bug (a typo'd or renamed id), same need
     to be caught here rather than only at render time. */
  ALL.forEach((p) => {
    (p.unlocks || []).forEach((u) => {
      if (!known.has(u)) problems.push(`${p.id} unlocks unknown play ${u}`);
    });
    if (p.cross_path_unlock && !known.has(p.cross_path_unlock)) {
      problems.push(`${p.id} cross_path_unlock points to unknown play ${p.cross_path_unlock}`);
    }
  });

  return problems;
}
