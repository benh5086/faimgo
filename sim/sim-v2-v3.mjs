/*
  Faimgo scoring simulation: v2 (deployed) vs v3 (shortened).
  Proves — with numbers, not opinions — what the question cuts changed.
  Run: bun sim/sim-v2-v3.mjs
*/

const PATHS = [
  { id: "freelance", speed: 4, ceiling: 4 },
  { id: "resell", speed: 5, ceiling: 3 },
  { id: "local", speed: 5, ceiling: 3 },
  { id: "gig", speed: 5, ceiling: 2 },
  { id: "tutor", speed: 4, ceiling: 4 },
  { id: "va", speed: 3, ceiling: 3 },
  { id: "digital", speed: 2, ceiling: 4 },
  { id: "content", speed: 1, ceiling: 5 },
  { id: "care", speed: 4, ceiling: 3 },
];

/* ---------- v2 engine (exact port of deployed code) ---------- */
function v2Scores(A) {
  const scores = {}; const excluded = new Set();
  PATHS.forEach((p) => (scores[p.id] = 0));
  const add = (id, n) => { if (scores[id] !== undefined) scores[id] += n; };
  const assets = A.q6 || [];
  if (!assets.includes("car")) excluded.add("gig"); else { add("gig", 2); add("local", 2); }
  if (!assets.includes("computer")) ["freelance","va","digital","content"].forEach(i=>add(i,-2));
  else ["freelance","va","digital","content"].forEach(i=>add(i,1));
  if (assets.includes("tools")) add("local", 2);
  if (!assets.includes("space")) add("resell", -1); else add("resell", 2);
  const hb = { lt5:["gig","resell","care"], "5to10":["resell","care","local","tutor"], "10to20":["freelance","local","tutor","va"], "20plus":["freelance","digital","content"] }[A.q4] || [];
  hb.forEach(i=>add(i,2));
  if (A.q5 === "0") { add("resell",-1); ["va","tutor","care","freelance"].forEach(i=>add(i,1)); }
  if (A.q5 === "500plus") ["digital","content","freelance","local"].forEach(i=>add(i,1));
  if (A.q7 === "week") PATHS.filter(p=>p.speed===5).forEach(p=>add(p.id,2));
  if (A.q7 === "norush") PATHS.filter(p=>p.ceiling>=4).forEach(p=>add(p.id,1));
  if (A.q8 === "safe" || A.q8 === "mostlysafe") PATHS.filter(p=>p.speed>=4).forEach(p=>add(p.id,1));
  if (A.q8 === "bet") PATHS.filter(p=>p.ceiling>=4).forEach(p=>add(p.id,2));
  const eb = { people:["local","care","tutor"], online:["va","tutor","freelance"], alone:["freelance","digital","resell"], solo:["digital","freelance","content"] }[A.q9] || [];
  eb.forEach(i=>add(i,2));
  if (A.q10 === "camera") add("content", 3);
  if (A.q10 === "offline") { excluded.add("content"); ["freelance","va","digital"].forEach(i=>add(i,-1)); ["local","care","resell"].forEach(i=>add(i,1)); }
  if (A.q10 === "behind") add("content", -2);
  const sb = { make:["digital","freelance","content"], sell:["resell","freelance","local"], help:["care","tutor","local"], systems:["va","freelance"] }[A.q11] || [];
  sb.forEach(i=>add(i,2));
  if (A.q1b && A.q1b !== "other") {
    add(A.q1b, 4);
    add(A.q1b, { done:3, love:2, seen:1, money:0 }[A.q2] || 0);
  }
  return { scores, excluded };
}

