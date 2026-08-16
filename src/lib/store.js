/*
  Faimgo local memory — v1.

  WHY THIS FILE EXISTS
  Until now the assessment held everything in React state and nothing else.
  Refresh the tab and it was gone: seven answered questions, the plan, all of
  it. Worse, the analytics id was regenerated on every mount, so one person
  who reloaded the page was counted as two people, and a person who came back
  next week was a stranger to us.

  This closes that with the smallest honest thing that works.

  TWO IDS, AND THE DIFFERENCE MATTERS
    fid — the person. Written once, never regenerated. This is the seed of
          identity. There are no accounts yet, and there may not be for a
          while, but every event we log from today forward carries an fid,
          so when real accounts arrive the history can be attached to the
          right person instead of starting from zero.
    sid — one sitting. Restored across a refresh (so a reload isn't a new
          visitor) and rotated after SESSION_GAP_MS of absence (so next
          week's visit is a distinct sitting, correctly attributed to the
          same fid).

  WHAT THIS IS NOT
  This is localStorage: one browser, one device. It is not an account and the
  copy must never imply it is. The cross-device answer is the plan email,
  which carries the whole plan in its body. Saying "we saved it" and then
  losing it on their phone would be the same broken promise we just fixed.

  SAFETY RULES FOR EVERYTHING BELOW
  Every function is safe to call during server rendering and in private-mode
  browsers where localStorage throws on access. They degrade to no-ops and
  return null. Storage must never be able to break the page — the assessment
  has to keep working perfectly for someone with storage disabled, they just
  don't get the memory.

  SCHEMA CHANGES
  Bump SCHEMA and add a branch to migrate(). Read the comment above that
  function before touching it: dropping an unrecognised record used to be
  correct and is now the most destructive thing this file could do.
*/

const KEY = "faimgo.v1";
const SCHEMA = 4;
const SESSION_GAP_MS = 30 * 60 * 1000; // 30 minutes away = a new sitting
const MAX_HISTORY = 20;                // archived completion sets kept on retake
const MAX_PLANS = 5;                   // saved plans kept per device before the oldest is dropped

/*
  What a finished step can have produced. Deliberately four values and no
  free text, because this is the field that eventually has to be counted.

  The order is the ladder people actually climb, and "not_yet" is first on
  purpose: it is the honest majority answer, and a question whose easiest
  answer is a failure is a question people close instead of answering.
  Nothing here is ever phrased as falling short — a step that produced
  nothing yet is a step that was still done, and the card says so.
*/
export const OUTCOMES = ["not_yet", "reply", "customer", "money"];

/* ---------- low level ---------- */

function available() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    const probe = "__faimgo_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch (e) {
    return false;
  }
}

