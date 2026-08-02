/* ============================================================
   FAIMGO — THE PLAN EMAIL

   The gate says "Where should we send your plan so you don't
   lose it?" This file is what makes that sentence true.

   The email carries the whole plan in the body — not a teaser
   and not a link to a page that needs a login. If they never
   click anything again, they still have the thing we promised.

   Renders from the SAME path library the screen uses, so the
   email can never say something different from what they saw.
   ============================================================ */

import { PATHS, CEILING_LABEL, pathById } from "./paths.js";

const C = {
  cream: "#F1F4F2", green: "#1B3A2D", gold: "#8A6A14", beige: "#E4E8E5",
  gray: "#464C54", ink: "#15181B", greenSoft: "#E4EEE9",
  yellowSoft: "#FBF3DE", redSoft: "#F9E9E5", red: "#9C3B2E",
};

const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/* ---------- small html pieces ---------- */

function moves(list) {
  const rows = list.map((m, i) => `
    <tr>
      <td style="padding:0 10px 10px 0;vertical-align:top;">
        <div style="width:24px;height:24px;border-radius:12px;background:${C.green};color:#fff;
             font:700 13px/24px Helvetica,Arial,sans-serif;text-align:center;">${i + 1}</div>
      </td>
      <td style="padding:0 0 10px 0;font:15px/1.5 Helvetica,Arial,sans-serif;color:${C.ink};">${esc(m)}</td>
    </tr>`).join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:14px 0 0;">${rows}</table>`;
}

function kit(items) {
  if (!items || !items.length) return "";
  const li = items.map((k) => `<li style="margin:0 0 6px;">${esc(k)}</li>`).join("");
  return `<div style="margin:14px 0 0;padding:12px 16px;background:${C.cream};border-radius:10px;">
    <div style="font:700 11px/1.4 Helvetica,Arial,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:${C.gold};margin:0 0 8px;">Do it without spending</div>
    <ul style="margin:0;padding:0 0 0 18px;font:14px/1.5 Helvetica,Arial,sans-serif;color:${C.gray};">${li}</ul>
  </div>`;
}

function card({ badge, badgeBg, badgeColor, title, meta, body, note, noteBg, noteBorder }) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#ffffff;border:1px solid ${C.beige};border-radius:16px;margin:0 0 16px;">
    <tr><td style="padding:22px 24px;">
      ${badge ? `<div style="display:inline-block;padding:5px 11px;border-radius:8px;background:${badgeBg};color:${badgeColor};
           font:700 12px/1.3 Helvetica,Arial,sans-serif;margin:0 0 10px;">${esc(badge)}</div>` : ""}
      <div style="font:700 20px/1.25 Helvetica,Arial,sans-serif;color:${C.ink};margin:0 0 4px;">${esc(title)}</div>
      ${meta ? `<div style="font:13px/1.4 Helvetica,Arial,sans-serif;color:${C.gray};margin:0 0 12px;">${esc(meta)}</div>` : ""}
      ${note ? `<div style="margin:0 0 12px;padding:14px 16px;background:${noteBg};border-left:4px solid ${noteBorder};
           border-radius:0 10px 10px 0;font:15px/1.55 Helvetica,Arial,sans-serif;color:${C.ink};">${note}</div>` : ""}
      ${body || ""}
    </td></tr>
  </table>`;
}

function bridge(text) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:${C.green};border-radius:16px;margin:0 0 16px;">
    <tr><td style="padding:20px 24px;font:600 16px/1.55 Helvetica,Arial,sans-serif;color:${C.cream};">${esc(text)}</td></tr>
  </table>`;
}

/* ---------- why it fits (server copy of the screen's logic) ---------- */

function whyFits(A, p) {
  const bits = [];
  const inv = A.qinv || [];
  if (A.q1b === p.id) bits.push("you told us this is where you want to go");
  if (p.id === "local" && inv.includes("tools")) bits.push("you already own tools most people would have to buy");
  if ((p.id === "gig" || p.id === "local") && inv.includes("car")) bits.push("you have the car it runs on");
  if (["freelance", "va", "digital", "content"].includes(p.id) && inv.includes("computer")) bits.push("your computer is the only equipment it needs");
  if (p.id === "resell" && inv.includes("cash")) bits.push("your starting cash covers the first inventory run");
  if (A.qwork === "face" && ["local", "care", "tutor"].includes(p.id)) bits.push("it puts you face to face with people, which is how you like to work");
  if (A.qwork === "offlineSolo" && ["resell", "local"].includes(p.id)) bits.push("you can run it offline and mostly solo");
  if (A.qwork === "onlineBehind" && ["freelance", "va", "digital"].includes(p.id)) bits.push("it runs online without putting you on camera");
  if (A.qstyle === "help" && ["care", "tutor"].includes(p.id)) bits.push("it's built on taking care of people — your natural mode");
  if (A.qstyle === "make" && ["digital", "content", "freelance"].includes(p.id)) bits.push("it rewards making things");
  if (A.qstyle === "sell" && ["resell", "local"].includes(p.id)) bits.push("it rewards your seller instincts");
  if (A.qtime === "week" && p.speed >= 5) bits.push("it can genuinely pay within days");
  if (!bits.length) bits.push("it scored highest across your time, inventory, and working style");
  return "This fits because " + bits.slice(0, 3).join(", ") + ".";
}

