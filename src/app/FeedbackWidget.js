"use client";

import { useState, useEffect } from "react";

/*
  FeedbackWidget — two jobs, one component.

  kind="feedback"  → rate the plan you just got (used on the assessment results page)
  kind="contact"   → "How can we help?" catch-all: questions, ideas, bug reports
                     (used in the header nav + footer)

  trigger controls the entry point:
    "inline" → an inviting card (results page)
    "nav"    → a nav-style link (light text, for the dark header)
    "link"   → a quiet muted link (footer)

  Posts to /api/feedback with auto-context (page, result, timestamp).
*/

const C = {
  white: "#FFFFFF",
  tint: "#F1F4F2",
  line: "#E4E8E5",
  green: "#1B3A2D",
  ink: "#15181B",
  body: "#464C54",
  greenSoft: "#E4EEE9",
  mintText: "#0F6B3F",
};

const RATINGS = [
  { t: "Not helpful", v: 1 },
  { t: "Somewhat", v: 3 },
  { t: "Very helpful", v: 5 },
];

const CATEGORIES = ["A question", "An idea", "Something's off", "Other"];

export default function FeedbackWidget({ trigger = "link", kind = "feedback", context = "general", navLabel = "Contact" }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const isContact = kind === "contact";

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") setOpen(false); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const canSend = isContact ? !!message.trim() : (!!message.trim() || !!rating);

  async function submit() {
    if (!canSend) return;
    setBusy(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          rating: rating || undefined,
          category: category || undefined,
          message: message.trim() || undefined,
          email: email.trim() || undefined,
          context,
          page: typeof window !== "undefined" ? window.location.pathname : undefined,
          ts: new Date().toISOString(),
        }),
        keepalive: true,
      });
    } catch (e) { /* never block the user on a network hiccup */ }
    setBusy(false);
    setSent(true);
  }

  function close() {
    setOpen(false);
    setTimeout(() => { setRating(0); setCategory(""); setMessage(""); setEmail(""); setSent(false); }, 200);
  }

  // ---- Trigger ----
  let triggerEl;
  if (trigger === "inline") {
    triggerEl = (
      <div className="text-center">
        <p className="text-[15px]" style={{ color: C.body }}>You just saw your plan — what would make it more useful?</p>
        <button onClick={() => setOpen(true)}
          className="press mt-3 inline-block px-6 py-2.5 rounded-full font-semibold text-[15px] hover:opacity-90"
          style={{ backgroundColor: C.tint, color: C.green, border: `1px solid ${C.line}` }}>
          Share a quick thought
        </button>
      </div>
    );
  } else if (trigger === "nav") {
    triggerEl = (
      <button onClick={() => setOpen(true)} className="text-[15px] font-medium transition-opacity hover:opacity-80" style={{ color: C.white }}>
        {navLabel}
      </button>
    );
  } else {
    triggerEl = (
      <button onClick={() => setOpen(true)} className="text-[14px] transition-opacity hover:opacity-80" style={{ color: "#9DB0A6" }}>
        {navLabel}
      </button>
    );
  }

  return (
    <>
      {triggerEl}

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(20,36,27,0.45)" }} onClick={close}>
          <div className="reveal-in w-full max-w-md rounded-2xl p-7"
            style={{ backgroundColor: C.white, boxShadow: "0 24px 60px -20px rgba(20,36,27,0.5)" }}
            onClick={(e) => e.stopPropagation()}>
            {sent ? (
              <div className="text-center py-4">
                <h3 className="font-display text-[24px] mb-2" style={{ color: C.green }}>
                  {isContact ? "Thanks for reaching out." : "Thank you."}
                </h3>
                <p className="text-[15px] leading-relaxed" style={{ color: C.body }}>
                  {isContact
                    ? "We read every message. If you left an email, we'll get back to you."
                    : "This genuinely helps us build a better Faimgo. Every note gets read."}
                </p>
                <button onClick={close}
                  className="press mt-5 px-6 py-2.5 rounded-full font-semibold text-[15px] hover:opacity-90"
                  style={{ backgroundColor: C.green, color: C.white }}>
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-display text-[24px]" style={{ color: C.green }}>
                    {isContact ? "How can we help?" : "Was your plan helpful?"}
                  </h3>
                  <button onClick={close} className="text-[14px] mt-1 transition-opacity hover:opacity-70" style={{ color: C.body }}>Close</button>
                </div>
                <p className="text-[14px] mb-5" style={{ color: C.body }}>
                  {isContact
                    ? "A question, an idea, something not working — anything at all. We read every message."
                    : "Help us make Faimgo better for you. One tap, and a sentence if you have one."}
                </p>

                {isContact ? (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {CATEGORIES.map((c) => (
                      <button key={c} onClick={() => setCategory(category === c ? "" : c)}
                        className="px-3.5 py-2 rounded-full text-[14px] font-medium border-2 transition-all"
                        style={{
                          borderColor: category === c ? C.green : C.line,
                          backgroundColor: category === c ? C.greenSoft : C.white,
                          color: category === c ? C.mintText : C.body,
                        }}>
                        {c}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-2 mb-5">
                    {RATINGS.map((r) => (
                      <button key={r.v} onClick={() => setRating(rating === r.v ? 0 : r.v)}
                        className="flex-1 px-3 py-2.5 rounded-xl text-[14px] font-semibold border-2 transition-all"
                        style={{
                          borderColor: rating === r.v ? C.green : C.line,
                          backgroundColor: rating === r.v ? C.greenSoft : C.white,
                          color: rating === r.v ? C.mintText : C.body,
                        }}>
                        {r.t}
                      </button>
                    ))}
                  </div>
                )}

                <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder={isContact ? "What's on your mind?" : "What would make this plan more useful?"}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 text-[16px] resize-none"
                  style={{ borderColor: C.line, backgroundColor: C.white, color: C.ink }} />

                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder={isContact ? "Email (so we can reply)" : "Email (optional — if you'd like a reply)"}
                  className="w-full mt-3 px-4 py-3 rounded-xl border-2 text-[16px]"
                  style={{ borderColor: C.line, backgroundColor: C.white, color: C.ink }} />

                <button onClick={submit} disabled={busy || !canSend}
                  className="press w-full mt-5 px-6 py-3 rounded-full font-semibold text-[16px] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: C.green, color: C.white }}>
                  {busy ? "Sending…" : (isContact ? "Send message" : "Send feedback")}
                </button>
                <p className="text-[12px] mt-3 text-center" style={{ color: C.body }}>
                  No account needed. Your note goes straight to the team.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
