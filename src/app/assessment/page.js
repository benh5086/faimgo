"use client";

import { useState } from "react";

/* ============================================================
   FAIMGO ASSESSMENT v2
   Everything tailorable lives in the CONFIG section below:
   question wording, options, path library, scoring weights,
   verdict copy. Edit text freely — the engine reads from here.
   ============================================================ */

/* ---------- BRAND ---------- */
const C = {
  cream: "#FAF7F2",
  green: "#1B3A2D",
  gold: "#C49A3C",
  beige: "#F0EBE1",
  gray: "#6B7280",
  ink: "#1C1C1C",
  greenSoft: "#E4EEE9",
  yellowSoft: "#FBF3DE",
  yellow: "#8A6A14",
  redSoft: "#F9E9E5",
  red: "#9C3B2E",
};

/* ---------- CONFIG: PATH LIBRARY ---------- */
const PATHS = [
  { id: "freelance", name: "Freelancing Your Skill", plain: "Freelance my skill (writing, design, tech, admin)", dollar: "1–3 weeks", speed: 4, ceiling: 4,
    moves: ["List the one skill people already ask you for help with", "Create one profile (Upwork or direct outreach) with a specific offer, not a generic title", "Pitch 10 real prospects with a personalized first line — volume beats polish"],
    kit: ["Free portfolio: Notion or Google Docs — no website needed for client #1", "Use free tiers (Canva, AI assistants) before paying for any tool"] },
  { id: "resell", name: "Reselling & Flipping", plain: "Resell / flip items (thrift, clearance, marketplaces)", dollar: "days", speed: 5, ceiling: 3,
    moves: ["Pick one category you can judge value in — start with what you know", "Source 5 items this weekend: thrift stores, clearance aisles, garage sales", "List the same day on FB Marketplace + eBay; price to sell, not to hope"],
    kit: ["Start with $50 and one shelf — no storage unit until profits pay for it", "Free listing photos: natural light + a plain wall beats any equipment"] },
  { id: "local", name: "Local Services", plain: "Local services (cleaning, lawn care, pressure washing, moving help)", dollar: "days", speed: 5, ceiling: 3,
    moves: ["Pick one service, one neighborhood — be the person for that thing", "Post in local FB groups + Nextdoor with a simple before/after and a price", "Do the first 3 jobs cheap in exchange for reviews and photos"],
    kit: ["Rent equipment for the first jobs (Home Depot rents by the day) — buy after job #5 pays for it", "Used tools on FB Marketplace go for 30–50% of retail"] },
  { id: "gig", name: "Gig Apps", plain: "Gig apps (delivery, rideshare, task apps)", dollar: "this week", speed: 5, ceiling: 2,
    moves: ["Sign up for two apps today — approval takes days, so start the clock now", "Work the peak windows only (meal times, weekends) — the hourly rate doubles", "Track your real earnings minus gas for 2 weeks before scaling up"],
    kit: [] },
  { id: "tutor", name: "Tutoring & Coaching", plain: "Tutoring or coaching (academics, language, fitness, a skill)", dollar: "1–2 weeks", speed: 4, ceiling: 4,
    moves: ["Define exactly who you teach and what outcome they get", "Post one clear offer on Wyzant/Preply or in local parent/community groups", "Offer the first session discounted in exchange for a testimonial"],
    kit: ["Free scheduling: Calendly free tier", "No certification needed to start most subjects — results are the credential"] },
  { id: "va", name: "Virtual Assistant / Online Services", plain: "Virtual assistant or online services", dollar: "2–4 weeks", speed: 3, ceiling: 3,
    moves: ["List 5 concrete tasks you'd handle (inbox, scheduling, data, listings)", "Message 15 small business owners who are visibly drowning — offer 5 trial hours", "Turn the first happy client into a weekly retainer"],
    kit: ["Everything you need is free: Gmail, Sheets, Calendly, Trello"] },
  { id: "digital", name: "Digital Products", plain: "Digital products (templates, printables, mini-courses)", dollar: "1–3 months", speed: 2, ceiling: 4,
    moves: ["Find one specific problem people already search for (check Etsy/Gumroad bestsellers)", "Build one small product in a weekend — a template, not a masterpiece", "List it, then spend 80% of your time on distribution, not more products"],
    kit: ["Free build stack: Canva free + Gumroad (no upfront fees, they take a cut)"] },
  { id: "content", name: "Content Creation", plain: "Content creation (YouTube, TikTok, newsletter)", dollar: "2–6 months", speed: 1, ceiling: 5,
    moves: ["Pick one platform and one narrow topic you can talk about for a year", "Publish on a fixed schedule for 8 weeks before judging anything", "Study your 2 best performers and make more of exactly that"],
    kit: ["Your phone camera is enough for the first 100 videos — creators upgrade after traction, not before"] },
  { id: "care", name: "Care Services", plain: "Care services (pet sitting, babysitting, senior help)", dollar: "1–2 weeks", speed: 4, ceiling: 3,
    moves: ["Create profiles on Rover/Care.com and tell your own network you're available", "Get 3 references lined up — trust is the entire product", "Nail the first bookings, ask every happy client for a review and a referral"],
    kit: ["Certifications (CPR, first aid) cost ~$30–50 online and double your credibility — worth it after first jobs, not before"] },
];
const pathById = (id) => PATHS.find((p) => p.id === id);