/*
  MIGRATION — read this before changing SCHEMA.

  This function used to be one line: `if (obj.schema !== SCHEMA) return null`.
  That was correct in July, when the only thing in storage was a half-finished
  assessment nobody would miss. It stopped being correct on Aug 12, when the
  completion record moved in — because from that day the line meant "the next
  time anyone adds a field, silently delete every user's record of what they
  have finished." The file's own comment predicted exactly this and the code
  was never changed to match it. It is changed now.

  Three cases, and the third is the one people get wrong:

  1. Same schema — use it.
  2. Older schema — walk it forward one step at a time. Each branch must be
     additive and must never throw; a migration that can fail is a delete
     with extra steps.
  3. NEWER schema than this build knows — keep it and use it anyway. This
     happens when someone has an old cached bundle open in one tab while a
     new deployment has already written newer data. We only ever read fields
     we know about, so unknown fields are harmless, and the version number is
     deliberately NOT renumbered downward — the newer build must still
     recognise its own data when the tab is refreshed.

  The rule underneath all three: this function may return null when there is
  genuinely nothing stored. It may never return null because it did not
  recognise something.
*/
function migrate(obj) {
  let o = obj;

  /* v1 → v2: `steps` and `history` become first-class. v1 records written
     before Aug 12 have no `steps` key at all; ones written after have it but
     have never had `history`. Both are handled by filling in the defaults —
     nothing is read from the old shape that isn't kept. */
  if (o.schema === 1) {
    o = Object.assign({}, o, {
      schema: 2,
      steps: o.steps && typeof o.steps === "object" ? o.steps : {},
      history: Array.isArray(o.history) ? o.history : [],
    });
  }

  /* v2 → v3: the single `plan` slot becomes a `plans` array, addressable by
     id, so that opening one saved walkthrough can no longer show a different
     one that overwrote it. A v2 record has at most one plan, so this never
     loses anything — it just gives that one plan an id and a home in the
     array, and makes it the active one. Records with no plan at all just get
     an empty array. */
  if (o.schema === 2) {
    const legacyPlan = o.plan && typeof o.plan === "object" ? o.plan : null;
    const plans = legacyPlan
      ? [{ ...legacyPlan, id: uid(), fingerprint: answersFingerprint(legacyPlan.answers) }]
      : [];
    o = Object.assign({}, o, {
      schema: 3,
      plans,
      activePlanId: plans.length ? plans[0].id : null,
    });
    delete o.plan;
  }

  /* v3 → v4: adds `linkedEmail` — set once this device has proven ownership
     of an email via the restore flow (see mergeRestoredPlans() below). A v3
     record has never gone through that flow, so `null` is exactly correct
     for every existing record; nothing is inferred or guessed. */
  if (o.schema === 3) {
    o = Object.assign({}, o, {
      schema: 4,
      linkedEmail: o.linkedEmail !== undefined ? o.linkedEmail : null,
    });
  }

  return o;
}

function read() {
  if (!available()) return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return null;
    if (typeof obj.schema !== "number") return null; // not ours, or corrupt
    if (obj.schema === SCHEMA) return obj;
    if (obj.schema > SCHEMA) return obj;            // newer build wrote it — leave it alone
    return migrate(obj);
  } catch (e) {
    return null;
  }
}

function write(obj) {
  if (!available()) return false;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(obj));
    return true;
  } catch (e) {
    return false; // quota, or the user cleared permissions mid-session
  }
}

function uid() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch (e) { /* fall through */ }
  return "f" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/*
  A stable fingerprint of an answers object — same answers always produce the
  same string, regardless of key order or the order values were set in an
  array-valued answer. This is what tells a genuine resubmit (retry after a
  blocked send, reopening the gate without changing anything) apart from a
  person who answered differently on purpose: the former should update the
  SAME saved plan in place, the latter must get its own.
*/
export function answersFingerprint(answers) {
  const a = answers && typeof answers === "object" ? answers : {};
  const keys = Object.keys(a).sort();
  const norm = keys.map((k) => {
    const v = a[k];
    const nv = Array.isArray(v) ? [...v].sort() : v;
    return [k, nv];
  });
  try {
    return JSON.stringify(norm);
  } catch (e) {
    return "";
  }
}

function blank(now) {
  return {
    schema: SCHEMA,
    fid: uid(),
    createdAt: now,
    sid: null,
    lastSeen: 0,
    visits: 0,
    progress: null, // { answers, step, protectFrom, email, ts }
    plans: [],      // [{ id, fingerprint, answers, results, email, protectFrom, otherIdea, emailed, ts }]
    activePlanId: null, // id of the plan most recently viewed/submitted on this device
    steps: {},      // { [playId]: { done, at, note, outcome, outcomeAt } }
    history: [],    // [{ at, steps }] — completions from plans that were replaced
    linkedEmail: null, // set once this device has verified an email via the restore flow
    /* src/ref deliberately absent here — see captureAttribution() below.
       Their absence (undefined, not null) is what marks "never looked yet",
       which is how first-touch capture tells itself apart from a repeat visit. */
  };
}

