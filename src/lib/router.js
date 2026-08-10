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

export function buildPlan(A, results) {
  const answers = A || {};
  const r = results || {};
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

  const HZ = HORIZONS_BY_PATH[walkId] || HORIZONS_DEFAULT;

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
    /* Derived, not asked. The assessment has no gap question yet (it is a
       tracked open item); until it does, the relationship answer is the
       closest honest read of where someone is starting from. */
    gap: gapFrom(answers),
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

  return problems;
}
