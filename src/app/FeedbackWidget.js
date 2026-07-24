"use client";

import { useState, useEffect } from "react";

/*
  FeedbackWidget — lightweight feedback capture.
  variant "inline"  → an inviting card (used on the assessment results page)
  variant "link"    → a quiet text link (used in the footer)
  Both open the same modal form. Posts to /api/feedback with auto-context.
*/

const C = {
  white: "#FFFFFF",
  tint: "#F1F4F2",
  line: "#E4E8E5",
  green: "#1B3A2D",
  ink: "#15181B",
  body: "#464C54",
  gold: "#8A6A14",
  greenSoft: "#E4EEE9",
  mintText: "#0F6B3F",
};

const RATINGS = [
  { t: "Not helpful", v: 1 },
  { t: "Somewhat", v: 3 },
  { t: "Very helpful", v: 5 },
];

export default function FeedbackWidget({ variant = "link", context = "general" }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") setOpen(false); }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const isResults = variant === "inline";

  async function submit() {
    if (!message.trim() && !rating) return;
    setBusy(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: rating || undefined,
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
    // reset after the modal fades so the next open is fresh
    setTimeout(() => { setRating(0); setMessage(""); setEmail(""); setSent(false); }, 200);
  }

  return (
    <>
      {isResults ? (
        <div className="p-6 rounded-2xl text-center" style={{ backgroundColor: C.white, border: `1px solid ${C.line}` }}>
          <p className="text-[15px]" style={{ color: C.body }}>
            Was this plan helpful? Tell us what would make it better.
          </p>
          <button onClick={() => setOpen(true)}
            className="press mt-3 inline-block px-6 py-2.5 rounded-full font-semibold text-[15px] hover:opacity-90"
            style={{ backgroundColor: C.tint, color: C.green, border: `1px solid ${C.line}` }}>
            Share a quick thought
          </button>
        </div>
      ) : (
        <button onClick={() => setOpen(true)}
          className="text-[14px] transition-opacity hover:opacity-80" style={{ color: "#9DB0A6" }}>
          Share feedback
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(20,36,27,0.45)" }} onClick={close}>
          <div className="reveal-in w-full max-w-md rounded-2xl p-7"
            style={{ backgroundColor: C.white, boxShadow: "0 24px 60px -20px rgba(20,36,27,0.5)" }}
            onClick={(e) => e.stopPropagation()}>
            {sent ? (
              <div className="text-center py-4">
                <h3 className="font-display text-[24px] mb-2" style={{ color: C.green }}>Thank you.</h3>
                <p className="text-[15px] leading-relaxed" style={{ color: C.body }}>
                  This genuinely helps us build a better Faimgo. Every note gets read.
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
                    {isResults ? "Was your plan helpful?" : "Share your feedback"}
                  </h3>
                  <button onClick={close} className="text-[14px] mt-1 transition-opacity hover:opacity-70" style={{ color: C.body }}>Close</button>
                </div>
                <p className="text-[14px] mb-5" style={{ color: C.body }}>
                  {isResults ? "One tap, and a sentence if you have one." : "What's working, what's missing, what you'd love to see."}
                </p>

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

                <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder={isResults ? "What would make this plan more useful?" : "What would make Faimgo better?"}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 text-[16px] resize-none"
                  style={{ borderColor: C.line, backgroundColor: C.white, color: C.ink }} />

                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email (optional — if you'd like a reply)"
                  className="w-full mt-3 px-4 py-3 rounded-xl border-2 text-[16px]"
                  style={{ borderColor: C.line, backgroundColor: C.white, color: C.ink }} />

                <button onClick={submit} disabled={busy || (!message.trim() && !rating)}
                  className="press w-full mt-5 px-6 py-3 rounded-full font-semibold text-[16px] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: C.green, color: C.white }}>
                  {busy ? "Sending…" : "Send feedback"}
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