/*
  First-touch source attribution. Which channel a person arrived from cannot
  be reconstructed after the fact, and until this batch nothing recorded it —
  every conversion number we could quote was silent on where the person came
  from, which decides where Ben actually spends his hours once promotion
  starts.

  Captured ONCE per fid, ever, the first time session() runs for them —
  never overwritten by a later visit, because attribution should describe how
  someone originally found Faimgo, not their most recent click. `src` is the
  `?src=` query param a link can carry; `ref` is document.referrer, capped to
  keep one long URL from bloating storage. Both stored as `null` (not left
  undefined) once looked at, so "captured, found nothing" is distinguishable
  from "never captured" on every future call.
*/
function captureAttribution(s) {
  if (s.src !== undefined && s.ref !== undefined) return s;
  let src = null, ref = null;
  try {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      src = params.get("src") || null;
    }
    if (typeof document !== "undefined") {
      ref = (document.referrer || "").slice(0, 300) || null;
    }
  } catch (e) { /* attribution must never break the flow */ }
  return { ...s, src, ref };
}

/* ---------- public ---------- */

/*
  Call once, on mount, client side only. Returns the ids plus enough context
  to greet a returning person honestly. Never call this during render — the
  `returning` flag would differ between server and client and break hydration.
*/
export function session() {
  const now = Date.now();
  const existed = read();
  let s = existed || blank(now);

  const newSitting = !s.sid || now - (s.lastSeen || 0) > SESSION_GAP_MS;
  if (newSitting) {
    s.sid = uid();
    s.visits = (s.visits || 0) + 1;
  }
  s.lastSeen = now;
  s = captureAttribution(s);
  const stored = write(s);

  return {
    fid: s.fid,
    sid: s.sid,
    visits: s.visits,
    newSitting,
    returning: Boolean(existed) && s.visits > 1,
    src: s.src ?? null,
    ref: s.ref ?? null,
    stored, // false = storage unavailable; nothing will be remembered
  };
}

/* What we already know about this person on this device. */
/*
  Read the ids WITHOUT touching them. session() is the one that mints a new
  sitting and increments the visit count, so anything that merely wants to
  label a payload must not call it — a feedback form that started a new
  session just by being submitted would corrupt the funnel it reports on.
  Returns nulls when storage is unavailable; callers must tolerate that.
*/
export function whoAmI() {
  const s = read();
  if (!s) return { fid: null, sid: null, visits: 0 };
  return { fid: s.fid || null, sid: s.sid || null, visits: s.visits || 0 };
}

/*
  What we know for a specific saved plan, or — with no id — the most recently
  active one. `id` is how a specific "Open my walkthrough" link (from the
  results page, or from an emailed plan) says which submission it means,
  instead of always landing on whatever was submitted most recently on this
  device. Links written before this existed carry no id at all, so the
  fallback to "most recent" is deliberate and permanent, not a bug.
*/
export function loadSaved(id) {
  const s = read();
  if (!s) return null;
  const plans = Array.isArray(s.plans) ? s.plans : [];
  let plan = null;
  if (id) {
    plan = plans.find((p) => p && p.id === id) || null;
  }
  if (!plan && s.activePlanId) {
    plan = plans.find((p) => p && p.id === s.activePlanId) || null;
  }
  if (!plan && plans.length) {
    plan = plans[plans.length - 1];
  }
  const has = Boolean(plan) || Boolean(s.progress);
  if (!has) return null;
  return { plan: plan || null, progress: s.progress || null, visits: s.visits || 0 };
}

/*
  Autosave mid-assessment. Cheap enough to call on every answer.
  Deliberately stores the email they typed at the gate: it is their own
  address on their own device, and without it a resumed session would have
  to ask for it twice.
*/
export function saveProgress({ answers, step, protectFrom, email }) {
  const s = read();
  if (!s) return false;
  s.progress = {
    answers: answers || {},
    step: typeof step === "number" ? step : 0,
    protectFrom: protectFrom ?? null,
    email: email || "",
    ts: Date.now(),
  };
  return write(s);
}

