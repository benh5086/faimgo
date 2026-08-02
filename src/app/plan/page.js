"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import FeedbackWidget from "../FeedbackWidget";
import { loadSaved } from "../../lib/store.js";
import { buildPlan, factLabel } from "../../lib/router.js";

/* ============================================================
   FAIMGO — THE WALKTHROUGH (/plan)

   The results page used to end with "Start my 30/60/90 →" pointing
   at a homepage anchor with nothing behind it. This is the thing
   that was supposed to be behind it.

   THREE RULES THIS PAGE FOLLOWS
   1. It never shows a step we have not written. Where the library
      is thin the page says so in the person's own terms, and falls
      back to the path's opening moves rather than padding.
   2. It never renders a button for a service that does not exist.
      The AI coach and the ask-anything box are written and good and
      are named here as not-built — as text, not as a control.
   3. Everything gated is labelled with what opens it, so nothing is
      hidden and nothing looks skipped.

   It reads the plan out of local storage, which means it is this
   device only — the same honest limit as the assessment. Someone
   arriving with nothing gets told that plainly and sent to the
   assessment, not shown an empty shell.
   ============================================================ */

const C = {
  cream: "#F1F4F2",
  green: "#1B3A2D",
  gold: "#8A6A14",
  beige: "#E4E8E5",
  gray: "#464C54",
  ink: "#15181B",
  greenSoft: "#E4EEE9",
  yellowSoft: "#FBF3DE",
  redSoft: "#F9E9E5",
  red: "#9C3B2E",
};

/* ---------- small pieces ---------- */

function Tag({ children }) {
  return <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: C.gold }}>{children}</p>;
}

function Shell({ children }) {
  return (
    <main className="min-h-screen font-sans" style={{ backgroundColor: C.cream, color: C.ink }}>
      <header className="px-5 py-4" style={{ backgroundColor: C.green }}>
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-display text-[20px] font-bold" style={{ color: C.cream }}>Faimgo</Link>
          <Link href="/assessment" className="text-[15px] font-medium hover:opacity-80" style={{ color: "#9DB0A6" }}>
            Back to my results
          </Link>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-5 py-10">{children}</div>
    </main>
  );
}

/* ---------- one play ---------- */