function needsKit(A, p) {
  const inv = A.qinv || [];
  if (p.id === "local" && !inv.includes("tools")) return true;
  if (p.id === "resell" && (!inv.includes("cash") || !inv.includes("space"))) return true;
  if (["freelance", "digital", "content", "va"].includes(p.id) && !inv.includes("computer")) return true;
  if ((p.id === "tutor" || p.id === "care") && !inv.includes("cash")) return true;
  return false;
}

const TONE = {
  steam: "You told us you lose steam. So this is written as one move at a time — the deciding is the part that kills momentum, and we've done that part for you.",
  scared: "You told us spending money worries you. Every step below has a $0 version. Nothing costs anything until something has already worked.",
  start: "You told us the starting is the hard part. That's why move 1 is deliberately small — it's the only thing you have to look at today.",
  time: "You told us time is tight. Every move below fits a short, fixed session. None of it needs a free weekend.",
  first: "This is your first real attempt, which means nothing to unlearn. The plan assumes nothing and explains everything.",
};

/* ---------- the whole email ---------- */

export function renderPlanEmail({ answers, results, otherIdea, protectFrom, planUrl }) {
  const A = answers || {};
  const R = results || {};
  let blocks = "";
  let headline = "Your Faimgo plan";
  const textLines = [];

  const chosen = R.chosen ? pathById(R.chosen) : null;
  const fw = R.fastestWin ? pathById(R.fastestWin) : null;
  const lt = R.longTerm ? pathById(R.longTerm) : null;

  if (chosen) {
    headline = `Your plan: ${chosen.name}`;
    const v = R.verdict;
    const badge = v === "green" ? ["You can start this now", C.greenSoft, "#0F6B3F"]
      : v === "yellow" ? ["You can get there — here's the real ramp", C.yellowSoft, C.gold]
        : ["The honest read on this path", C.redSoft, C.red];
    let note = "";
    if (v === "red") {
      note = `You want your first dollar <b>this week</b>, from a path that typically takes <b>${esc(chosen.dollar)}</b>, starting with little experience. Possible? Technically. Realistic? No. The honest timeline here is measured in months, not days. Step one is still below — and so is a second path that pays while you build.`;
    } else if (v === "yellow") {
      note = `The real ramp at your experience level: <b>${esc(chosen.dollar)} at best, usually longer</b>. It's a good path — it just won't match the timeline you picked. The second plan below is what covers the gap.`;
    }
    blocks += card({
      badge: badge[0], badgeBg: badge[1], badgeColor: badge[2],
      title: `Your chosen path: ${chosen.name}`,
      meta: `First dollar: typically ${chosen.dollar} · Income ceiling: ${CEILING_LABEL[chosen.ceiling]}`,
      note, noteBg: v === "red" ? C.redSoft : C.yellowSoft, noteBorder: v === "red" ? C.red : C.gold,
      body: `<div style="font:15px/1.6 Helvetica,Arial,sans-serif;color:${C.ink};">${esc(whyFits(A, chosen))}</div>`
        + moves(chosen.moves) + (needsKit(A, chosen) ? kit(chosen.kit) : ""),
    });
    textLines.push(`YOUR CHOSEN PATH: ${chosen.name}`, `First dollar: typically ${chosen.dollar}`, "",
      ...chosen.moves.map((m, i) => `${i + 1}. ${m}`), "");

    if (fw && v !== "green") {
      blocks += card({
        badge: "Pays while you build", badgeBg: C.greenSoft, badgeColor: "#0F6B3F",
        title: `Your fastest first win: ${fw.name}`,
        meta: `First dollar: typically ${fw.dollar}`,
        body: `<div style="font:15px/1.6 Helvetica,Arial,sans-serif;color:${C.ink};">${esc(whyFits(A, fw))}</div>` + moves(fw.moves),
      });
      blocks += bridge(`How they work together: ${fw.name} money funds your first months of ${chosen.name.toLowerCase()} — you're earning by day 30 while the real goal ramps toward day 90.`);
      textLines.push(`YOUR FASTEST FIRST WIN: ${fw.name}`, `First dollar: typically ${fw.dollar}`, "",
        ...fw.moves.map((m, i) => `${i + 1}. ${m}`), "");
    } else if (fw) {
      blocks += bridge(`You don't need a bridge income — your chosen path is already a fast path for you. If you want a backup anyway, ${fw.name.toLowerCase()} scored next highest.`);
    }
  } else {
    headline = fw ? `Your plan: start with ${fw.name}` : "Your Faimgo plan";
    if (otherIdea) {
      blocks += card({
        badge: "Your own path — we're on it with you", badgeBg: C.greenSoft, badgeColor: "#0F6B3F",
        title: `Your idea: "${otherIdea}"`, meta: "Custom path",
        body: `<div style="font:15px/1.6 Helvetica,Arial,sans-serif;color:${C.ink};">Here's how we'd validate any idea worth your time: find 3 people already doing it and study how they actually get paid, define the smallest version you could sell in 30 days, then pitch it to 5 real people before building anything. Run those three and you'll know more than months of thinking could tell you. The paths below are what your answers scored highest — either can fund the idea while you test it.</div>`,
      });
      textLines.push(`YOUR IDEA: "${otherIdea}"`, "");
    }
    if (fw) {
      blocks += card({
        badge: "Start here — fastest to a first dollar", badgeBg: C.greenSoft, badgeColor: "#0F6B3F",
        title: `Your fastest first win: ${fw.name}`,
        meta: `First dollar: typically ${fw.dollar} · Income ceiling: ${CEILING_LABEL[fw.ceiling]}`,
        body: `<div style="font:15px/1.6 Helvetica,Arial,sans-serif;color:${C.ink};">${esc(whyFits(A, fw))}</div>`
          + moves(fw.moves) + (needsKit(A, fw) ? kit(fw.kit) : ""),
      });
      textLines.push(`YOUR FASTEST FIRST WIN: ${fw.name}`, `First dollar: typically ${fw.dollar}`, "",
        ...fw.moves.map((m, i) => `${i + 1}. ${m}`), "");
    }
    if (lt) {
      blocks += card({
        badge: "Where it can go", badgeBg: C.yellowSoft, badgeColor: C.gold,
        title: `Your long game: ${lt.name}`,
        meta: `First dollar: typically ${lt.dollar} · Income ceiling: ${CEILING_LABEL[lt.ceiling]}`,
        body: `<div style="font:15px/1.6 Helvetica,Arial,sans-serif;color:${C.ink};">${esc(whyFits(A, lt))}</div>` + moves(lt.moves),
      });
      textLines.push(`YOUR LONG GAME: ${lt.name}`, `First dollar: typically ${lt.dollar}`, "",
        ...lt.moves.map((m, i) => `${i + 1}. ${m}`), "");
    }
    if (fw && lt) {
      blocks += bridge(`How they work together: ${fw.name} pays your first 60 days while ${lt.name.toLowerCase()} compounds toward the real ceiling.`);
    }
  }

  const tone = TONE[protectFrom] || "";
  const toneBlock = tone
    ? `<div style="margin:0 0 16px;padding:16px 20px;background:#ffffff;border:1px solid ${C.beige};
         border-left:4px solid ${C.gold};border-radius:0 14px 14px 0;
         font:15px/1.6 Helvetica,Arial,sans-serif;color:${C.ink};">${esc(tone)}</div>`
    : "";

  const linkBlock = planUrl
    ? `<div style="margin:4px 0 0;font:14px/1.6 Helvetica,Arial,sans-serif;color:${C.gray};">
         Want to change an answer? <a href="${esc(planUrl)}" style="color:${C.green};font-weight:700;">Open Faimgo again</a> on the device you used — your plan is still there, and there&rsquo;s a <b>Change an answer</b> button under it. Your other answers stay filled in, and the plan updates itself.
       </div>` : "";

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:${C.cream};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.cream};padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">
        <tr><td style="padding:0 4px 20px;">
          <div style="font:700 12px/1.4 Helvetica,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:${C.gold};margin:0 0 8px;">Faimgo</div>
          <div style="font:700 26px/1.2 Helvetica,Arial,sans-serif;color:${C.ink};margin:0 0 8px;">${esc(headline)}</div>
          <div style="font:16px/1.6 Helvetica,Arial,sans-serif;color:${C.gray};">Here it is in full, so you can't lose it. Nothing to log into — the whole plan is in this email.</div>
        </td></tr>
        <tr><td>${toneBlock}${blocks}</td></tr>
        <tr><td style="padding:8px 4px 0;">
          <div style="font:15px/1.6 Helvetica,Arial,sans-serif;color:${C.ink};margin:0 0 10px;">
            <b>Do move 1 this week.</b> Not the whole list — just move 1. That's the only thing that has to happen for this to have been worth your two minutes.
          </div>
          ${linkBlock}
          <div style="margin:22px 0 0;padding:16px 0 0;border-top:1px solid ${C.beige};font:13px/1.6 Helvetica,Arial,sans-serif;color:#8A9490;">
            You got this because you asked us to send your plan. We're small and we're building this in the open — if a step doesn't fit your situation, reply to this email and tell us. A real person reads it.
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;

  const text = [
    "FAIMGO — " + headline, "",
    "Here it is in full, so you can't lose it. Nothing to log into.", "",
    ...(tone ? [tone, ""] : []),
    ...textLines,
    "Do move 1 this week. Not the whole list — just move 1.", "",
    ...(planUrl ? ["Want to change an answer? Open Faimgo again on the device you used: " + planUrl, "Your plan is still there, with a \"Change an answer\" button under it. Your other answers stay filled in.", ""] : []),
    "Reply to this email if a step doesn't fit your situation. A real person reads it.",
  ].join("\n");

  return { subject: headline, html, text };
}

export { PATHS };