/*
  The plan they were actually shown. Saved at the moment of submit so a
  returning person lands on their plan instead of an empty intro screen.
  Progress is cleared at the same time — the plan supersedes it.

  Returns the plan's id on success, false on failure — the caller needs the
  id to build a link that points at THIS plan specifically, not whatever is
  active on the device by the time the link is opened.

  Resubmitting the exact same answers (a retry after a blocked send, or
  reopening the gate without changing anything) updates the matching plan in
  place instead of creating a duplicate — matched by answersFingerprint(), not
  by id, since the caller may not have an id yet on the very first save.
  Genuinely different answers always get a new id. The list is capped at
  MAX_PLANS, oldest dropped first; the plan just written is always most
  recent.
*/
export function savePlan({ answers, results, email, protectFrom, otherIdea, emailed }) {
  const s = read();
  if (!s) return false;
  const plans = Array.isArray(s.plans) ? s.plans : [];
  const fingerprint = answersFingerprint(answers);
  const existing = plans.find((p) => p && p.fingerprint === fingerprint);
  const id = (existing && existing.id) || uid();
  const entry = {
    id,
    fingerprint,
    answers: answers || {},
    results: results || null,
    email: email || "",
    protectFrom: protectFrom ?? null,
    otherIdea: otherIdea || "",
    emailed: emailed || null,
    ts: Date.now(),
  };
  const rest = plans.filter((p) => p && p.id !== id);
  rest.push(entry);
  s.plans = rest.length > MAX_PLANS ? rest.slice(-MAX_PLANS) : rest;
  s.activePlanId = id;
  s.progress = null;
  return write(s) ? id : false;
}

/*
  Retake. Wipes the in-progress answers but KEEPS fid, visit count and
  createdAt — the person didn't stop being the same person, they just wanted
  a different answer. Losing the id here would quietly poison the numbers.
  As of Aug 12 it also keeps every completion, moved aside rather than
  destroyed — see the long comment inside.

  As of this batch it also KEEPS every saved plan (s.plans / activePlanId
  untouched). Starting over is no longer destructive to a plan someone
  already has a link to, in email or on the results page — it used to
  silently erase that single stored slot, which was the same overwrite bug
  this batch fixes, just reached from the "start over" button instead of a
  second submit.
*/
export function clearWork() {
  const s = read();
  if (!s) return false;
  s.progress = null;

  /*
    Completions are ARCHIVED here, not deleted — and the difference is the
    whole business.

    The original reasoning for clearing them was sound as far as it went:
    they belong to the plan that was replaced, and carrying them onto a
    different path would claim credit for steps that are not in the new
    walkthrough. That argument justifies removing them from the CURRENT plan.
    It does not justify destroying them, and the code did both.

    Which made this the single most dangerous line in the product. The
    direction this whole thing now rests on says progress never resets; the
    completion record is the one asset nothing else can substitute for; and
    yet a person who retook the assessment out of curiosity — which is the
    normal, encouraged thing to do — silently erased it. Ben did exactly that
    to his own record, repeatedly, while testing.

    So: the current plan gets a clean slate, and the record survives beside
    it. Nothing here is rendered today. It exists because the alternative is
    data that cannot be recovered at any price later, and because "we deleted
    the proof that you finished things" is not a sentence this product can
    ever be in a position to say.

    Capped at MAX_HISTORY because localStorage has a hard quota and a write
    that throws would take the whole record with it. The cap drops the OLDEST
    entries, never the newest.
  */
  const finished = s.steps && typeof s.steps === "object" ? s.steps : {};
  if (Object.keys(finished).length > 0) {
    if (!Array.isArray(s.history)) s.history = [];
    s.history.push({ at: Date.now(), steps: finished });
    if (s.history.length > MAX_HISTORY) s.history = s.history.slice(-MAX_HISTORY);
  }
  s.steps = {};
  return write(s);
}

