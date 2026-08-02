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
  Bump SCHEMA and add a migration branch in read(). Today an unknown schema
  is dropped, which is correct while nothing valuable is stored; once real
  progress lives here, migrate instead of dropping.
*/

const KEY = "faimgo.v1";
const SCHEMA = 1;
const SESSION_GAP_MS = 30 * 60 * 1000; // 30 minutes away = a new sitting

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

function read() {
  if (!available()) return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== "object") return null;
    if (obj.schema !== SCHEMA) return null; // future: migrate here, don't drop
    return obj;
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

function blank(now) {
  return {
    schema: SCHEMA,
    fid: uid(),
    createdAt: now,
    sid: null,
    lastSeen: 0,
    visits: 0,
    progress: null, // { answers, step, protectFrom, email, ts }
    plan: null,     // { answers, results, email, protectFrom, otherIdea, emailed, ts }
  };
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
  const s = existed || blank(now);

  const newSitting = !s.sid || now - (s.lastSeen || 0) > SESSION_GAP_MS;
  if (newSitting) {
    s.sid = uid();
    s.visits = (s.visits || 0) + 1;
  }
  s.lastSeen = now;
  const stored = write(s);

  return {
    fid: s.fid,
    sid: s.sid,
    visits: s.visits,
    newSitting,
    returning: Boolean(existed) && s.visits > 1,
    stored, // false = storage unavailable; nothing will be remembered
  };
}

/* What we already know about this person on this device. */
export function loadSaved() {
  const s = read();
  if (!s) return null;
  const has = Boolean(s.plan) || Boolean(s.progress);
  if (!has) return null;
  return { plan: s.plan || null, progress: s.progress || null, visits: s.visits || 0 };
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
*/
export function savePlan({ answers, results, email, protectFrom, otherIdea, emailed }) {
  const s = read();
  if (!s) return false;
  s.plan = {
    answers: answers || {},
    results: results || null,
    email: email || "",
    protectFrom: protectFrom ?? null,
    otherIdea: otherIdea || "",
    emailed: emailed || null,
    ts: Date.now(),
  };
  s.progress = null;
  return write(s);
}

/*
  Retake. Wipes the answers and the plan but KEEPS fid, visit count and
  createdAt — the person didn't stop being the same person, they just wanted
  a different answer. Losing the id here would quietly poison the numbers.
*/
export function clearWork() {
  const s = read();
  if (!s) return false;
  s.progress = null;
  s.plan = null;
  return write(s);
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