/* ---------- CONFIG: QUESTIONS ---------- */
const QUESTIONS = [
  { key: "q1", section: "Your Direction", title: "Do you already have something in mind?", opts: [
    { t: "Yes — a specific thing I want to do", v: "yes" },
    { t: "Sort of — a general area", v: "sortof", s: "working with people, making things, online business…" },
    { t: "No — that's why I'm here. Match me.", v: "no" }] },
  { key: "q1b", condKey: "named", section: "Your Direction", title: "Which of these is closest to it?", other: true,
    opts: [...PATHS.map((p) => ({ t: p.plain, v: p.id })), { t: "Something else", v: "other", s: "tell us in a few words" }] },
  { key: "q2", condKey: "named", section: "Your Direction", title: "What's pulling you toward it?", opts: [
    { t: "I've done it before, or something close to it", v: "done" },
    { t: "It's something I love or already do for fun", v: "love" },
    { t: "It looks like good money", v: "money" },
    { t: "I've seen others succeed at it and want in", v: "seen" }] },
  { key: "q3", condKey: "named", section: "Your Direction", title: "How much do you actually know about it?", opts: [
    { t: "I've done it professionally or seriously", v: "pro" },
    { t: "Hobby level — informal but real", v: "hobby" },
    { t: "I've researched it but never done it", v: "research" },
    { t: "Almost nothing yet, just interested", v: "none" }] },
  { key: "q4", section: "Your Direction", title: "How many hours a week can you realistically give this — working on it, learning it, all of it?", opts: [
    { t: "Less than 5 — squeezing it in", v: "lt5" },
    { t: "5–10 — a few evenings", v: "5to10" },
    { t: "10–20 — serious side commitment", v: "10to20" },
    { t: "20+ — this is a priority", v: "20plus" }] },
  { key: "break1", type: "insight1" },
  { key: "q5", section: "Your Resources & Reality", title: "How much could you put in to start — without stressing about it?", opts: [
    { t: "$0 — needs to be free to start", v: "0" },
    { t: "Under $100", v: "100" },
    { t: "$100–$500", v: "500" },
    { t: "$500+ — I can invest in this", v: "500plus" }] },
  { key: "q6", section: "Your Resources & Reality", title: "What do you already have that could help you start?", multi: true, opts: [
    { t: "A reliable car", v: "car" },
    { t: "A computer + solid internet", v: "computer" },
    { t: "Tools or equipment (lawn, cleaning, craft, camera…)", v: "tools" },
    { t: "Spare space (garage, storage, a spare room)", v: "space" },
    { t: "None of these right now", v: "none" }] },
  { key: "q7", section: "Your Resources & Reality", title: "How soon do you want to see your first dollar from this?", opts: [
    { t: "This week if possible", v: "week" },
    { t: "Within a month", v: "month" },
    { t: "1–3 months is fine", v: "quarter" },
    { t: "No rush — I'm building something bigger", v: "norush" }] },
  { key: "q8", section: "Your Resources & Reality", title: "Which sounds more like you?", opts: [
    { t: "Give me guaranteed small money over a risky big win", v: "safe" },
    { t: "Mostly sure things, with a little upside", v: "mostlysafe" },
    { t: "Balanced — some safe, some bets", v: "balanced" },
    { t: "I'll bet my time on a bigger payoff", v: "bet" }] },
  { key: "break2", type: "insight2" },
  { key: "q9", section: "How You Work", title: "What gives you energy?", opts: [
    { t: "Being around people, face to face", v: "people" },
    { t: "People in small doses — online is ideal", v: "online" },
    { t: "Mostly working alone", v: "alone" },
    { t: "Strictly solo, headphones on", v: "solo" }] },
  { key: "q10", section: "How You Work", title: "How do you feel about putting yourself out there online?", opts: [
    { t: "Love it — camera doesn't scare me", v: "camera" },
    { t: "Happy to post, prefer not on camera", v: "post" },
    { t: "Behind the scenes only", v: "behind" },
    { t: "I'd rather work offline entirely", v: "offline" }] },
  { key: "q11", section: "How You Work", title: "Which feels most like you?", opts: [
    { t: "Making and creating things", v: "make" },
    { t: "Selling, negotiating, closing", v: "sell" },
    { t: "Helping and taking care of people", v: "help" },
    { t: "Building systems and keeping things running", v: "systems" }] },
  { key: "q12", section: "How You Work", title: "What's gotten in the way before?", opts: [
    { t: "Never knew where to start", v: "start" },
    { t: "Started things but lost steam", v: "steam" },
    { t: "Time — life keeps eating it", v: "time" },
    { t: "Scared of wasting money", v: "scared" },
    { t: "This is my first real attempt", v: "first" }] },
  { key: "gate", type: "gate" },
  { key: "results", type: "results" },
];