/* ---------- completed steps ----------
   The record of what someone has actually FINISHED, as opposed to what they
   were shown. From Aug 10 this is the centre of the product rather than a
   nice-to-have: nothing can be exchanged, shared or charged for until
   somebody has finished something, and until now there was nowhere to put
   the answer to "did you do it?".

   Three rules this shape exists to enforce:

   1. **It never resets.** Not on a new sitting, not after a gap, not ever.
      There is deliberately no streak and no last-seen comparison anywhere in
      here, because the person this product is for has fragmented time — and
      a broken streak is the moment people quit. Come back after a month and
      the record is exactly where you left it.
   2. **Marking a step done is reversible.** People tick things by accident,
      and a record you cannot correct is one people stop trusting.
   3. **The optional note is the seed of everything later.** Self-report is
      right for now (friction is what kills completion, and at ten users
      trust is not the bottleneck), but a year of "what actually happened"
      is what future verification gets built on top of. Cheap to collect now,
      impossible to collect retroactively. */
export function markStep(playId, done, note) {
  if (!playId) return false;
  const s = read();
  if (!s) return false;
  if (!s.steps || typeof s.steps !== "object") s.steps = {};
  if (done) {
    const existing = s.steps[playId] || {};
    s.steps[playId] = {
      done: true,
      at: existing.at || Date.now(),        // first completion time, not the last edit
      note: note !== undefined ? note : (existing.note || ""),
    };
    /* Re-marking a step that was already done must not silently drop a
       reported outcome. Only copied when it exists, so a fresh completion
       stays free of empty keys. */
    if (existing.outcome) {
      s.steps[playId].outcome = existing.outcome;
      s.steps[playId].outcomeAt = existing.outcomeAt || Date.now();
    }
  } else {
    delete s.steps[playId];
  }
  return write(s);
}

/*
  Did the step produce anything? — the other half of the completion record.

  `markStep` answers "was it done". This answers "did it work", and they are
  genuinely different questions: the walkthrough is full of steps a person can
  complete perfectly and still hear nothing back for a fortnight. Recording
  only the first one tells us people are moving and never tells us whether the
  advice is any good.

  Three rules this shape enforces:

  1. **It is asked AFTER the step is already marked done, never during.**
     Friction at the moment of completion is what kills completion. By the
     time this is asked the record is already safely stored, so the worst
     case of someone ignoring it is that we learn less — never that we lose
     the completion itself.
  2. **It is voluntary, and it is re-answerable.** "Not yet" on Tuesday and
     "money" on Friday is the single most valuable transition this product
     can observe, so the answer is deliberately not frozen. `outcomeAt` moves
     with it; `at` — when the step was finished — never does.
  3. **Only on a step that is done.** An outcome without a completion is a
     claim, and this file only stores records.

  Returns false if there is nothing to attach to, so the caller can tell the
  difference between "stored" and "quietly ignored".
*/
export function markOutcome(playId, outcome) {
  if (!playId) return false;
  if (outcome !== null && OUTCOMES.indexOf(outcome) === -1) return false;
  const s = read();
  if (!s) return false;
  if (!s.steps || typeof s.steps !== "object") return false;
  const existing = s.steps[playId];
  if (!existing || !existing.done) return false;
  if (outcome === null) {
    delete existing.outcome;
    delete existing.outcomeAt;
  } else {
    existing.outcome = outcome;
    existing.outcomeAt = Date.now();
  }
  return write(s);
}

/*
  Has this person ever reported money, on any step, ever — including on plans
  they have since replaced?

  This exists so the `first_dollar` event can be fired exactly once per person
  instead of once per step. It is the number the whole direction points at, so
  it has to mean what it says: five steps that each produced money is one
  person's first dollar, not five.

  The archive is searched too, deliberately. Someone who earned on a path they
  later abandoned still earned.
*/
export function hasEverEarned() {
  const s = read();
  if (!s) return false;
  const anyMoney = (set) =>
    Boolean(set) && typeof set === "object" &&
    Object.keys(set).some((k) => set[k] && set[k].outcome === "money");
  if (anyMoney(s.steps)) return true;
  return Array.isArray(s.history) && s.history.some((h) => h && anyMoney(h.steps));
}