/* ---------- v3 engine (exact port of new code) ---------- */
function v3Scores(A) {
  const scores = {}; const excluded = new Set();
  PATHS.forEach((p) => (scores[p.id] = 0));
  const add = (id, n) => { if (scores[id] !== undefined) scores[id] += n; };
  const inv = A.qinv || [];
  const cash = inv.includes("cash");
  if (!inv.includes("car")) excluded.add("gig"); else { add("gig", 2); add("local", 2); }
  if (!inv.includes("computer")) ["freelance","va","digital","content"].forEach(i=>add(i,-2));
  else ["freelance","va","digital","content"].forEach(i=>add(i,1));
  if (inv.includes("tools")) add("local", 2);
  if (!inv.includes("space")) add("resell", -1); else add("resell", 2);
  if (cash) { add("resell", 1); add("local", 1); }
  else { add("resell", -1); ["va","tutor","care","freelance"].forEach(i=>add(i,1)); }
  const hb = { lt5:["gig","resell","care"], "5to10":["resell","care","local","tutor"], "10to20":["freelance","local","tutor","va"], "20plus":["freelance","digital","content"] }[A.qhours] || [];
  hb.forEach(i=>add(i,2));
  if (A.qtime === "week") PATHS.filter(p=>p.speed===5).forEach(p=>add(p.id,2));
  if (A.qtime === "week" || A.qtime === "month") PATHS.filter(p=>p.speed>=4).forEach(p=>add(p.id,1));
  if (A.qtime === "norush") PATHS.filter(p=>p.ceiling>=4).forEach(p=>add(p.id,3));
  if (A.qwork === "face") ["local","care","tutor"].forEach(i=>add(i,2));
  if (A.qwork === "onlineBehind") { ["va","freelance"].forEach(i=>add(i,2)); add("digital",1); add("content",-2); }
  if (A.qwork === "onlineVisible") { add("content",3); ["tutor","freelance","va"].forEach(i=>add(i,1)); }
  if (A.qwork === "offlineSolo") { excluded.add("content"); add("resell",2); add("local",1); add("care",1); ["freelance","va","digital"].forEach(i=>add(i,-1)); }
  const sb = { make:["digital","freelance","content"], sell:["resell","freelance","local"], help:["care","tutor","local"], systems:["va","freelance"] }[A.qstyle] || [];
  sb.forEach(i=>add(i,2));
  if (A.q1b && A.q1b !== "other") {
    add(A.q1b, 4);
    add(A.q1b, { pro:3, hobby:2, new:1, moneyresearch:0 }[A.qrel] || 0);
  }
  return { scores, excluded };
}

/* ---------- shared output logic ---------- */
function outputs(engine, A) {
  const { scores, excluded } = engine(A);
  const fwCands = PATHS.filter(p=>p.speed>=4 && !excluded.has(p.id) && p.id !== (A.q1b && A.q1b !== "other" ? A.q1b : null));
  fwCands.sort((a,b)=>scores[b.id]-scores[a.id] || a.id.localeCompare(b.id));
  const fw = fwCands[0]?.id ?? null;
  const ltCands = PATHS.filter(p=>!excluded.has(p.id) && p.id !== fw);
  ltCands.sort((a,b)=>scores[b.id]*b.ceiling - scores[a.id]*a.ceiling || a.id.localeCompare(b.id));
  const lt = ltCands[0]?.id ?? null;
  return { fw, lt };
}
function v2Flag(A) {
  if (!A.q1b || A.q1b === "other") return null;
  const p = PATHS.find(x=>x.id===A.q1b);
  const noExp = A.q3 === "research" || A.q3 === "none";
  const fast = A.q7 === "week";
  const slow = p.speed <= 2;
  if (slow && noExp && fast) return "red";
  if ((slow && noExp) || (slow && fast) || (noExp && fast && A.q2 === "money")) return "yellow";
  return "green";
}
function v3Flag(A) {
  if (!A.q1b || A.q1b === "other") return null;
  const p = PATHS.find(x=>x.id===A.q1b);
  const noExp = A.qrel === "moneyresearch" || A.qrel === "new";
  const fast = A.qtime === "week";
  const slow = p.speed <= 2;
  if (slow && noExp && fast) return "red";
  if ((slow && noExp) || (slow && fast) || (noExp && fast && A.qrel === "moneyresearch")) return "yellow";
  return "green";
}

/* ---------- mappings: v3 answers → v2 answers ---------- */
const REL_MAP = { pro:["done","pro"], hobby:["love","hobby"], moneyresearch:["money","research"], new:["seen","none"] };
const WORK_MAP = { face:["people","behind"], onlineBehind:["online","behind"], onlineVisible:["online","camera"], offlineSolo:["solo","offline"] };
function v3toV2(A3, risk) {
  const [q2, q3] = A3.qrel ? REL_MAP[A3.qrel] : [undefined, undefined];
  const [q9, q10] = WORK_MAP[A3.qwork];
  const assets = (A3.qinv || []).filter(x=>x!=="cash" && x!=="none");
  return {
    q1: A3.q1, q1b: A3.q1b, q2, q3,
    q4: A3.qhours,
    q5: A3.qinv.includes("cash") ? "500" : "0",
    q6: assets,
    q7: A3.qtime, q8: risk, q9, q10, q11: A3.qstyle,
  };
}

/* ---------- enumeration ---------- */
const HOURS = ["lt5","5to10","10to20","20plus"];
const TIME = ["week","month","quarter","norush"];
const WORK = ["face","onlineBehind","onlineVisible","offlineSolo"];
const STYLE = ["make","sell","help","systems"];
const REL = ["pro","hobby","moneyresearch","new"];
const RISK = ["safe","mostlysafe","balanced","bet"];
const ASSET_BASE = ["car","computer","tools","space","cash"];
const INVENTORIES = [];
for (let m = 0; m < 32; m++) {
  const set = ASSET_BASE.filter((_, i) => m & (1 << i));
  INVENTORIES.push(set.length ? set : ["none"]);
}

