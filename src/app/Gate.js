"use client";

import { useEffect, useState } from "react";
import { allowance } from "../lib/meter.js";

/*
  Faimgo money seams — the gate component, shipped switched off.

  See claude/faimgo-money-seams.md §3.3. `allowance()` today always says
  yes, so this component renders its children on every real page load and
  never once shows the fallback in production. It is mounted live anyway
  (on /plan's help rail — see plan/page.js) rather than left sitting unused
  in this file, because a paywall first exercised on the day it starts
  taking money is a paywall that breaks on the day it starts taking money.
  This way the mount → check → render path runs on every real visit, today,
  while the outcome is unconditionally "show it."

  FAILS OPEN, ON PURPOSE, AND THIS IS THE MOST IMPORTANT LINE IN THE FILE.
  If allowance() ever throws, rejects, or simply hasn't resolved yet, Gate
  renders its children — never the fallback. The money-seams doc's own rule
  is "degrade, never refuse" for an EXHAUSTED allowance; the bar for an
  UNCERTAIN one has to be at least as generous, or a network hiccup on
  someone's phone becomes an outage of content that was never actually
  supposed to be gated. A bug in this component can therefore only ever
  cost Faimgo an allowance check it meant to enforce — it can never cost a
  real person content they were entitled to see.

  `need` is passed straight through to allowance() — see meter.js for why.
  `fid` is optional; omit it for a check that isn't tied to a specific
  person yet (there is no such check today, but the prop exists for the
  same reason the rest of this file does).
  `fallback` lets a caller supply its own upgrade UI; the default one below
  is deliberately specific rather than a generic wall, per money-seams.md
  §3.2's point that a refusal without a reason is a wall and a refusal with
  one is a place to degrade to.
*/
export default function Gate({ need, fid, children, fallback }) {
  const [state, setState] = useState({ ok: true, reason: null });

  useEffect(() => {
    let alive = true;
    allowance(fid, need)
      .then((a) => { if (alive && a && a.ok === false) setState({ ok: false, reason: a.reason || null }); })
      .catch(() => { /* fail open — see file header */ });
    return () => { alive = false; };
  }, [fid, need]);

  if (state.ok) return <>{children}</>;
  return fallback ? fallback(state.reason) : <DefaultUpgradeCard need={need} reason={state.reason} />;
}

function DefaultUpgradeCard({ need, reason }) {
  return (
    <div className="p-5 rounded-2xl" style={{ backgroundColor: "#FFFFFF", border: "1px dashed #464C54" }}>
      <p className="text-[15px] leading-relaxed" style={{ color: "#464C54" }}>
        {reason || `This needs ${need || "something"} we can't offer right now.`}
      </p>
    </div>
  );
}