/* ---------- SCORING ENGINE ---------- */
function computeScores(A) {
  const scores = {};
  const excluded = new Set();
  PATHS.forEach((p) => (scores[p.id] = 0));
  const add = (id, n) => { if (scores[id] !== undefined) scores[id] += n; };
  const assets = A.q6 || [];
  if (!assets.includes("car")) excluded.add("gig");
  else { add("gig", 2); add("local", 2); }
  if (!assets.includes("computer")) ["freelance", "va", "digital", "content"].forEach((i) => add(i, -2));
  else ["freelance", "va", "digital", "content"].forEach((i) => add(i, 1));
  if (assets.includes("tools")) add("local", 2);
  if (!assets.includes("space")) add("resell", -1); else add("resell", 2);
  const hourBoost = { lt5: ["gig", "resell", "care"], "5to10": ["resell", "care", "local", "tutor"], "10to20": ["freelance", "local", "tutor", "va"], "20plus": ["freelance", "digital", "content"] }[A.q4] || [];
  hourBoost.forEach((i) => add(i, 2));
  if (A.q5 === "0") { add("resell", -1); ["va", "tutor", "care", "freelance"].forEach((i) => add(i, 1)); }
  if (A.q5 === "500plus") ["digital", "content", "freelance", "local"].forEach((i) => add(i, 1));
  if (A.q7 === "week") PATHS.filter((p) => p.speed === 5).forEach((p) => add(p.id, 2));
  if (A.q7 === "norush") PATHS.filter((p) => p.ceiling >= 4).forEach((p) => add(p.id, 1));
  if (A.q8 === "safe" || A.q8 === "mostlysafe") PATHS.filter((p) => p.speed >= 4).forEach((p) => add(p.id, 1));
  if (A.q8 === "bet") PATHS.filter((p) => p.ceiling >= 4).forEach((p) => add(p.id, 2));
  const energyBoost = { people: ["local", "care", "tutor"], online: ["va", "tutor", "freelance"], alone: ["freelance", "digital", "resell"], solo: ["digital", "freelance", "content"] }[A.q9] || [];
  energyBoost.forEach((i) => add(i, 2));
  if (A.q10 === "camera") add("content", 3);
  if (A.q10 === "offline") { excluded.add("content"); ["freelance", "va", "digital"].forEach((i) => add(i, -1)); ["local", "care", "resell"].forEach((i) => add(i, 1)); }
  if (A.q10 === "behind") add("content", -2);
  const styleBoost = { make: ["digital", "freelance", "content"], sell: ["resell", "freelance", "local"], help: ["care", "tutor", "local"], systems: ["va", "freelance"] }[A.q11] || [];
  styleBoost.forEach((i) => add(i, 2));
  if (A.q1b && A.q1b !== "other") {
    add(A.q1b, 4);
    add(A.q1b, { done: 3, love: 2, seen: 1, money: 0 }[A.q2] || 0);
  }
  return { scores, excluded };
}
function pathsInPlay(A) {
  const { scores, excluded } = computeScores(A);
  return PATHS.filter((p) => !excluded.has(p.id) && scores[p.id] > -2).length;
}
function realityFlag(A) {
  if (!A.q1b || A.q1b === "other") return null;
  const p = pathById(A.q1b);
  const noExp = A.q3 === "research" || A.q3 === "none";
  const fast = A.q7 === "week";
  const slow = p.speed <= 2;
  if (slow && noExp && fast) return "red";
  if ((slow && noExp) || (slow && fast) || (noExp && fast && A.q2 === "money")) return "yellow";
  return "green";
}
function fastestWin(A, exceptId) {
  const { scores, excluded } = computeScores(A);
  const cands = PATHS.filter((p) => p.speed >= 4 && !excluded.has(p.id) && p.id !== exceptId);
  cands.sort((a, b) => scores[b.id] - scores[a.id]);
  return cands[0];
}
function longTerm(A, exceptId) {
  const { scores, excluded } = computeScores(A);
  const cands = PATHS.filter((p) => !excluded.has(p.id) && p.id !== exceptId);
  cands.sort((a, b) => scores[b.id] * b.ceiling - scores[a.id] * a.ceiling);
  return cands[0];
}
function whyFits(A, p) {
  const bits = [];
  const assets = A.q6 || [];
  if (A.q1b === p.id) bits.push("you told us this is where you want to go");
  if (p.id === "local" && assets.includes("tools")) bits.push("you already own tools most people would have to buy");
  if ((p.id === "gig" || p.id === "local") && assets.includes("car")) bits.push("you have the car it runs on");
  if (["freelance", "va", "digital", "content"].includes(p.id) && assets.includes("computer")) bits.push("your computer is the only equipment it needs");
  if (A.q9 === "people" && ["local", "care", "tutor"].includes(p.id)) bits.push("it puts you face to face with people, which is where you get energy");
  if ((A.q9 === "alone" || A.q9 === "solo") && ["freelance", "digital", "resell"].includes(p.id)) bits.push("you can run it mostly solo");
  if (A.q11 === "help" && ["care", "tutor"].includes(p.id)) bits.push("it's built on taking care of people — your natural mode");
  if (A.q11 === "make" && ["digital", "content", "freelance"].includes(p.id)) bits.push("it rewards making things");
  if (A.q11 === "sell" && ["resell", "local"].includes(p.id)) bits.push("it rewards your seller instincts");
  if (A.q7 === "week" && p.speed >= 5) bits.push("it can genuinely pay within days");
  if (bits.length === 0) bits.push("it scored highest across your time, resources, and working style");
  return "This fits because " + bits.slice(0, 3).join(", ") + ".";
}
function needsKit(A, p) {
  const assets = A.q6 || [];
  if (p.id === "local" && !assets.includes("tools")) return true;
  if (p.id === "resell" && (A.q5 === "0" || !assets.includes("space"))) return true;
  if (["freelance", "digital", "content", "va"].includes(p.id) && !assets.includes("computer")) return true;
  if ((p.id === "tutor" || p.id === "care") && A.q5 === "0") return true;
  return false;
}