let total = 0;
let identicalAtNeutralRisk = 0;
let fwSame = 0, ltSame = 0;
let riskCouldFlip = 0, riskFlipsFw = 0;
let flagMismatch = 0;
const gapCounts = {};
let invariantFails = 0;
const diffExamples = [];
const riskExamples = [];

function runCombo(A3) {
  total++;
  const o3 = outputs(v3Scores, A3);
  // invariants
  if (!o3.fw) invariantFails++;
  if (A3.qwork === "offlineSolo" && (o3.fw === "content" || o3.lt === "content")) invariantFails++;
  if (!(A3.qinv||[]).includes("car") && (o3.fw === "gig" || o3.lt === "gig")) invariantFails++;
  // v2 comparison with risk inferred from timeline (urgent = safe, patient = bet)
  const inferredRisk = { week: "safe", month: "mostlysafe", quarter: "balanced", norush: "bet" }[A3.qtime];
  const A2n = v3toV2(A3, inferredRisk);
  const o2n = outputs(v2Scores, A2n);
  const same = o2n.fw === o3.fw && o2n.lt === o3.lt;
  if (o2n.fw === o3.fw) fwSame++;
  else { const sc = v2Scores(A2n).scores; const gap = Math.abs((sc[o2n.fw]??0) - (sc[o3.fw]??0)); gapCounts[gap > 4 ? "5plus" : gap] = (gapCounts[gap > 4 ? "5plus" : gap] || 0) + 1; }
  if (o2n.lt === o3.lt) ltSame++;
  if (same) identicalAtNeutralRisk++;
  else if (diffExamples.length < 5) diffExamples.push({ A3: JSON.stringify(A3), v2: o2n, v3: o3 });
  // does the removed risk question ever change v2's output at these fixed answers?
  const riskOuts = RISK.map(r => outputs(v2Scores, v3toV2(A3, r)));
  const outs = new Set(riskOuts.map(o => o.fw + "|" + o.lt));
  const fwOuts = new Set(riskOuts.map(o => o.fw));
  if (outs.size > 1) { riskCouldFlip++; if (fwOuts.size > 1) riskFlipsFw++; if (riskExamples.length < 3) riskExamples.push({ A3: JSON.stringify(A3), variants: [...outs] }); }
  // reality flag equivalence (named only)
  if (A3.q1b && A3.q1b !== "other") {
    if (v3Flag(A3) !== v2Flag(A2n)) flagMismatch++;
  }
}

// match-me combos
for (const h of HOURS) for (const inv of INVENTORIES) for (const t of TIME) for (const w of WORK) for (const s of STYLE)
  runCombo({ q1: "no", qhours: h, qinv: inv, qtime: t, qwork: w, qstyle: s });

// named-path combos
for (const p of PATHS) for (const r of REL) for (const h of HOURS) for (const inv of INVENTORIES) for (const t of TIME) for (const w of WORK) for (const s of STYLE)
  runCombo({ q1: "yes", q1b: p.id, qrel: r, qhours: h, qinv: inv, qtime: t, qwork: w, qstyle: s });

const pct = (n) => (100 * n / total).toFixed(2) + "%";
console.log("=== FAIMGO v2 vs v3 SCORING SIMULATION ===");
console.log("Total answer combinations tested:", total.toLocaleString());
console.log("");
console.log("Invariant failures (no fastest win / excluded path shown):", invariantFails);
console.log("Reality-flag mismatches (v3 verdict differs from v2):", flagMismatch);
console.log("");
console.log("Output identical to v2 (at neutral risk answer):", identicalAtNeutralRisk.toLocaleString(), "=", pct(identicalAtNeutralRisk));
console.log("  Fastest-win card identical:", fwSame.toLocaleString(), "=", pct(fwSame));
console.log("  Long-term card identical:  ", ltSame.toLocaleString(), "=", pct(ltSame));
console.log("Combos where the REMOVED risk question could have changed v2's output:", riskCouldFlip.toLocaleString(), "=", pct(riskCouldFlip));
console.log("  ...where it could flip the FASTEST WIN:", riskFlipsFw.toLocaleString(), "=", pct(riskFlipsFw));
console.log("");
console.log("When v3's fastest win differs from v2's, the v2 score gap between the two candidates was:", JSON.stringify(gapCounts));
console.log("");
if (diffExamples.length) { console.log("Sample differences vs v2:"); diffExamples.forEach(d=>console.log(" ", d.A3, "v2:", JSON.stringify(d.v2), "v3:", JSON.stringify(d.v3))); }
if (riskExamples.length) { console.log("Sample risk-sensitive combos:"); riskExamples.forEach(d=>console.log(" ", d.A3, "variants:", d.variants.join("  "))); }