/* What has been finished. Returns {} rather than null so callers never guard. */
export function readSteps() {
  const s = read();
  return (s && s.steps && typeof s.steps === "object") ? s.steps : {};
}

/*
  Completions carried over from plans that were replaced. Nothing renders this
  yet — it exists so that retaking the assessment stops being destructive (see
  clearWork). Returns [] rather than null so callers never guard.
*/
export function readHistory() {
  const s = read();
  return (s && Array.isArray(s.history)) ? s.history : [];
}

/* ---------- cross-device restore ----------
   The other half of api/restore/route.js's verify step. That endpoint proves
   someone owns an email and hands back every plan Postgres has on record for
   them (src/lib/db.js's mirrorPlan() is what put them there in the first
   place, on every ordinary submit). This is where those plans actually
   become usable on a device that has never seen them: merged into the same
   `plans` array everything else in this file already reads from, so nothing
   downstream — /plan, the results screen, MAX_PLANS trimming — needs to know
   restored plans are any different from ones submitted locally. */

/*
  Which email this device has proven ownership of, if any — set by
  mergeRestoredPlans() below. Read-only counterpart, used to show a subtle
  "restored — you're seeing plans for X" indicator without needing a full
  session/cookie system: the device already remembers who it belongs to the
  same way it remembers fid, just now optionally an email too.
*/
export function getLinkedEmail() {
  const s = read();
  return (s && s.linkedEmail) || null;
}

/*
  Merge plans fetched from the server (api/restore/route.js's verify
  response) into this device's local `plans` array, and remember the email
  that authorized it.

  Matched by id first (a restored plan whose id already exists locally —
  e.g. this same device, reconnecting after clearing storage — updates in
  place rather than duplicating), falling back to answersFingerprint() for
  anything id-less. Genuinely new plans are appended. The existing MAX_PLANS
  cap then applies uniformly by recency (`ts`), exactly as it already does
  for locally-submitted plans — restoring five years of history onto a
  five-slot device still only keeps the five most recent, which is the same
  trade-off this file already makes everywhere else, not a new one invented
  for this feature.

  Returns the number of plans actually merged, or false if storage is
  unavailable.
*/
export function mergeRestoredPlans(serverPlans, email) {
  const s = read();
  if (!s) return false;
  const incoming = Array.isArray(serverPlans) ? serverPlans : [];
  const existing = Array.isArray(s.plans) ? s.plans : [];

  let merged = existing.slice();
  let mergedCount = 0;
  for (const sp of incoming) {
    if (!sp || !sp.plan_id) continue;
    const fingerprint = answersFingerprint(sp.answers);
    const matchIdx = merged.findIndex(
      (p) => p && (p.id === sp.plan_id || p.fingerprint === fingerprint)
    );
    const entry = {
      id: sp.plan_id,
      fingerprint,
      answers: sp.answers || {},
      results: sp.results || null,
      email: email || "",
      protectFrom: sp.protect_from ?? null,
      otherIdea: sp.other_idea || "",
      emailed: "sent", // it reached Postgres via a successful submit; treat as delivered
      ts: sp.updated_at ? new Date(sp.updated_at).getTime() : Date.now(),
    };
    if (matchIdx === -1) {
      merged.push(entry);
      mergedCount++;
    } else {
      merged[matchIdx] = entry;
      mergedCount++;
    }
  }

  merged.sort((a, b) => (a.ts || 0) - (b.ts || 0));
  s.plans = merged.length > MAX_PLANS ? merged.slice(-MAX_PLANS) : merged;
  if (s.plans.length) s.activePlanId = s.plans[s.plans.length - 1].id;
  s.linkedEmail = email || s.linkedEmail || null;

  return write(s) ? mergedCount : false;
}

/* Full reset, id included. For a "forget me" control — not wired to any UI yet. */
export function forgetMe() {
  if (!available()) return false;
  try {
    window.localStorage.removeItem(KEY);
    return true;
  } catch (e) {
    return false;
  }
}
