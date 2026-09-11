"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import FeedbackWidget from "../FeedbackWidget";
import AccountLink from "../AccountLink";
import Gate from "../Gate.js";
import { loadSaved, session, markStep, markOutcome, markSignal, readSteps, hasEverEarned, OUTCOMES, getAccountSession, getLinkedEmail } from "../../lib/store.js";
import { track } from "../../lib/track.js";
import { buildPlan, factLabel } from "../../lib/router.js";
import { toolHref } from "../../lib/affiliate.js";
import CoachChat from "../CoachChat";

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
          <div className="flex items-center gap-5">
            <Link href="/assessment" className="text-[15px] font-medium hover:opacity-80" style={{ color: "#9DB0A6" }}>
              Back to my results
            </Link>
            <AccountLink color="#9DB0A6" />
          </div>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-5 py-10">{children}</div>
    </main>
  );
}

/* ---------- one play ---------- */

/* Text written to be pasted, not admired. A copy button because the
   alternative is a person hand-retyping a message on a phone, which is
   where good wording goes to die. Falls back silently to select-and-copy
   if the clipboard API is unavailable — never shows an error for this. */
function CopyBox({ text }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch { /* select-and-copy still works; saying nothing is the right failure */ }
  };
  return (
    <div className="mt-2 rounded-xl overflow-hidden" style={{ border: `1px solid ${C.beige}`, backgroundColor: "#FFFFFF" }}>
      <p className="px-4 py-3 text-[15px] leading-relaxed" style={{ color: C.ink, whiteSpace: "pre-wrap" }}>{text}</p>
      <div className="px-4 py-2 flex justify-end" style={{ borderTop: `1px dashed ${C.beige}`, backgroundColor: C.cream }}>
        <button onClick={copy} className="press text-[13px] font-bold rounded-full px-4 py-1.5"
          style={{ backgroundColor: done ? C.greenSoft : C.green, color: done ? C.green : C.cream }}>
          {done ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

/* ---------- the concrete layer ----------
   Everything above this in a play card is direction: what to do, and how
   to know it worked. Direction is the part any model can produce on
   demand, and a walkthrough made only of direction is a walkthrough with
   no reason to exist. This block is the part that was missing — the named
   tool, the actual number, the sentence you can paste. */
function Concrete({ x }) {
  if (!x) return null;
  const tools = Array.isArray(x.tools) ? x.tools : [];
  const numbers = Array.isArray(x.numbers) ? x.numbers : [];
  return (
    <div className="mt-5 p-5 rounded-2xl" style={{ backgroundColor: C.cream, border: `1px solid ${C.beige}` }}>
      {x.right_now && (
        <div className="mb-4">
          <p className="text-[12px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: C.gold }}>In the next 15 minutes</p>
          <p className="text-[16px] leading-relaxed font-semibold" style={{ color: C.ink }}>{x.right_now}</p>
        </div>
      )}

      {tools.length > 0 && (
        <div className="mb-4">
          <p className="text-[12px] font-extrabold uppercase tracking-widest mb-2" style={{ color: C.gold }}>What you&apos;ll use</p>
          {tools.map((t, i) => {
            /* The tool name links to the tool — its normal site today, or a
               referral link the day one is registered in affiliate.js. These
               links live only on our own page, never in outreach. */
            const link = toolHref(t.name, t.at);
            return (
              <div key={i} className="py-2" style={{ borderTop: i ? `1px dashed ${C.beige}` : "none" }}>
                <p className="text-[15px]" style={{ color: C.ink }}>
                  {link ? (
                    <a href={link.href} target="_blank"
                      rel={link.isAffiliate ? "noopener sponsored" : "noopener noreferrer"}
                      style={{ color: C.green, fontWeight: 700, textDecorationColor: C.beige, textUnderlineOffset: "2px" }}>
                      {t.name}
                    </a>
                  ) : <b>{t.name}</b>}
                  {t.cost ? <span style={{ color: C.green }}> · {t.cost}</span> : null}
                  {t.at && t.at !== "—" ? <span style={{ color: C.gray }}> · {t.at}</span> : null}
                </p>
                {t.for && <p className="text-[14px] leading-relaxed mt-0.5" style={{ color: C.gray }}>{t.for}</p>}
              </div>
            );
          })}
        </div>
      )}

      {numbers.length > 0 && (
        <div className="mb-4">
          <p className="text-[12px] font-extrabold uppercase tracking-widest mb-2" style={{ color: C.gold }}>The numbers</p>
          <ul className="list-disc pl-5">
            {numbers.map((s, i) => (
              <li key={i} className="text-[15px] leading-relaxed mb-1" style={{ color: C.ink }}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      {x.say_this && x.say_this.text && (
        <div>
          <p className="text-[12px] font-extrabold uppercase tracking-widest mb-1.5" style={{ color: C.gold }}>Say this</p>
          {x.say_this.when && <p className="text-[14px] leading-relaxed" style={{ color: C.gray }}>{x.say_this.when}</p>}
          <CopyBox text={x.say_this.text} />
        </div>
      )}
    </div>
  );
}

/* ---------- the completion control ----------
   The single most important control on the page, and the reason this page
   now has a reason to be revisited at all. Everything the product wants to
   do later — an exchange between members, a profile of what someone can
   actually do, money — begins with somebody finishing something and saying
   so. Until this existed there was nowhere to say it.

   Deliberate absences, each one load-bearing:
   - No streak, no dates, no "you last did this N days ago". This is built
     for a person whose time comes in fragments; a streak would greet them
     with guilt at the exact moment they came back.
   - Unticking is always allowed. A record you cannot correct is a record
     people stop trusting, and then stop using.
   - The note is optional and stays optional. Requiring it would trade the
     thing we need most (completions) for the thing we merely want (texture). */
/*
  The outcome question. Deliberately NOT part of marking a step done.

  Completion and result are two different questions asked at two different
  times: you finish sending ten messages on a Tuesday and find out whether it
  worked the following week. Asking both at once would put a question with no
  honest answer in front of the one action we most need people to take.

  So this only ever appears on a card that is already marked done, the record
  is already safe before it is shown, and every route out of it is a
  non-answer. "Not yet" is listed first because it is the true majority
  answer, and a question whose commonest answer feels like an admission is a
  question people skip.
*/
const OUTCOME_LABEL = {
  not_yet: "Not yet",
  reply: "A reply or a lead",
  customer: "A customer",
  money: "Money",
};
const OUTCOME_SAID = {
  not_yet: "Nothing back yet — that's normal, and the step still counts.",
  reply: "Something came back. That's the hard part starting to move.",
  customer: "You got a customer out of this one.",
  money: "This one made money. That's the whole point of the thing.",
};

function OutcomeControl({ play, step, onOutcome }) {
  const [open, setOpen] = useState(false);
  const chosen = step && step.outcome;

  if (chosen) {
    return (
      <div className="mt-2">
        <p className="text-[14px] leading-relaxed" style={{ color: C.green }}>{OUTCOME_SAID[chosen]}</p>
        <button onClick={() => onOutcome(play, null)} className="press text-[13px] font-semibold underline underline-offset-2 mt-1" style={{ color: C.gray }}>
          Change that
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="press text-[14px] font-semibold underline underline-offset-2 mt-2" style={{ color: C.gold }}>
        Did anything come of it yet?
      </button>
    );
  }

  return (
    <div className="mt-3">
      <p className="text-[14px] leading-relaxed mb-2" style={{ color: C.gray }}>
        {"Only if you feel like saying. You can change it later — most of these turn into something weeks after the step itself."}
      </p>
      <div className="flex flex-wrap gap-2">
        {OUTCOMES.map((o) => (
          <button key={o} onClick={() => onOutcome(play, o)}
            className="press px-4 py-2 rounded-full text-[14px] font-semibold"
            style={{ backgroundColor: "#FFFFFF", border: `1px solid ${C.beige}`, color: C.ink }}>
            {OUTCOME_LABEL[o]}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- the check-in ----------
   The turn that makes this page a conversation instead of a checklist, and
   the reason someone comes BACK to it rather than reading it once. It is the
   `checkin` block that has sat written-but-unrendered in every core play in
   plays.json since the library was authored: a question ("How did that
   land?"), a handful of honest answers, and for each answer a `then` — the
   one sentence a coach would say next — plus a `routes_to` pointing at the
   exact thing to do about it.

   THREE THINGS IT DOES, AND WHY EACH MATTERS
   1. It responds. The person marks a step done and the page says something
      specific back, in the library's own written voice. That specificity is
      the whole difference between a document and a coach — and it is what the
      first cohort experiences as the product paying attention to them.
   2. It routes. When the answer is "I'm still stuck", `routes_to` names where
      to go — another step, the get-a-human card, or, where the target is the
      not-yet-built AI coach, an honest hand to a real person. It never
      renders a dead link: a route to something not on this page falls back to
      the human channel rather than a button that goes nowhere.
   3. It records the signal (markSignal). blocked:offer / has:price / … is the
      exact vocabulary help.ai-coach's `need_signals` is written to consume,
      so every answer given here is training history the future coach picks up
      from instead of starting cold.

   Re-answerable on purpose (see markSignal): "still stuck" turning into "got
   it" is the transition the product most wants to see, so the answer is never
   frozen. */
/*
  `help.ai-coach` is real now (src/lib/coach.js / src/app/api/coach/route.js)
  — this component tries it live, once, when it renders. `help.faimgo-help`
  (the general ask-anything box) is a separate, bigger seam and stays exactly
  as it was: an honest hand to a real person. Never conflate the two.

  DEGRADE, NEVER REFUSE (coach-constraints.md rule 4 / money-seams §2.4):
  loading is the only new visible state, and it's brief and low-key, not a
  spinner-heavy wall. Any failure — not configured, daily ceiling, network,
  the model declining — renders EXACTLY what this used to always render, so
  there is no new way for this card to disappoint someone; the floor is the
  same honest "not live yet, a person reads it instead" it always was. The
  FeedbackWidget contact box stays visible even after a good coach reply —
  a coach reply is not a reason to take away the door to a real person.
*/
function CheckinRoute({ option, play, renderedIds, onGoto, planPathId, planGap, doneIds, ids }) {
  const rt = option.routes_to;
  const isCoach = rt === "help.ai-coach";
  const [coach, setCoach] = useState({ status: "idle" });

  useEffect(() => {
    if (!isCoach) return;
    if (coach.status !== "idle") return;
    setCoach({ status: "loading" });
    fetch("/api/coach", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "stuck_help",
        focusPlayId: play.id,
        situationText: option.signal || null,
        path: planPathId || null,
        gap: planGap || null,
        doneIds: doneIds || [],
        fid: ids?.fid || null,
        sid: ids?.sid || null,
      }),
    })
      .then((r) => r.json())
      .catch(() => ({ ok: false, reason: "network_error" }))
      .then((data) => {
        if (data && data.ok) setCoach({ status: "done", reply: data.reply });
        else setCoach({ status: "error" });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCoach, play.id, option.signal]);

  if (!rt) return null;
  const notBuilt = rt === "help.faimgo-help" || (isCoach && coach.status === "error");
  const onPage = Boolean(renderedIds && renderedIds.has(rt)) && rt !== "help.faimgo-help" && !(isCoach && coach.status !== "done");

  if (onPage) {
    return (
      <button onClick={() => onGoto(rt)} className="press text-[14px] font-bold underline underline-offset-2 mt-3" style={{ color: C.gold }}>
        Take me to the step that fixes this →
      </button>
    );
  }

  if (isCoach && (coach.status === "idle" || coach.status === "loading")) {
    return (
      <p className="mt-3 text-[14px]" style={{ color: C.gray }}>
        Thinking about your specific situation…
      </p>
    );
  }

  if (isCoach && coach.status === "done") {
    /* Phase 2 (Sep 11 2026): the first grounded reply came from the one-shot
       stuck_help call above; from here it becomes a real back-and-forth. We
       seed CoachChat with that first exchange (what they clicked + the
       coach's answer) and it carries every follow-up via kind:"chat", still
       grounded on this same focus play. CoachChat owns the real-person door,
       so the standalone FeedbackWidget is no longer needed here. */
    // Account state for the save nudge (verified => no nudge; email on file but
    // unverified => "verify it"; nothing => "add your email"). session() does
    // NOT carry these — read them straight from the store.
    const acct = getAccountSession();
    const savedNow = loadSaved();
    const planEmail = savedNow?.plan?.email || savedNow?.progress?.email || null;
    return (
      <div className="mt-3">
        <CoachChat
          fid={ids?.fid || null}
          sid={ids?.sid || null}
          personId={acct?.personId || null}
          verified={Boolean(acct?.personId)}
          emailEntered={Boolean(acct?.email || getLinkedEmail() || planEmail)}
          surface="plan"
          context={{ path: planPathId || null, gap: planGap || null, focusPlayId: play.id, doneIds: doneIds || [] }}
          toolTools={play.concrete?.tools || []}
          escalateContext={play.id + ":" + option.signal}
          initialMessages={[
            { role: "user", content: option.label || "I'm stuck on this step." },
            { role: "coach", content: coach.reply.message, meta: { toolName: coach.reply.toolName || null, coverage: coach.reply.coverage || null, escalate: false } },
          ]}
          placeholder="Tell the coach what happened when you tried…"
        />
      </div>
    );
  }

  return (
    <div className="mt-3 p-4 rounded-xl" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${C.beige}` }}>
      {notBuilt && (
        <p className="text-[14px] leading-relaxed mb-2" style={{ color: C.gray }}>
          The AI coach that would take this from here isn&apos;t live yet — so a real person reads it instead. That&apos;s the honest version of what we have today.
        </p>
      )}
      <FeedbackWidget trigger="cta" kind="contact" context={"checkin:" + play.id + ":" + option.signal} navLabel="Tell us exactly where you're stuck" />
    </div>
  );
}

function CheckinControl({ play, step, renderedIds, onSignal, onGoto, planPathId, planGap, doneIds, ids }) {
  const ck = play.checkin;
  if (!ck || !Array.isArray(ck.options) || ck.options.length === 0) return null;

  const chosenSignal = step && step.signal;
  const chosen = chosenSignal ? ck.options.find((o) => o.signal === chosenSignal) : null;

  if (chosen) {
    return (
      <div className="mt-3 p-4 rounded-xl" style={{ backgroundColor: C.cream, border: `1px solid ${C.beige}` }}>
        <p className="text-[15px] leading-relaxed" style={{ color: C.ink }}>{chosen.then}</p>
        <CheckinRoute option={chosen} play={play} renderedIds={renderedIds} onGoto={onGoto} planPathId={planPathId} planGap={planGap} doneIds={doneIds} ids={ids} />
        <button onClick={() => onSignal(play, null)} className="press text-[13px] font-semibold underline underline-offset-2 mt-3" style={{ color: C.gray }}>
          That&apos;s not quite where I am
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 p-4 rounded-xl" style={{ backgroundColor: C.cream, border: `1px solid ${C.beige}` }}>
      <p className="text-[15px] font-semibold mb-2.5" style={{ color: C.ink }}>{ck.question}</p>
      <div className="flex flex-col gap-2">
        {ck.options.map((o) => (
          <button key={o.signal} onClick={() => onSignal(play, o.signal)}
            className="press text-left px-4 py-2.5 rounded-xl text-[15px] leading-snug hover:opacity-90"
            style={{ backgroundColor: "#FFFFFF", border: `1px solid ${C.beige}`, color: C.ink }}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function DoneControl({ play, done, step, onToggle, onOutcome, onSignal, onGoto, renderedIds, planPathId, planGap, doneIds, ids }) {
  const [note, setNote] = useState("");
  const [asking, setAsking] = useState(false);

  if (done) {
    return (
      <div className="mt-4">
        <div className="p-4 rounded-xl" style={{ backgroundColor: C.greenSoft }}>
          <div className="flex items-center justify-between gap-4">
            <p className="text-[15px] font-semibold" style={{ color: C.green }}>Done. That&apos;s one that actually happened.</p>
            <button onClick={() => onToggle(play, false)} className="press text-[13px] font-semibold underline underline-offset-2 flex-shrink-0" style={{ color: C.gray }}>
              Undo
            </button>
          </div>
          {/* Closes the loop on the note left in the "I did this" box above.
              Before this, markStep() saved it (locally and, once an email is
              on file, to person_steps.note in Postgres — see api/step's
              mirrorStep) but nothing on screen ever showed it again, so
              writing one felt like it vanished. It didn't — it just was
              never echoed back. This is the echo. */}
          {step?.note && (
            <p className="text-[14px] leading-relaxed mt-2 italic" style={{ color: C.green }}>
              You noted: &ldquo;{step.note}&rdquo;
            </p>
          )}
          <OutcomeControl play={play} step={step} onOutcome={onOutcome} />
        </div>
        <CheckinControl play={play} step={step} renderedIds={renderedIds} onSignal={onSignal} onGoto={onGoto} planPathId={planPathId} planGap={planGap} doneIds={doneIds} ids={ids} />
      </div>
    );
  }

  return (
    <div className="mt-4">
      {!asking ? (
        <button onClick={() => setAsking(true)} className="press w-full py-3 rounded-xl text-[15px] font-bold"
          style={{ backgroundColor: C.green, color: C.cream }}>
          I did this
        </button>
      ) : (
        <div className="p-4 rounded-xl" style={{ backgroundColor: C.cream, border: `1px solid ${C.beige}` }}>
          <p className="text-[14px] leading-relaxed mb-2" style={{ color: C.gray }}>
            Anything worth remembering about how it went? One line is plenty — and skipping it is completely fine.
          </p>
          <input value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Optional — what happened"
            className="w-full px-3 py-2 rounded-lg text-[15px] mb-3"
            style={{ backgroundColor: "#FFFFFF", border: `1px solid ${C.beige}`, color: C.ink }} />
          <div className="flex gap-2">
            <button onClick={() => onToggle(play, true, note)} className="press px-5 py-2 rounded-full text-[14px] font-bold"
              style={{ backgroundColor: C.green, color: C.cream }}>Mark it done</button>
            <button onClick={() => setAsking(false)} className="press px-4 py-2 rounded-full text-[14px] font-semibold"
              style={{ color: C.gray }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* Shown only on steps the library says speak directly to what this person
   said they're missing (`fitsGap`, computed in router.js from the answer to
   the Aug 15 gap question). The absence of the badge is not a demotion —
   every step still appears, in the same order, with the same content; the
   badge just tells someone which ones are the direct answer to their gap,
   so a person skimming under real time pressure knows where to slow down. */
function GapBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-full mb-2"
      style={{ backgroundColor: C.greenSoft, color: "#0F6B3F" }}>
      Closes your gap
    </span>
  );
}

function PlayCard({ play, openByDefault, forceOpen, standalone, steps, onToggle, onOutcome, onSignal, onGoto, renderedIds, planPathId, planGap, ids }) {
  const doneIds = Object.keys(steps || {}).filter((id) => steps[id]);
  const [open, setOpen] = useState(Boolean(openByDefault));
  const [stalls, setStalls] = useState(false);
  const c = play.content || {};
  const how = play.how_to || {};

  /* A check-in on another card can route the person here — "take me to the
     step that fixes this". When it does, the target must actually open, not
     just scroll to a collapsed header. forceOpen flips true for the focused
     card; this opens it and never forces it shut again, so a person who then
     collapses it by hand keeps that choice. */
  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  /* `standalone` is the one-task-per-screen view (see PlanPage below): the
     card IS the page, so it renders permanently open with no collapse
     header to click — there's nothing to expand into, and a toggle that
     does nothing is worse than no toggle. The old accordion header (with
     the number badge and the ▲▼ arrow) only makes sense when several cards
     share one long page, which is exactly the layout this batch removes. */
  const isOpen = standalone || open;

  return (
    <div id={"play-" + play.id} className="rounded-2xl mb-3 overflow-hidden" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${C.beige}` }}>
      {standalone ? (
        <div className="px-5 pt-5 pb-1">
          {play.fitsGap && <GapBadge />}
          <h2 className="font-display text-[24px] leading-snug mt-1" style={{ color: C.ink }}>{play.name}</h2>
          <p className="text-[14px] mt-1" style={{ color: C.gray }}>
            {play.sub}
            {play.time_cost ? <span> · {play.time_cost}</span> : null}
          </p>
        </div>
      ) : (
        <button onClick={() => setOpen(!open)} className="w-full text-left px-5 py-4 flex items-start gap-4 hover:opacity-90">
          <span className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[15px] font-bold mt-[2px]"
            style={{ backgroundColor: C.greenSoft, color: C.green }}>
            {play.n}
          </span>
          <span className="block flex-1">
            {play.fitsGap && <span className="block"><GapBadge /></span>}
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
      )}

      {isOpen && (
        <div className="px-5 pb-5" style={{ borderTop: standalone ? "none" : `1px dashed ${C.beige}` }}>
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

          <Concrete x={play.concrete} />

          <DoneControl play={play} done={Boolean(steps[play.id])} step={steps[play.id]} onToggle={onToggle} onOutcome={onOutcome} onSignal={onSignal} onGoto={onGoto} renderedIds={renderedIds} planPathId={planPathId} planGap={planGap} doneIds={doneIds} ids={ids} />

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

function RailCard({ play, forceOpen }) {
  const [open, setOpen] = useState(false);
  const c = play.content || {};

  /* Same as PlayCard: a check-in that routes to this help card (e.g. "get a
     human") must open it, not just scroll to its shut header. */
  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  return (
    <div id={"rail-" + play.id} className="rounded-2xl mb-3" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${C.beige}` }}>
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
  const [steps, setSteps] = useState({});
  const [ids, setIds] = useState(null);
  /* Which card a check-in has routed the person to, so it opens on arrival
     rather than being scrolled to while still collapsed. Only meaningful
     for help-rail cards now (see below) — a route into the sequence itself
     is handled by activeOverrideId instead, since the sequence is no longer
     a long page to scroll, it's one card at a time. */
  const [focusId, setFocusId] = useState(null);
  /* One-task-per-screen (Sep 6 batch): the page normally shows whichever
     step is next in the person's own order (`nextUp`, computed below from
     which steps are already ticked). A check-in's "take me to the step that
     fixes this" is the one thing allowed to override that — someone got
     routed to an EARLIER, already-unlocked step to go fix something, and
     needs to see that step specifically, not be dropped back at the front
     of the line. Clearing it (on completing a step, or via the explicit
     "back to my current step" link) returns to normal, automatic ordering. */
  const [activeOverrideId, setActiveOverrideId] = useState(null);
  /* Whether the read-only list of already-done steps is expanded. Shut by
     default on purpose — the whole point of one-task-per-screen is that a
     finished step is not something you have to look at again to keep going. */
  const [historyOpen, setHistoryOpen] = useState(false);

  /* Marking a step done is the one write on this page that matters, so it
     does three things at once: store it locally (instant, works offline),
     re-render, and report it.

     The report puts the play id INSIDE the event name — `step_done:offer.define`
     rather than a `play` field — because the Sheet behind this has fixed
     columns and would silently drop an unknown field. `track.js` states that
     rule at the top of the file; this is the first place it earns its keep.
     The result is that the one number the whole direction rests on — how many
     people finish step one — starts accumulating today, with no database and
     no change to the Apps Script. */
  const onToggle = (play, done, note) => {
    markStep(play.id, done, note);
    setSteps(readSteps());
    if (done) track(ids, "step_done:" + play.id);
    /* Finishing a step is the moment to hand control back to normal
       ordering — whether this step was the person's natural next-up or one
       a check-in routed them back to. Leaving an override in place after
       the very thing it existed for is done would strand them on a step
       they already finished instead of moving them forward. Undoing a step
       (done === false) never touches this — someone reviewing/correcting
       history is not asking to be moved anywhere. */
    if (done) setActiveOverrideId(null);

    /* Mirror into Postgres (person_steps) so this completion counts toward
       the person's PUBLIC record — see claude/faimgo-profile-scope-sep6.md.
       Fire-and-forget, on purpose: the local write above is what must never
       fail, this is a background sync that can silently fail without the
       person noticing anything except their profile's count lagging by one
       action. Only fires when we know which email this plan belongs to —
       the same submitted-address trust level api/lead's mirrorPlan already
       uses, no new proof-of-ownership needed to record your own action. */
    const email = stored?.email;
    if (email) {
      fetch("/api/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fid: ids?.fid, playId: play.id, done, note }),
      }).catch(() => { /* best-effort — see comment above */ });
    }
  };

  /* The second half of the same record: not "did you do it" but "did it do
     anything". Two events fire, and the reason for two rather than one is
     worth stating because it looks like duplication:

     `step_outcome:<value>:<play id>` is the fine-grained row — it is how we
     will eventually answer "which steps actually work", which is the only
     honest basis for rewriting the library.

     `first_dollar` is fired ONCE per person, ever, and only the first time
     they report money. It is the number the entire direction points at, so
     it has to mean one person reaching a first dollar — not one person
     reporting money on five different steps. `hasEverEarned()` is checked
     BEFORE the write, because after the write it would always be true. */
  const onOutcome = (play, outcome) => {
    const firstEver = outcome === "money" && !hasEverEarned();
    const stored = markOutcome(play.id, outcome);
    setSteps(readSteps());
    if (!stored || !outcome) return;
    track(ids, "step_outcome:" + outcome + ":" + play.id);
    if (firstEver) track(ids, "first_dollar");
  };

  /* The check-in answer. Records the library-vocabulary signal locally
     (markSignal), re-renders so the `then` coaching line replaces the
     question, and reports it. The signal goes INSIDE the event name for the
     same fixed-column reason step_done does — `checkin:blocked:offer:offer.define`
     — so the blockers people actually hit start accumulating today, which is
     the first real evidence of where the walkthrough loses people and the
     exact history the future AI coach is written to pick up from. A null
     signal is the person un-answering; nothing is reported for that. */
  const onSignal = (play, signal) => {
    markSignal(play.id, signal);
    setSteps(readSteps());
    if (signal) track(ids, "checkin:" + signal + ":" + play.id);
  };

  /* A check-in routed the person to another card. Two different things can
     be true about the target, and they need two different responses now
     that the sequence shows one card at a time instead of a long page:

     - The target is one of the person's own steps (`ordered`, below) — the
       page needs to actually SHOW that step, so `activeOverrideId` swaps
       the single visible card to it. There is nothing to scroll to; the
       card that appears IS the destination.
     - The target is a help-rail card (on-demand, always fully rendered,
       still its own scrollable section) — the old scroll-and-expand
       behavior is still exactly right there, nothing about the rail
       changed this batch. */
  const onGoto = (targetId) => {
    if (!targetId) return;
    track(ids, "checkin_route:" + targetId);
    if (ordered.some((pl) => pl.id === targetId)) {
      setActiveOverrideId(targetId);
      try { if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) { /* nicety only */ }
      return;
    }
    setFocusId(targetId);
    try {
      setTimeout(() => {
        try {
          const el = document.getElementById("rail-" + targetId);
          if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch (e) { /* scroll is a nicety, never a requirement */ }
      }, 80);
    } catch (e) { /* setTimeout unavailable is not a reason to fail a click */ }
  };

  useEffect(() => {
    /* Which specific plan this link means, if any. Read directly off
       window.location rather than next/navigation's useSearchParams() —
       that hook requires wrapping the page in a <Suspense> boundary in the
       App Router, which this page doesn't have and doesn't otherwise need.
       Client-only feature-detected reads like this already exist elsewhere
       in the codebase (see captureAttribution() in store.js). No id in the
       URL — every link written before this batch — falls back inside
       loadSaved() to whatever plan is most recently active on this device,
       exactly as it always has. */
    let urlId = null;
    try {
      if (typeof window !== "undefined") {
        urlId = new URLSearchParams(window.location.search).get("id") || null;
      }
    } catch (e) { /* URL reads must never break the page */ }

    const saved = loadSaved(urlId || undefined);
    setState({ loading: false, saved });
    setSteps(readSteps());

    /* Until now the only way we knew this page had been opened was the
       click on the results screen. The plan email now links straight
       here, and an arrival from an inbox never touches that button —
       so without this, every email reader would be invisible.

       Two names rather than one event with a field: the sheet behind
       this has fixed columns, and an empty arrival is the number that
       actually matters. It means someone opened the walkthrough on a
       device that has never seen their answers — which is the exact
       limit the email warns about, and the first hard evidence of how
       often the warning is not enough. */
    const s = session();
    setIds(s);
    track(s, saved && saved.plan && saved.plan.results ? "plan_view" : "plan_view_empty");
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

  const plan = buildPlan(stored.answers, stored.results, stored.protectFrom);
  const p = plan.path;
  /* The path the steps below belong to. Same as `p` unless the chosen path
     has no written spine and we borrowed the fast win — see router.js. */
  const w = plan.walkPath || plan.path;

  /* The assessment's "which of these is closest to it? → Something else"
     free-text answer, when it didn't keyword-match one of the nine paths
     (computeResults' `mode` is "custom" for a real described idea, "doubt"
     for "not sure / no idea" text — see assessment/page.js's resolveOther).
     Either way, `results.chosen` was never set, so `plan.path` above is
     already silently the generic best-scored fallback (fastestWin), not
     anything about what this person actually described. The results page
     says this honestly (the "Your idea" / "you don't need the answer yet"
     cards); this page used to not say it at all, which reads as the
     walkthrough having thrown their own words away — because, without this
     banner, it looks exactly like it did. */
  const resultsMode = stored.results?.mode;
  const otherIdea = stored.otherIdea || "";

  /* Progress, computed rather than stored — the sequence can change (a
     retake, a new play shipped) and a stored pointer would go stale and
     start lying. `nextUp` is simply the first step not yet ticked. */
  const ordered = plan.phases.flatMap((ph) => ph.plays);
  const doneCount = ordered.filter((pl) => steps[pl.id]).length;
  const nextUp = ordered.find((pl) => !steps[pl.id]) || null;

  /* The one card actually shown (see PlanPage's top-of-file note and the
     activeOverrideId state comment). Normal case: whatever `nextUp` is.
     Overridden case: a check-in sent them back to an earlier, already-
     unlocked step — validated against `ordered` again here so a stale
     override (its target got marked done by other means, or doesn't exist
     in a rebuilt plan after a retake) can never point at nothing; it just
     falls back to nextUp exactly as if no override existed. */
  const overridePlay = activeOverrideId ? ordered.find((pl) => pl.id === activeOverrideId) : null;
  const activePlay = overridePlay || nextUp;
  const activeIndex = activePlay ? ordered.findIndex((pl) => pl.id === activePlay.id) : -1;
  const doneSoFar = activeIndex >= 0 ? ordered.slice(0, activeIndex).filter((pl) => steps[pl.id]) : ordered.filter((pl) => steps[pl.id]);

  /* Every card actually on this page — the sequence plus the help rail. A
     check-in only offers "take me there" when its `routes_to` is in here;
     anything else falls back to the human channel, so no route is ever a dead
     link. */
  const renderedIds = new Set([...ordered.map((pl) => pl.id), ...plan.helpRail.map((pl) => pl.id)]);

  return (
    <Shell>
      {/* ---- who this is for ---- */}
      <div className="mb-8">
        {/* A warm word for someone coming back — but nothing about how long
            they were gone. The record never resets and never counts days, so
            the greeting can't either: a person returning after a month gets
            "welcome back", never "it's been a while". Only shown once they've
            actually finished something, so it lands as recognition, not as a
            greeting bolted onto a stranger's first visit. */}
        {ids && ids.returning && doneCount > 0 && (
          <p className="text-[15px] font-bold mb-2" style={{ color: C.gold }}>Welcome back — right where you left off.</p>
        )}
        <Tag>Your walkthrough</Tag>
        <h1 className="font-display text-3xl md:text-4xl leading-[1.15] mb-3" style={{ color: C.green }}>
          {w ? `${w.name}, step by step.` : "Your next 90 days."}
        </h1>
        <p className="text-[17px] leading-relaxed" style={{ color: C.gray }}>
          {plan.stepCount > 0
            ? (doneCount > 0
                ? `${doneCount} of ${plan.stepCount} done. Nothing here expires and nothing resets — pick it up whenever you next get a spare forty minutes.`
                : `${plan.stepCount} steps, in the order they actually work. Each one says what done looks like, roughly how long it takes, and what to do when it doesn't go to plan.`)
            : "Here's what we have for this path — and, just as importantly, what we don't."}
          {!plan.borrowed && plan.second ? ` ${plan.second.name} was your other strong fit; you can switch to it any time from your results.` : ""}
        </p>
      </div>

      {/* ---- your own idea got no written walkthrough, and we say so ----
          The counterpart to "we borrowed a spine" below, for the case that
          block doesn't cover: there was never a chosen path to borrow away
          from, because the free-text idea from the assessment didn't map to
          one of the nine paths at all. Silently walking the generic
          best-scored fastest-win path here — which is exactly what
          `plan.path` already is in this case — with nothing on screen
          explaining that is the single biggest reason this page can feel
          like it ignored what someone actually said. */}
      {(resultsMode === "custom" || resultsMode === "doubt") && p && (
        <div className="p-5 rounded-2xl mb-8" style={{ backgroundColor: C.yellowSoft, border: "1px solid #EAD9A8" }}>
          <p className="text-[16px] leading-relaxed" style={{ color: C.ink }}>
            {resultsMode === "custom" ? (
              <>
                <b>{otherIdea ? `Why this doesn't walk through "${otherIdea}" directly:` : "Why this isn't your own idea, directly:"}</b>{" "}
                {otherIdea ? `"${otherIdea}"` : "What you described"} doesn&apos;t have a written play library yet — it&apos;s a real idea, not one of the nine paths this walkthrough is built for. So what&apos;s below is {p.name.toLowerCase()}, your strongest scored fit from everything else you answered, as the funding path while you validate your own idea (your results page has the 3-step validation plan for that). This isn&apos;t a substitute for what you said — it&apos;s what pays the bills while you test it.
              </>
            ) : (
              <>
                <b>Why this walks {p.name.toLowerCase()}:</b>{" "}you told us you weren&apos;t sure yet, which is the normal starting point, not a gap. {p.name} scored highest across your time, inventory, and working style, so that&apos;s the walkthrough below — pick a different one any time from your results if it stops fitting.
              </>
            )}
          </p>
        </div>
      )}

      {/* ---- why this looks the way it does ----
          Layer 1 of the personalization model: say their own answers back to
          them. Added this batch alongside the router changes it depends on
          (gap badges, pacing) — a sentence claiming the plan adapted to you
          is only honest once something in the plan actually did, which is
          why these two ship together rather than this one first. */}
      {plan.spineApplies && (
        <div className="p-5 rounded-2xl mb-8" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${C.beige}` }}>
          <p className="text-[12px] font-extrabold uppercase tracking-widest mb-2" style={{ color: C.gold }}>Why this looks the way it does</p>
          <p className="text-[16px] leading-relaxed" style={{ color: C.ink }}>
            You told us {plan.gapLabel} — whichever step ahead is marked <b style={{ color: "#0F6B3F" }}>&quot;Closes your gap&quot;</b>{" "}
            is written as the direct answer to that. The rest still come up in their turn too — they&apos;re just not the specific thing you said was missing, so most people move through them quickly.
            {plan.paceNote ? ` And ${plan.paceNote}` : ""}
          </p>
          {/* Said plainly rather than left for someone to notice on their own:
              "stuck" still opens on the same first step as everyone else on
              this path, and that is easy to read as the plan not having
              listened. It listened — the reason is that most stalls this
              specific library was written against trace back to an offer
              that wasn't quite specific enough, so step one is a fast
              confirmation for someone who's stuck, not a restart from zero.
              And the honest exit for the person who's certain that part is
              already solid: say so below, to a real person, rather than the
              page pretending to route around it on its own. */}
          {plan.gap === "stuck" && (
            <p className="text-[16px] leading-relaxed mt-3" style={{ color: C.ink }}>
              That&apos;s also why the first step is the same one everyone on this path gets, even though you&apos;re not starting from zero: almost every &quot;I&apos;m stuck&quot; this walkthrough hears about traces back to an offer that wasn&apos;t specific enough yet, so step one here is a quick confirmation, not a rebuild. If you&apos;re already sure that part is solid, tell us exactly where you&apos;re stuck using the box at the bottom of this page — a real person reads it and can point you at the real jump-in step directly.
            </p>
          )}
          {plan.protectTone && (
            <p className="text-[16px] leading-relaxed mt-3" style={{ color: C.ink }}>{plan.protectTone}</p>
          )}
        </div>
      )}

      {/* ---- we borrowed a spine, and we say so ----
          This page used to be empty for anyone whose path has no written
          walkthrough. It now walks their fastest win instead. That is a
          defensible thing to do and an indefensible thing to do quietly:
          the person chose a goal, and the heading above now names a
          different one. This block is what keeps that honest. */}
      {plan.borrowed && p && (
        <div className="p-5 rounded-2xl mb-8" style={{ backgroundColor: C.yellowSoft, border: "1px solid #EAD9A8" }}>
          <p className="text-[16px] leading-relaxed" style={{ color: C.ink }}>
            {/* One template literal, deliberately. Interleaving {expr} with JSX
                text produced "Content Creationis still the goal" on the live
                page — the same swallowed-space class that bit this codebase in
                v9. A single string is one text node and cannot lose a space. */}
            <b>{`Why this says ${w.name} when you chose ${p.name}:`}</b>{" "}
            {`${p.name} is still the goal — but the steps for it aren't written yet, and we're not going to hand you the wrong plan to look complete. ${w.name} is your fastest first win, and it's the one that pays for the months ${p.name.toLowerCase()} takes to ramp. So this is the funding half of your plan, in full. Your own ${p.name.toLowerCase()} moves are still on your results page, and they haven't changed.`}
          </p>
        </div>
      )}

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

      {/* Everything finished. Rare, and worth marking properly rather than
          letting the page just end. */}
      {plan.stepCount > 0 && !nextUp && !overridePlay && (
        <div className="p-6 rounded-2xl mb-8" style={{ backgroundColor: C.green }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#C7B27A" }}>All of it</p>
          <h2 className="font-display text-[24px] leading-snug mb-2" style={{ color: C.cream }}>
            You finished every step we&apos;ve written.
          </h2>
          <p className="text-[16px] leading-relaxed" style={{ color: "#D6E2DA" }}>
            Tell us what happened — what worked, what didn&apos;t, what you needed and couldn&apos;t find. At this point
            you know things about this path that we don&apos;t.
          </p>
        </div>
      )}

      {/* ---- one task at a time (Sep 6 batch) ----
          This used to be a page of every phase and every step, all rendered
          at once, collapsed but still there to scroll past — the "wall of
          text" the Sep 6 conversation named directly, worse on a phone where
          reaching the one card that matters meant scrolling through steps
          that were either already done or weeks away. It's replaced with
          exactly one step: `activePlay`, either the next one not yet ticked
          or, if a check-in routed the person back to an earlier step,
          that one instead. Nothing not-yet-reached is shown at all — the
          library's own "every step still appears" guarantee (see gap
          comment in router.js) is about what the PLAN contains, not what's
          on screen at once; nothing is removed, it just isn't rendered
          before its turn. */}
      {activePlay && (() => {
        const activePhase = plan.phases.find((ph) => ph.plays.some((pl) => pl.id === activePlay.id));
        const pct = plan.stepCount ? Math.round((doneCount / plan.stepCount) * 100) : 0;
        return (
          <>
            <div className="p-6 rounded-2xl mb-4" style={{ backgroundColor: C.green }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#C7B27A" }}>
                {overridePlay ? "Back to fix this one" : doneCount > 0 ? "Pick up here" : "Start here"}
              </p>
              <h2 className="font-display text-[24px] leading-snug mb-2" style={{ color: C.cream }}>{activePlay.name}</h2>
              <p className="text-[16px] leading-relaxed" style={{ color: "#D6E2DA" }}>
                {activePlay.week && plan.totalWeeks ? `Week ${activePlay.week} of ${plan.totalWeeks}` : `Step ${activeIndex + 1} of ${plan.stepCount}`}
                {" · "}{doneCount} of {plan.stepCount} steps done
                {activePhase?.opensWhen ? ` · this window opened once you had ${factLabel(activePhase.opensWhen)}` : ""}
              </p>
            </div>

            <div className="mb-6">
              <div className="w-full h-1.5 rounded-full overflow-hidden mb-2" style={{ backgroundColor: C.beige }}>
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: C.green }} />
              </div>
              {overridePlay && (
                <button onClick={() => setActiveOverrideId(null)} className="press text-[13px] font-semibold underline underline-offset-2"
                  style={{ color: C.gold }}>
                  ← Back to my current step{nextUp ? ` (${nextUp.name})` : ""}
                </button>
              )}
            </div>

            <PlayCard play={activePlay} standalone
              steps={steps} onToggle={onToggle} onOutcome={onOutcome} onSignal={onSignal} onGoto={onGoto} renderedIds={renderedIds}
              planPathId={plan.pathId} planGap={plan.gap} ids={ids} />

            {/* Finished steps never disappear — they're just not in the way.
                One line each, closed by default, so looking back at what you
                already did is a choice, not something the page makes you
                wade through to reach today's step. */}
            {doneSoFar.length > 0 && (
              <div className="mt-6 mb-9">
                <button onClick={() => setHistoryOpen(!historyOpen)} className="press text-[14px] font-semibold underline underline-offset-2"
                  style={{ color: C.gray }}>
                  {historyOpen ? "Hide" : "Show"} the {doneSoFar.length} step{doneSoFar.length === 1 ? "" : "s"} you&apos;ve already finished
                </button>
                {historyOpen && (
                  <div className="mt-3">
                    {doneSoFar.map((pl) => (
                      <div key={pl.id} className="flex items-center gap-3 py-2.5 px-4 rounded-xl mb-1.5" style={{ backgroundColor: C.greenSoft }}>
                        <span aria-hidden="true" style={{ color: "#0F6B3F" }}>✓</span>
                        <span className="text-[15px] flex-1" style={{ color: C.ink }}>{pl.name}</span>
                        {pl.week ? <span className="text-[12px]" style={{ color: C.gray }}>Week {pl.week}</span> : null}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        );
      })()}

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

      {/* ---- help that exists ----
          Wrapped in <Gate> deliberately, per claude/faimgo-money-seams.md §3.3:
          allowance() always says yes today, so this renders exactly as it
          always has — but the mount/check/render path now runs on every
          real /plan view instead of sitting unexercised in Gate.js, which
          is the whole point of shipping a switched-off gate live. */}
      {plan.helpRail.length > 0 && (
        <Gate need="help_rail" fid={ids?.fid}>
          <section className="mb-9">
            <h2 className="font-display text-[26px] mb-1" style={{ color: C.green }}>When you get stuck</h2>
            <p className="text-[16px] leading-relaxed mb-4" style={{ color: C.gray }}>
              These aren&apos;t steps and they have no place in the order. Open one the day you need it — from any point in the plan.
            </p>
            {plan.helpRail.map((pl) => <RailCard key={pl.id} play={pl} forceOpen={pl.id === focusId} />)}
          </section>
        </Gate>
      )}

      {/* ---- help that does not exist yet ----
          Named as text, never as a control. The day these are real they move
          up into the rail above and this block disappears. */}
      {plan.notBuiltYet.length > 0 && (
        <div className="p-5 rounded-2xl mb-9" style={{ backgroundColor: "#FFFFFF", border: `1px dashed ${C.gray}` }}>
          <p className="text-[15px] leading-relaxed" style={{ color: C.gray }}>
            <b style={{ color: C.ink }}>Not built yet, and we&apos;d rather say so:</b>{" "}an always-open ask-anything box
            that already knows which step you&apos;re on. When a check-in above flags you&apos;re stuck, our AI already
            gives you a first-pass answer on the spot — there&apos;s just no general box yet to ask it anything, anytime.
            Until there is, deeper help below reaches a person, not a bot.
          </p>
          <p className="text-[15px] leading-relaxed mt-3" style={{ color: C.gray }}>
            Same for getting a person to help with a step. Several of these steps have a version where someone who has
            done it before does it with you — that&apos;s a real plan and it isn&apos;t built. Today it happens by hand:
            you tell us what you&apos;re stuck on, and we match you ourselves.
          </p>
        </div>
      )}

      {/* ---- the one real channel ----
          Sep 7 2026: reworded from "stuck on a step" to plain feedback —
          the per-step check-in above already owns "still stuck", and
          having this box ask the same question a second time made it read
          as a duplicate instead of a genuinely different thing. This box
          is for what the check-ins don't cover: a gap in the product
          itself — a step that's wrong, missing, or an idea for something
          we should have. See api/feedback/route.js's own comment on
          FEEDBACK_WEBHOOK_URL for where this actually goes (a Sheet, read
          by the weekly feedback-analysis pass). Still `kind="contact"` —
          its categories (A question / An idea / Something's off / Other)
          already fit "tell us what's missing" without changing the widget
          itself, only the copy around it. */}
      <div className="p-7 rounded-2xl text-center mb-8" style={{ backgroundColor: "#FFFFFF", border: `2px solid ${C.green}` }}>
        <h3 className="font-display text-[22px] mb-2" style={{ color: C.green }}>Something we should know?</h3>
        <p className="text-[15px] leading-relaxed mb-4" style={{ color: C.gray }}>
          Not a step check-in — this is feedback on Faimgo itself: what&apos;s missing, what&apos;s wrong, what you wish existed. A real person reads every one.
        </p>
        <FeedbackWidget trigger="cta" kind="contact" context={"plan:" + (plan.pathId || "none")} navLabel="Give feedback" />
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