/* ---------- UI PIECES ---------- */
function Opt({ label, sub, selected, onClick }) {
  return (
    <button onClick={onClick}
      className="block w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all text-[15px] leading-snug"
      style={{ borderColor: selected ? C.green : C.beige, backgroundColor: selected ? C.greenSoft : "#FFFFFF", color: C.ink, fontWeight: selected ? 600 : 400 }}>
      {label}
      {sub && <span className="block text-[13px] mt-0.5" style={{ color: C.gray, fontWeight: 400 }}>{sub}</span>}
    </button>
  );
}
function Tag({ children }) {
  return <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.gold }}>{children}</p>;
}
function Moves({ moves }) {
  return (
    <ol className="mt-3 mb-1">
      {moves.map((m, i) => (
        <li key={i} className="flex gap-3 items-start py-2.5 text-sm leading-relaxed" style={{ borderTop: i ? `1px dashed ${C.beige}` : "none", color: C.ink }}>
          <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: C.beige, color: C.green }}>{i + 1}</span>
          {m}
        </li>
      ))}
    </ol>
  );
}
function Kit({ items }) {
  return (
    <div className="mt-3 p-4 rounded-xl border border-dashed" style={{ backgroundColor: C.cream, borderColor: C.gold }}>
      <p className="text-[13px] font-bold mb-2" style={{ color: C.yellow }}>🧰 Start Cheap Kit — how to not overspend getting started</p>
      <ul className="list-disc pl-5">
        {items.map((k, i) => <li key={i} className="text-[13px] leading-relaxed mb-1" style={{ color: C.gray }}>{k}</li>)}
      </ul>
    </div>
  );
}

