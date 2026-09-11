"use client";

/* ============================================================
   FAIMGO — CoachChat (Phase 2, Sep 11 2026)

   The one shared multi-turn chat surface, used by BOTH coach entry points
   (the /plan "I'm stuck" seam and the assessment "something else" idea box).
   The interaction model lives ONLY here on purpose — so iterating it after
   Ben tests it is a one-file change, per
   claude/faimgo-phase2-multiturn-design.md.

   It talks to /api/coach with { kind: "chat" }, holds the running
   `messages` array, and persists every turn server-side (the route does the
   write; this component just carries the history). Everything degrades,
   never walls (coach-constraints.md rule 4): any {ok:false} — key not set,
   allowance spent, network, the model declining — renders an honest line and
   surfaces the real-person door, exactly like the rest of the product.

   The real-person hand-off (FeedbackWidget contact) is ALWAYS present and
   becomes the primary call to action the moment the coach itself says a
   person is the honest next move (reply.escalate), or the route hits its
   hard turn cap. An AI that keeps rephrasing itself is the exact experience
   Faimgo exists to fix (coach-constraints.md §3).
   ============================================================ */

import { useState, useRef, useEffect } from "react";
import FeedbackWidget from "./FeedbackWidget";
import { toolHref } from "../lib/affiliate.js";

const C = {
  green: "#1B3A2D",
  gold: "#8A6A14",
  beige: "#E4E8E5",
  gray: "#464C54",
  ink: "#15181B",
  cream: "#F1F4F2",
  greenSoft: "#E4EEE9",
  white: "#FFFFFF",
};

function newConversationId(surface) {
  const rand = Math.random().toString(36).slice(2, 10);
  return (surface || "chat") + "-" + Date.now().toString(36) + "-" + rand;
}

// Must match NUDGE_AT_TURNS in src/app/api/coach/route.js. After this many
// coach replies the coach gently nudges "go try it" — but the chat keeps
// working (the server is the source of truth for the live count; this is the
// starting estimate before the first reply comes back).
const NUDGE_AT = 7;