function PlayCard({ play, openByDefault }) {
  const [open, setOpen] = useState(Boolean(openByDefault));
  const [stalls, setStalls] = useState(false);
  const c = play.content || {};
  const how = play.how_to || {};

  return (
    <div className="rounded-2xl mb-3 overflow-hidden" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${C.beige}` }}>
      <button onClick={() => setOpen(!open)} className="w-full text-left px-5 py-4 flex items-start gap-4 hover:opacity-90">
        <span className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[15px] font-bold mt-[2px]"
          style={{ backgroundColor: C.greenSoft, color: C.green }}>
          {play.n}
        </span>
        <span className="block flex-1">
          <span className="block font-semibold text-[18px] leading-snug" style={{ color: C.ink }}>{play.name}</span>
          <span className="block text-[14px] mt-1" style={{ color: C.gray }}>
            {play.sub}
            {play.time_cost ? <span> · {play.time_cost}</span> : null}
          </span>
        </span>
        <span aria-hidden="true" className="flex-shrink-0 text-[13px] font-bold mt-2" style={{ color: C.gold }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5" style={{ borderTop: `1px dashed ${C.beige}` }}>
          <p className="text-[17px] leading-relaxed mt-4" style={{ color: C.ink }}>{play.move}</p>

          {c.goal && (
            <p className="text-[15px] leading-relaxed mt-3" style={{ color: C.gray }}>
              <b style={{ color: C.ink }}>What done looks like:</b> {c.goal}
            </p>
          )}

          {Array.isArray(c.steps) && c.steps.length > 0 && (
            <ol className="mt-4 mb-1">
              {c.steps.map((s, i) => (
                <li key={i} className="flex gap-3 items-start py-2.5 text-[16px] leading-relaxed"
                  style={{ borderTop: i ? `1px dashed ${C.beige}` : "none", color: C.ink }}>
                  <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: C.beige, color: C.green }}>{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          )}

          {c.done_when && (
            <div className="p-4 rounded-xl mt-4" style={{ backgroundColor: C.greenSoft }}>
              <p className="text-[15px] leading-relaxed" style={{ color: C.green }}>
                <b>You&apos;re done when:</b> {c.done_when}
              </p>
            </div>
          )}

          {/* how_to has three routes written for it: diy_ai, community, skip.
              Only two of them are true today. The community route describes
              peer help through a marketplace that does not exist, so it is not
              rendered here — the honest version of it lives in one line at the
              bottom of the page. Dropping it silently on the card is the right
              call; claiming it on the card is not. */}
          {how.diy_ai && (
            <div className="p-4 rounded-xl mt-4" style={{ backgroundColor: C.cream, border: `1px solid ${C.beige}` }}>
              <p className="text-[12px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: C.gold }}>Doing it on your own</p>
              <p className="text-[15px] leading-relaxed" style={{ color: C.ink }}>{how.diy_ai}</p>
            </div>
          )}

          {play.fear_it_calms && (
            <p className="text-[15px] leading-relaxed mt-4" style={{ color: C.gray }}>{play.fear_it_calms}</p>
          )}

          {how.skip && (
            <p className="text-[15px] leading-relaxed mt-3" style={{ color: C.gray }}>
              <b style={{ color: C.ink }}>The smaller version:</b> {how.skip}
            </p>
          )}

          {/* The single most useful thing in the library and the thing every
              other planner leaves out: what to do when the step does not work.
              Folded away because reading it before you have the problem is
              noise, and one tap away because that is when it is needed. */}
          {Array.isArray(play.if_it_stalls) && play.if_it_stalls.length > 0 && (
            <div className="mt-4">
              <button onClick={() => setStalls(!stalls)} className="text-[15px] font-semibold underline" style={{ color: C.gold }}>
                {stalls ? "Hide" : "What if it doesn't work?"}
              </button>
              {stalls && (
                <div className="mt-3">
                  {play.if_it_stalls.map((s, i) => (
                    <div key={i} className="p-4 rounded-xl mb-2" style={{ backgroundColor: C.yellowSoft }}>
                      <p className="text-[15px] font-semibold" style={{ color: C.ink }}>&ldquo;{s.symptom}&rdquo;</p>
                      <p className="text-[14px] leading-relaxed mt-1.5" style={{ color: C.gray }}>{s.likely_cause}</p>
                      <p className="text-[15px] leading-relaxed mt-2" style={{ color: C.ink }}><b>Do this:</b> {s.do_this}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- on-demand card ---------- */

function RailCard({ play }) {
  const [open, setOpen] = useState(false);
  const c = play.content || {};
  return (
    <div className="rounded-2xl mb-3" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${C.beige}` }}>
      <button onClick={() => setOpen(!open)} className="w-full text-left px-5 py-4 flex items-center gap-3 hover:opacity-90">
        <span aria-hidden="true" className="text-[20px]" style={{ color: C.gold }}>{play.icon}</span>
        <span className="block flex-1">
          <span className="block font-semibold text-[17px]" style={{ color: C.ink }}>{play.short_name}</span>
          <span className="block text-[14px] mt-0.5" style={{ color: C.gray }}>{play.sub}</span>
        </span>
        <span aria-hidden="true" className="text-[13px] font-bold" style={{ color: C.gold }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-5 pb-5" style={{ borderTop: `1px dashed ${C.beige}` }}>
          <p className="text-[16px] leading-relaxed mt-4" style={{ color: C.ink }}>{play.move}</p>
          {Array.isArray(c.steps) && (
            <ul className="list-disc pl-5 mt-3">
              {c.steps.map((s, i) => <li key={i} className="text-[15px] leading-relaxed mb-1" style={{ color: C.gray }}>{s}</li>)}
            </ul>
          )}
          {play.tradeoff && <p className="text-[15px] leading-relaxed mt-3" style={{ color: C.gray }}>{play.tradeoff}</p>}
          {/* launch_note is the library telling the truth about itself. It is
              never paraphrased and never hidden — it is the reason a manual
              service can be offered without it being a lie. */}
          {play.launch_note && (
            <div className="p-4 rounded-xl mt-4" style={{ backgroundColor: C.yellowSoft }}>
              <p className="text-[15px] leading-relaxed" style={{ color: C.ink }}>{play.launch_note}</p>
              <div className="mt-3">
                <FeedbackWidget trigger="cta" kind="contact" context={"plan:" + play.id} navLabel="Tell us what you need" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- page ---------- */

export default function PlanPage() {
  const [state, setState] = useState({ loading: true, saved: null });

  useEffect(() => {
    setState({ loading: false, saved: loadSaved() });
  }, []);

  if (state.loading) {
    return <Shell><p className="text-[16px]" style={{ color: C.gray }}>Loading your plan…</p></Shell>;
  }

  const saved = state.saved;
  const stored = saved && saved.plan ? saved.plan : null;

  /* No plan on this device. The honest version of an empty state: say what
     happened, say why, and give the one action that fixes it. */
  if (!stored || !stored.results) {
    return (
      <Shell>
        <div className="p-8 rounded-2xl" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${C.beige}` }}>
          <Tag>Nothing here yet</Tag>
          <h1 className="font-display text-3xl leading-[1.15] mb-3" style={{ color: C.green }}>
            {saved && saved.progress ? "You're partway through." : "Your walkthrough starts with the assessment."}
          </h1>
          <p className="text-[17px] leading-relaxed mb-2" style={{ color: C.gray }}>
            {saved && saved.progress
              ? "You have answers saved on this device but haven't finished. Pick up where you left off and the walkthrough builds itself from your answers."
              : "The steps below are built from your answers, so there's nothing to show until we have them. It takes about three minutes."}
          </p>
          <p className="text-[15px] leading-relaxed mb-6" style={{ color: C.gray }}>
            One honest note: your plan lives on the device you used, not in an account. If you did the assessment on your phone, open this on your phone.
          </p>
          <Link href="/assessment" className="inline-block px-8 py-3 press rounded-full font-semibold text-base hover:opacity-90"
            style={{ backgroundColor: C.green, color: C.cream }}>
            {saved && saved.progress ? "Pick up where I left off →" : "Take the assessment →"}
          </Link>
        </div>
      </Shell>
    );
  }

  const plan = buildPlan(stored.answers, stored.results);
  const p = plan.path;

  return (
    <Shell>
      {/* ---- who this is for ---- */}
      <div className="mb-8">
        <Tag>Your walkthrough</Tag>
        <h1 className="font-display text-3xl md:text-4xl leading-[1.15] mb-3" style={{ color: C.green }}>
          {p ? `${p.name}, step by step.` : "Your next 90 days."}
        </h1>
        <p className="text-[17px] leading-relaxed" style={{ color: C.gray }}>
          {plan.stepCount > 0
            ? `${plan.stepCount} steps, in the order they actually work. Each one says what done looks like, roughly how long it takes, and what to do when it doesn't go to plan.`
            : "Here's what we have for this path — and, just as importantly, what we don't."}
          {plan.second ? ` ${plan.second.name} was your other strong fit; you can switch to it any time from your results.` : ""}
        </p>
      </div>

      {/* ---- coverage honesty ----
          A short plan served silently reads as a complete one. This is the
          line that stops that from happening. */}
      {plan.coverage !== "full" && (
        <div className="p-5 rounded-2xl mb-8" style={{ backgroundColor: C.yellowSoft, border: "1px solid #EAD9A8" }}>
          <p className="text-[16px] leading-relaxed" style={{ color: C.ink }}>
            <b>Straight with you:</b>{" "}
            {plan.spineApplies
              ? `we've written part of ${p ? "the " + p.name.toLowerCase() : "this"} walkthrough, not all of it. What's below is real and in the right order — the steps specific to this path are still being written, and they'll appear here as they land.`
              : `we haven't written ${p ? "the " + p.name.toLowerCase() : "this"} walkthrough yet. The steps we have are built around finding buyers one at a time, and that isn't how this path works — so rather than hand you the wrong plan, here are the opening moves from your results and an honest note that the rest is coming.`}
          </p>
        </div>
      )}

      {/* ---- start here ---- */}
      {plan.firstPlay && (
        <div className="p-6 rounded-2xl mb-8" style={{ backgroundColor: C.green }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#C7B27A" }}>Start here</p>
          <h2 className="font-display text-[24px] leading-snug mb-2" style={{ color: C.cream }}>{plan.firstPlay.name}</h2>
          <p className="text-[16px] leading-relaxed" style={{ color: "#D6E2DA" }}>
            {plan.firstPlay.move} Give it {plan.firstPlay.time_cost}. Everything after it gets easier once this exists.
          </p>
        </div>
      )}

      {/* ---- the sequence ---- */}
      {plan.phases.map((ph) => (
        <section key={ph.key} className="mb-9">
          <h2 className="font-display text-[26px] mb-1" style={{ color: C.green }}>{ph.label}</h2>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: C.gray }}>{ph.aim}</p>
          {ph.opensWhen && (
            <p className="inline-flex items-center gap-2 mb-4 px-3.5 py-1.5 rounded-full text-[13px] font-bold"
              style={{ backgroundColor: C.beige, color: C.green }}>
              Opens once you have {factLabel(ph.opensWhen)}
            </p>
          )}
          {ph.plays.map((pl) => (
            <PlayCard key={pl.id} play={pl} openByDefault={pl.n === 1} />
          ))}
        </section>
      ))}

      {/* ---- fallback when there is no written sequence ---- */}
      {plan.phases.length === 0 && plan.starterMoves.length > 0 && (
        <section className="mb-9">
          <h2 className="font-display text-[26px] mb-1" style={{ color: C.green }}>Your first three moves</h2>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: C.gray }}>
            These come straight from your results. They&apos;re the right place to start while the full walkthrough is written.
          </p>
          <div className="p-5 rounded-2xl" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${C.beige}` }}>
            <ol>
              {plan.starterMoves.map((m, i) => (
                <li key={i} className="flex gap-3 items-start py-2.5 text-[16px] leading-relaxed"
                  style={{ borderTop: i ? `1px dashed ${C.beige}` : "none", color: C.ink }}>
                  <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: C.beige, color: C.green }}>{i + 1}</span>
                  {m}
                </li>
              ))}
            </ol>
            {plan.starterKit.length > 0 && (
              <div className="mt-4 p-4 rounded-xl border border-dashed" style={{ backgroundColor: C.cream, borderColor: C.gold }}>
                <p className="text-[12px] font-extrabold uppercase tracking-widest mb-2" style={{ color: C.gold }}>Start Cheap Kit</p>
                <ul className="list-disc pl-5">
                  {plan.starterKit.map((k, i) => (
                    <li key={i} className="text-[14px] leading-relaxed mb-1" style={{ color: C.gray }}>{k}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ---- help that exists ---- */}
      {plan.helpRail.length > 0 && (
        <section className="mb-9">
          <h2 className="font-display text-[26px] mb-1" style={{ color: C.green }}>When you get stuck</h2>
          <p className="text-[16px] leading-relaxed mb-4" style={{ color: C.gray }}>
            These aren&apos;t steps and they have no place in the order. Open one the day you need it — from any point in the plan.
          </p>
          {plan.helpRail.map((pl) => <RailCard key={pl.id} play={pl} />)}
        </section>
      )}

      {/* ---- help that does not exist yet ----
          Named as text, never as a control. The day these are real they move
          up into the rail above and this block disappears. */}
      {plan.notBuiltYet.length > 0 && (
        <div className="p-5 rounded-2xl mb-9" style={{ backgroundColor: "#FFFFFF", border: `1px dashed ${C.gray}` }}>
          <p className="text-[15px] leading-relaxed" style={{ color: C.gray }}>
            <b style={{ color: C.ink }}>Not built yet, and we&apos;d rather say so:</b> an ask-anything box that already knows
            which step you&apos;re on, and AI coaching that picks up from your answers instead of starting cold. Both are
            designed and neither is live. Until they are, the box below reaches a person, not a bot.
          </p>
          <p className="text-[15px] leading-relaxed mt-3" style={{ color: C.gray }}>
            Same for getting a person to help with a step. Several of these steps have a version where someone who has
            done it before does it with you — that&apos;s a real plan and it isn&apos;t built. Today it happens by hand:
            you tell us what you&apos;re stuck on, and we match you ourselves.
          </p>
        </div>
      )}

      {/* ---- the one real channel ---- */}
      <div className="p-7 rounded-2xl text-center mb-8" style={{ backgroundColor: "#FFFFFF", border: `2px solid ${C.green}` }}>
        <h3 className="font-display text-[22px] mb-2" style={{ color: C.green }}>Stuck on a step, or think one&apos;s wrong?</h3>
        <p className="text-[15px] leading-relaxed mb-4" style={{ color: C.gray }}>
          A real person reads these. That&apos;s slower than a chatbot and it&apos;s the honest version of what we have today.
        </p>
        <FeedbackWidget trigger="cta" kind="contact" context={"plan:" + (plan.pathId || "none")} navLabel="Tell us where you're stuck" />
      </div>

      <div className="flex flex-col items-center gap-3">
        <Link href="/assessment" className="text-[15px] underline" style={{ color: C.gray }}>
          Back to my results
        </Link>
        <p className="text-[13px] text-center max-w-md leading-relaxed" style={{ color: C.gray }}>
          Change an answer over there and this walkthrough rebuilds itself — it&apos;s built from your answers, not saved separately.
        </p>
      </div>
    </Shell>
  );
}