/* ---------- MAIN COMPONENT ---------- */
export default function Assessment() {
  const [A, setA] = useState({});
  const [step, setStep] = useState(-1); // -1 = intro
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [otherTxt, setOtherTxt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const named = A.q1 === "yes" || A.q1 === "sortof";
  const steps = QUESTIONS.filter((q) => !q.condKey || (q.condKey === "named" && named));
  const q = step >= 0 ? steps[Math.min(step, steps.length - 1)] : null;
  const answerable = steps.filter((s) => !s.type).length;
  const answeredIdx = step >= 0 ? steps.slice(0, step).filter((s) => !s.type).length : 0;
  const progress = q && q.type === "results" ? 100 : Math.round((answeredIdx / answerable) * 100);

  function pick(key, v, multi) {
    setA((prev) => {
      const nx = { ...prev };
      if (multi) {
        let cur = nx[key] || [];
        if (v === "none") cur = cur.includes("none") ? [] : ["none"];
        else { cur = cur.filter((x) => x !== "none"); cur = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]; }
        nx[key] = cur;
      } else {
        nx[key] = v;
        if (key === "q1" && v === "no") { delete nx.q1b; delete nx.q2; delete nx.q3; }
      }
      return nx;
    });
  }
  const next = () => { setStep((s) => s + 1); if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" }); };
  const back = () => setStep((s) => Math.max(-1, s - 1));
  const restart = () => { setA({}); setStep(-1); setEmail(""); setOtherTxt(""); };

  async function submitGate() {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!ok) { setEmailErr("Please enter a valid email so we can send your plan."); return; }
    setEmailErr("");
    setSubmitting(true);
    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, answers: A, otherIdea: otherTxt || undefined, ts: new Date().toISOString() }),
      });
    } catch (e) { /* never block results on network issues */ }
    setSubmitting(false);
    next();
  }

  /* ---------- RENDER HELPERS ---------- */
  const canContinue = q && !q.type && (q.multi ? (A[q.key] || []).length > 0 : A[q.key] !== undefined);

  function Insight1() {
    let chipBg = C.greenSoft, chipColor = C.green, chip, head, body;
    if (named) {
      const label = A.q1b === "other" ? (otherTxt || "your idea") : (A.q1b ? pathById(A.q1b).name.toLowerCase() : "your idea");
      if (A.q2 === "done" || A.q3 === "pro") { chip = "Pro start"; head = "You're not starting from zero."; body = `You've got real experience behind ${label}. Your plan will skip the beginner steps and go straight to getting paid.`; }
      else if (A.q2 === "love" || A.q3 === "hobby") { chip = "Warm start"; head = "You've got a real foundation."; body = `You know ${label} well enough to move fast — the gap is turning it from something you do into something you charge for.`; }
      else { chip = "Cold start"; chipBg = C.yellowSoft; chipColor = C.yellow; head = "You're starting from zero on this one."; body = `That's allowed — everyone starts somewhere. But the plan has to respect it: ${label} will take real ramp-up time, and we'll pair it with something that pays sooner.`; }
    } else {
      if (A.q4 === "lt5" || A.q4 === "5to10") { chip = "Sprinter profile"; head = "We're optimizing for speed."; body = "With your hours, the plan prioritizes paths that pay in days, not months."; }
      else if (A.q4 === "20plus") { chip = "Builder profile"; head = "You can afford to build."; body = "20+ hours a week means paths with a real ceiling are on the table, not just quick cash."; }
      else { chip = "Hybrid profile"; head = "A quick win and a long game."; body = "Your time supports both — which is exactly the two-path plan Faimgo builds."; }
    }
    return (
      <div className="p-8 rounded-2xl" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${C.beige}` }}>
        <span className="inline-block text-[13px] font-bold px-3.5 py-1 rounded-full mb-3" style={{ backgroundColor: chipBg, color: chipColor }}>{chip}</span>
        <h2 className="text-2xl font-bold mb-2" style={{ color: C.green }}>{head}</h2>
        <p className="text-[15px] leading-relaxed" style={{ color: C.ink }}>{body}</p>
        <p className="mt-3 text-sm" style={{ color: C.gray }}>{pathsInPlay(A)} of 9 paths still in play.</p>
        <NavRow onBack={back} onNext={next} nextLabel="Continue" />
      </div>
    );
  }

  function Insight2() {
    const assets = A.q6 || [];
    const bits = [];
    if (assets.includes("car")) bits.push("a car");
    if (assets.includes("tools")) bits.push("tools");
    if (assets.includes("computer")) bits.push("a computer");
    if (assets.includes("space")) bits.push("spare space");
    const money = { 0: "$0", 100: "under $100", 500: "up to $500", "500plus": "$500+" }[A.q5];
    const body = bits.length
      ? `You're working with ${bits.join(", ")} and ${money} to start. That's a real launch kit — several paths could take their first paying job within days.`
      : `Starting lean — no gear, ${money} in. Good news: several of the nine paths need nothing but time and follow-through, and your plan will include the cheapest possible way to get anything else.`;
    const rf = realityFlag(A);
    return (
      <div className="p-8 rounded-2xl" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${C.beige}` }}>
        <span className="inline-block text-[13px] font-bold px-3.5 py-1 rounded-full mb-3" style={{ backgroundColor: C.greenSoft, color: C.green }}>Your launch window</span>
        <h2 className="text-2xl font-bold mb-2" style={{ color: C.green }}>Here&apos;s what you&apos;re working with.</h2>
        <p className="text-[15px] leading-relaxed" style={{ color: C.ink }}>{body}</p>
        {rf === "red" && (
          <div className="mt-4 p-4 rounded-r-xl text-sm leading-relaxed" style={{ backgroundColor: C.redSoft, borderLeft: `4px solid ${C.red}`, color: C.ink }}>
            <b>A heads-up before your results:</b> the path you named is one of the slowest to first dollar, you&apos;re new to it, and you want money this week. Those three don&apos;t fit together — your results will show the honest ramp, plus what actually can pay you this week.
          </div>
        )}
        {rf === "yellow" && (
          <div className="mt-4 p-4 rounded-r-xl text-sm leading-relaxed" style={{ backgroundColor: C.yellowSoft, borderLeft: `4px solid ${C.gold}`, color: C.ink }}>
            <b>One honest note:</b> the path you named has a longer ramp than your timeline wants. Your results will show the real numbers — and a faster path to run alongside it.
          </div>
        )}
        <p className="mt-3 text-sm" style={{ color: C.gray }}>Down to {pathsInPlay(A)} paths.</p>
        <NavRow onBack={back} onNext={next} nextLabel="Continue" />
      </div>
    );
  }

  function ResultCard({ badge, badgeStyle, icon, title, meta, children }) {
    return (
      <div className="p-7 rounded-2xl mb-4" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${C.beige}` }}>
        <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full mb-2.5" style={badgeStyle}>{badge}</span>
        <h3 className="text-xl font-bold" style={{ color: C.green }}>{icon} {title}</h3>
        <p className="text-[13px] mt-0.5 mb-3" style={{ color: C.gray }}>{meta}</p>
        {children}
      </div>
    );
  }

  function Results() {
    const rf = realityFlag(A);
    const cards = [];
    const toneMap = { steam: "Your plan is built as a day-by-day walkthrough — the thing that kills momentum is deciding what's next, so we decide it for you.", scared: "Every step starts with the $0 version. You don't spend until something has already worked.", start: "Step one is deliberately tiny. You'll know exactly where to start because it's the only thing on the list.", time: "The plan fits your real hours — short, fixed sessions, nothing that needs a free weekend.", first: "First real attempt — good. No bad habits to unlearn. The plan assumes nothing and explains everything." };
    const tone = toneMap[A.q12] || "";

    if (named && A.q1b && A.q1b !== "other") {
      const p = pathById(A.q1b);
      const vmap = { green: [{ backgroundColor: C.greenSoft, color: "#0F6B3F" }, "You can start this now"], yellow: [{ backgroundColor: C.yellowSoft, color: C.yellow }, "You can get there — here's the real ramp"], red: [{ backgroundColor: C.redSoft, color: C.red }, "Here's the truth about this path for you today"] };
      cards.push(
        <ResultCard key="chosen" badge={vmap[rf][1]} badgeStyle={vmap[rf][0]} icon="🎯" title={`Your Chosen Path: ${p.name}`} meta={`First dollar: typically ${p.dollar} · Ceiling ${"★".repeat(p.ceiling)}`}>
          {rf === "red" && (
            <div className="mb-3 p-4 rounded-r-xl text-sm leading-relaxed" style={{ backgroundColor: C.redSoft, borderLeft: `4px solid ${C.red}`, color: C.ink }}>
              You want your first dollar <b>this week</b>, from a path that typically takes <b>{p.dollar}</b>, starting with little experience. Possible? Technically. Realistic? No. The honest timeline for you on {p.name.toLowerCase()} is measured in months, not days. If you still want it after reading that — and some people should — here&apos;s step one below, and a second path that pays while you build.
            </div>
          )}
          {rf === "yellow" && (
            <div className="mb-3 p-4 rounded-r-xl text-sm leading-relaxed" style={{ backgroundColor: C.yellowSoft, borderLeft: `4px solid ${C.gold}`, color: C.ink }}>
              The real ramp for {p.name.toLowerCase()} at your experience level: <b>{p.dollar} at best, usually longer</b>. It&apos;s a good path — it just won&apos;t match the timeline you picked. The second card below is what covers the gap.
            </div>
          )}
          <p className="text-sm leading-relaxed" style={{ color: C.ink }}>
            {whyFits(A, p)} {A.q2 === "money" ? 'One honest note: "it looks like good money" is a reason to test it — not yet a reason to bet on it. The first 3 moves below are the cheapest possible test.' : ""}
          </p>
          <Moves moves={p.moves} />
          {needsKit(A, p) && p.kit.length > 0 && <Kit items={p.kit} />}
        </ResultCard>
      );
      const fw = fastestWin(A, p.id);
      if (fw && rf !== "green") {
        cards.push(
          <ResultCard key="fw" badge="Pays while you build" badgeStyle={{ backgroundColor: C.greenSoft, color: "#0F6B3F" }} icon="⚡" title={`Your Fastest First Win: ${fw.name}`} meta={`First dollar: typically ${fw.dollar}`}>
            <p className="text-sm leading-relaxed" style={{ color: C.ink }}>{whyFits(A, fw)}</p>
            <Moves moves={fw.moves} />
          </ResultCard>,
          <div key="bridge" className="p-5 rounded-2xl mb-4 text-[15px] leading-relaxed font-medium" style={{ backgroundColor: C.green, color: C.cream }}>
            How they work together: {fw.name} money funds your first months of {p.name.toLowerCase()} — you&apos;re earning by day 30 while the real goal ramps toward day 90.
          </div>
        );
      } else if (fw && rf === "green") {
        cards.push(
          <div key="bridge" className="p-5 rounded-2xl mb-4 text-[15px] leading-relaxed font-medium" style={{ backgroundColor: C.green, color: C.cream }}>
            You don&apos;t need a bridge income — your chosen path IS a fast path for you. If you want a backup anyway: {fw.name.toLowerCase()} scored next highest.
          </div>
        );
      }
    } else if (named && A.q1b === "other") {
      const idea = otherTxt || "your idea";
      const fw = fastestWin(A);
      const lt = longTerm(A, fw ? fw.id : undefined);
      cards.push(
        <ResultCard key="other" badge="Outside the current library" badgeStyle={{ backgroundColor: C.yellowSoft, color: C.yellow }} icon="🎯" title={`Your idea: "${idea}"`} meta="Custom path">
          <p className="text-sm leading-relaxed" style={{ color: C.ink }}>
            Honest answer: &quot;{idea}&quot; isn&apos;t one of the nine paths we score yet — so instead of pretending, here&apos;s the universal validation play: (1) find 3 people already doing it and study how they actually get paid, (2) define the smallest version you could sell in 30 days, (3) pitch it to 5 real people before building anything. Meanwhile, the two cards below are your highest-scoring proven paths.
          </p>
        </ResultCard>
      );
      if (fw) cards.push(<FwCard key="fw" fw={fw} />);
      if (lt) cards.push(<LtCard key="lt" lt={lt} />);
    } else {
      const fw = fastestWin(A);
      const lt = longTerm(A, fw ? fw.id : undefined);
      if (fw) cards.push(<FwCard key="fw" fw={fw} />);
      if (lt) cards.push(<LtCard key="lt" lt={lt} />);
      if (fw && lt) cards.push(
        <div key="bridge" className="p-5 rounded-2xl mb-4 text-[15px] leading-relaxed font-medium" style={{ backgroundColor: C.green, color: C.cream }}>
          How they work together: {fw.name} pays your first 60 days while {lt.name.toLowerCase()} compounds toward the real ceiling.
        </div>
      );
    }
    return (
      <div>
        {cards}
        <div className="p-7 rounded-2xl text-center" style={{ backgroundColor: "#FFFFFF", border: `2px solid ${C.green}` }}>
          <h3 className="text-xl font-bold" style={{ color: C.green }}>This is the map. The walkthrough is the product.</h3>
          <p className="text-sm leading-relaxed my-3" style={{ color: C.ink }}>{tone} Faimgo walks you from these first moves to your first dollar — step by step, honestly.</p>
          <a href="/#start" className="inline-block px-8 py-3 rounded-full font-semibold text-base transition-all hover:opacity-90" style={{ backgroundColor: C.green, color: C.cream }}>
            Start my 30/60/90 →
          </a>
        </div>
        <div className="text-center mt-6">
          <button onClick={restart} className="text-sm underline" style={{ color: C.gray }}>↺ Retake the assessment</button>
        </div>
      </div>
    );
  }
  function FwCard({ fw }) {
    return (
      <ResultCard badge="Fastest first win" badgeStyle={{ backgroundColor: C.greenSoft, color: "#0F6B3F" }} icon="⚡" title={fw.name} meta={`First dollar: typically ${fw.dollar}`}>
        <p className="text-sm leading-relaxed" style={{ color: C.ink }}>{whyFits(A, fw)}</p>
        <Moves moves={fw.moves} />
        {needsKit(A, fw) && fw.kit.length > 0 && <Kit items={fw.kit} />}
      </ResultCard>
    );
  }
  function LtCard({ lt }) {
    return (
      <ResultCard badge="Long-term path" badgeStyle={{ backgroundColor: C.yellowSoft, color: C.yellow }} icon="🏔" title={lt.name} meta={`First dollar: typically ${lt.dollar} · Ceiling ${"★".repeat(lt.ceiling)}`}>
        <p className="text-sm leading-relaxed" style={{ color: C.ink }}>{whyFits(A, lt)}</p>
        <Moves moves={lt.moves} />
      </ResultCard>
    );
  }
  function NavRow({ onBack, onNext, nextLabel, nextDisabled }) {
    return (
      <div className="flex justify-between items-center mt-6">
        <button onClick={onBack} className="px-4 py-2.5 text-sm font-medium" style={{ color: C.gray }}>Back</button>
        <button onClick={onNext} disabled={nextDisabled}
          className="px-8 py-3 rounded-full font-semibold text-base transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ backgroundColor: C.green, color: C.cream }}>{nextLabel}</button>
      </div>
    );
  }

  /* ---------- PAGE ---------- */
  return (
    <main className="min-h-screen font-sans" style={{ backgroundColor: C.cream, color: C.ink }}>
      <nav style={{ backgroundColor: C.green }} className="px-8 py-4 flex items-center justify-between">
        <a href="/" className="text-2xl font-bold tracking-tight" style={{ color: C.cream }}>
          faim<span style={{ color: C.gold }}>go</span>
        </a>
        <a href="/" className="text-sm font-medium" style={{ color: C.cream }}>← Back to home</a>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {step >= 0 && (
          <>
            <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ backgroundColor: C.beige }}>
              <div className="h-full transition-all duration-300" style={{ backgroundColor: C.gold, width: `${progress}%` }} />
            </div>
            <div className="flex justify-between text-xs mb-6" style={{ color: C.gray }}>
              <span>{q?.section || (q?.type === "results" ? "Your plan" : q?.type === "gate" ? "Almost there" : "Insight")}</span>
              <span>{q && !q.type && step > 0 ? `${pathsInPlay(A)} of 9 paths in play` : ""}</span>
            </div>
          </>
        )}

        {step === -1 && (
          <div className="p-8 rounded-2xl" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${C.beige}` }}>
            <Tag>Faimgo Assessment</Tag>
            <h1 className="text-4xl font-bold leading-tight mb-3" style={{ color: C.green }}>
              Find your <span style={{ color: C.gold }}>two paths</span>.
            </h1>
            <p className="text-[15px] leading-relaxed mb-6" style={{ color: C.gray }}>
              Answer honestly — about 3 minutes. You&apos;ll get your <b style={{ color: C.ink }}>fastest first win</b> and, if you already have a dream in mind, an <b style={{ color: C.ink }}>honest reality check</b> on it. No fluff, no &quot;just believe in yourself.&quot;
            </p>
            <button onClick={() => setStep(0)} className="px-8 py-3 rounded-full font-semibold text-base transition-all hover:opacity-90" style={{ backgroundColor: C.green, color: C.cream }}>
              Start
            </button>
          </div>
        )}

        {q && !q.type && (
          <div className="p-8 rounded-2xl" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${C.beige}` }}>
            <Tag>{q.section}</Tag>
            <h2 className="text-2xl font-bold mb-1 leading-snug" style={{ color: C.green }}>{q.title}</h2>
            {q.multi && <p className="text-sm mb-2" style={{ color: C.gray }}>Select all that apply.</p>}
            <div className="flex flex-col gap-2.5 mt-5">
              {q.opts.map((o) => (
                <Opt key={o.v} label={o.t} sub={o.s}
                  selected={q.multi ? (A[q.key] || []).includes(o.v) : A[q.key] === o.v}
                  onClick={() => pick(q.key, o.v, q.multi)} />
              ))}
            </div>
            {q.other && A[q.key] === "other" && (
              <input type="text" value={otherTxt} onChange={(e) => setOtherTxt(e.target.value)} placeholder="What is it? (a few words)"
                className="w-full mt-3 px-4 py-3 rounded-xl border-2 text-[15px]" style={{ borderColor: C.beige, backgroundColor: "#FFFFFF" }} />
            )}
            <NavRow onBack={back} onNext={next} nextLabel="Continue" nextDisabled={!canContinue} />
          </div>
        )}

        {q?.type === "insight1" && <Insight1 />}
        {q?.type === "insight2" && <Insight2 />}

        {q?.type === "gate" && (
          <div className="p-8 rounded-2xl" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${C.beige}` }}>
            <Tag>One last thing</Tag>
            <h2 className="text-2xl font-bold mb-2" style={{ color: C.green }}>Your two paths are ready.</h2>
            <p className="text-[15px] mb-4" style={{ color: C.gray }}>Where should we send your plan so you don&apos;t lose it?</p>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com"
              className="w-full px-4 py-3.5 rounded-xl border-2 text-[15px]" style={{ borderColor: emailErr ? C.red : C.beige, backgroundColor: "#FFFFFF" }} />
            {emailErr && <p className="text-[13px] mt-2" style={{ color: C.red }}>{emailErr}</p>}
            <p className="text-xs mt-3 leading-relaxed" style={{ color: C.gray }}>No spam — you can unsubscribe anytime. Your answers stay private.</p>
            <div className="flex justify-between items-center mt-6">
              <button onClick={back} className="px-4 py-2.5 text-sm font-medium" style={{ color: C.gray }}>Back</button>
              <button onClick={submitGate} disabled={submitting}
                className="px-8 py-3 rounded-full font-semibold text-base transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: C.gold, color: C.green }}>
                {submitting ? "One moment…" : "Show me my plan"}
              </button>
            </div>
          </div>
        )}

        {q?.type === "results" && <Results />}
      </div>
    </main>
  );
}