export default function CoachChat({
  fid = null,
  sid = null,
  personId = null,
  verified = false,      // true once the device has a VERIFIED /account session (getAccountSession) — no save nudge then
  emailEntered = false,  // true when an email is on file but NOT yet verified — nudge to VERIFY, not to add one
  surface = "plan",
  context = {},          // { path, gap, focusPlayId, planId, doneIds }
  initialMessages = [],  // [{ role: "user"|"coach", content, meta? }]
  toolTools = [],        // optional: the focus play's concrete.tools, so a named tool still links to its real site
  escalateContext = "",  // string label for the FeedbackWidget context
  placeholder = "Type what's going on…",
}) {
  const [convoId] = useState(() => newConversationId(surface));
  const [messages, setMessages] = useState(() => initialMessages.slice());
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending
  // Gentle countdown to the move-on nudge. Server returns the live value each
  // turn; this is the starting estimate from any seeded coach replies.
  const [turnsLeft, setTurnsLeft] = useState(() =>
    Math.max(0, NUDGE_AT - initialMessages.filter((m) => m.role === "coach").length)
  );
  const listRef = useRef(null);

  const lastCoach = [...messages].reverse().find((m) => m.role === "coach");
  const escalated = Boolean(lastCoach?.meta?.escalate);

  useEffect(() => {
    // keep the newest turn in view
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, status]);

  function toolLinkFor(name) {
    if (!name) return null;
    const at = (toolTools || []).find((t) => t.name === name)?.at || null;
    return toolHref(name, at);
  }

  async function send() {
    const text = input.trim();
    if (!text || status === "sending") return;
    const history = messages.concat([{ role: "user", content: text }]);
    setMessages(history);
    setInput("");
    setStatus("sending");

    let data;
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "chat",
          conversationId: convoId,
          surface,
          messages: history,
          path: context.path || null,
          gap: context.gap || null,
          focusPlayId: context.focusPlayId || null,
          planId: context.planId || null,
          doneIds: context.doneIds || [],
          fid,
          sid,
          personId,
        }),
      });
      data = await res.json();
    } catch (e) {
      data = { ok: false, reason: "network_error" };
    }

    if (data && data.ok && data.reply) {
      setMessages(history.concat([{ role: "coach", content: data.reply.message, meta: {
        toolName: data.reply.toolName || null,
        coverage: data.reply.coverage || null,
        escalate: Boolean(data.reply.escalate),
      } }]));
      if (typeof data.turnsLeft === "number") setTurnsLeft(data.turnsLeft);
    } else {
      // Honest degrade — never a wall. The message depends on WHY it stopped.
      // Per Ben (Sep 11): never name a dollar figure or a specific allowance;
      // frame it as "free so far, paid continuation coming, a person can help
      // now." And per coach-constraints.md rule 7, never claim a top-up button
      // that doesn't exist yet — "coming soon" is the honest framing.
      const reason = data?.reason || "network_error";
      let content;
      if (reason === "allowance_exhausted") {
        content =
          "You've used the free AI coaching for now — and the plan itself, plus everything you've done so far, stays free. Being able to top up and keep the coach going is something we're adding soon. Until then, tell us below and a real person can pick this up.";
      } else if (reason === "rate_limited") {
        content = "You're moving quick — give it a minute and send that again. Nothing's lost.";
      } else {
        content =
          "I can't reach the coach right now, but you're not stuck with a dead end. What you were working on still stands, and if you want a real person on this, use the box just below and someone will pick it up.";
      }
      setMessages(history.concat([{
        role: "coach",
        content,
        meta: { escalate: reason !== "rate_limited", degraded: true },
      }]));
    }
    setStatus("idle");
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="rounded-xl p-3" style={{ backgroundColor: C.white, border: `1px solid ${C.beige}` }}>
      {!verified && (
        <p className="text-[13px] mb-2 rounded-lg px-3 py-2" style={{ backgroundColor: C.cream, color: C.gray, border: `1px solid ${C.beige}` }}>
          {emailEntered
            ? <>Heads up: you&apos;ve entered your email but haven&apos;t verified it yet. Verify it (check your inbox, or &ldquo;My account&rdquo; up top) to keep this conversation — until then it&apos;s saved to this device only.</>
            : <>Heads up: this conversation is saved to this device only. Add your email up top (&ldquo;My account&rdquo;) to keep it — otherwise it&apos;s gone if you switch devices or clear your browser.</>}
        </p>
      )}
      <div ref={listRef} className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
        {messages.map((m, i) => {
          const mine = m.role === "user";
          const link = !mine && m.meta?.toolName ? toolLinkFor(m.meta.toolName) : null;
          return (
            <div key={i} className={"flex " + (mine ? "justify-end" : "justify-start")}>
              <div
                className="text-[15px] leading-relaxed rounded-2xl px-3 py-2"
                style={{
                  maxWidth: "88%",
                  backgroundColor: mine ? C.greenSoft : C.cream,
                  color: C.ink,
                  border: mine ? "none" : `1px solid ${C.beige}`,
                }}
              >
                <span style={{ whiteSpace: "pre-wrap" }}>{m.content}</span>
                {!mine && m.meta?.toolName && (
                  <span className="block text-[13px] mt-1" style={{ color: C.gray }}>
                    Tool:{" "}
                    {link ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel={link.isAffiliate ? "sponsored noopener" : "noopener"}
                        className="underline font-semibold"
                        style={{ color: C.gold }}
                      >
                        {m.meta.toolName}
                      </a>
                    ) : (
                      m.meta.toolName
                    )}
                  </span>
                )}
                {!mine && m.meta?.coverage === "partial" && !m.meta?.escalate && (
                  <span className="block text-[13px] mt-1" style={{ color: C.gray }}>
                    This only partly covers it — if it&apos;s not enough, a real person can pick it up below.
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {status === "sending" && (
          <div className="flex justify-start">
            <div className="text-[14px] px-3 py-2" style={{ color: C.gray }}>Thinking about your situation…</div>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder={placeholder}
          className="flex-1 resize-none rounded-lg px-3 py-2 text-[15px] outline-none"
          style={{ border: `1px solid ${C.beige}`, color: C.ink, backgroundColor: C.white }}
        />
        <button
          onClick={send}
          disabled={status === "sending" || !input.trim()}
          className="press rounded-lg px-4 py-2 text-[15px] font-bold"
          style={{
            backgroundColor: status === "sending" || !input.trim() ? C.beige : C.green,
            color: status === "sending" || !input.trim() ? C.gray : C.cream,
          }}
        >
          Send
        </button>
      </div>

      {/* Gentle countdown — the chat is bounded but never yanked away. */}
      <p className="text-[12px] mt-2" style={{ color: C.gray }}>
        {turnsLeft > 0
          ? `${turnsLeft} more ${turnsLeft === 1 ? "exchange" : "exchanges"} before I'll nudge you to go try it.`
          : "No rush, but the best move now is to go try it and come back — you can keep chatting if you need to."}
      </p>

      {/* The real-person door — always here, and made the primary CTA the
          moment the coach says a person is the honest next move. */}
      <div className="mt-3">
        {escalated && (
          <p className="text-[14px] font-semibold mb-2" style={{ color: C.green }}>
            A real person can take this from here:
          </p>
        )}
        <FeedbackWidget
          trigger="cta"
          kind="contact"
          context={"coachchat:" + surface + ":" + (escalateContext || context.focusPlayId || context.path || "")}
          navLabel={escalated ? "Get a real person on it" : "Rather have a person help? Tell us where you're at"}
        />
      </div>
    </div>
  );
}
