"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { session, mergeRestoredPlans } from "../../lib/store.js";
import { track } from "../../lib/track.js";

/*
  FAIMGO — RESTORE (/restore)

  "Already did this? Get your plan back." The entry point for someone on a
  device that doesn't recognise them — a new phone, a cleared browser, a
  different computer. This is a ONE-TIME bridge per device, not a login
  someone has to repeat: click the emailed link once, and this browser
  remembers the same way it already remembers fid on every other page (see
  store.js's linkedEmail). Nobody should ever need to open this page twice
  on the same device.

  Two ways to land here:
    /restore              — no token: show the "enter your email" form.
    /restore?token=...    — a token from the emailed link: verify it
                             automatically, no button to press.

  Written deliberately without a loading skeleton or clever redirect timing —
  a stuck person on a plain "checking your link…" sentence is better than a
  blank screen that might be doing something.
*/

const C = {
  cream: "#F1F4F2", green: "#1B3A2D", gold: "#8A6A14", beige: "#E4E8E5",
  gray: "#464C54", ink: "#15181B", greenSoft: "#E4EEE9", yellowSoft: "#FBF3DE",
};

export default function Restore() {
  const [ids, setIds] = useState({ fid: null, sid: null });
  const [token, setToken] = useState(null);
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [view, setView] = useState("ask"); // ask | requesting | sent | verifying | success | failed
  const [restoredCount, setRestoredCount] = useState(0);

  useEffect(() => {
    const s = session();
    setIds({ fid: s.fid, sid: s.sid });
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      setToken(t);
      setView("verifying");
    }
  }, []);

  // Runs once ids and token are both known — verifying needs the device's
  // own fid so this browser can be linked, not just the token.
  useEffect(() => {
    if (view !== "verifying" || !token || !ids.fid) return;
    (async () => {
      try {
        const res = await fetch("/api/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verify", token, fid: ids.fid }),
        });
        const data = await res.json().catch(() => ({}));
        if (data?.ok) {
          const count = mergeRestoredPlans(data.plans || [], data.email || "");
          setRestoredCount(typeof count === "number" ? count : 0);
          setView("success");
          track(ids, "restore_verified");
        } else {
          setView("failed");
          track(ids, "restore_failed");
        }
      } catch (e) {
        setView("failed");
        track(ids, "restore_failed");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, token, ids.fid]);

  async function submitRequest() {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!ok) { setEmailErr("Enter the email you used before."); return; }
    setEmailErr("");
    setView("requesting");
    try {
      await fetch("/api/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", email, fid: ids.fid }),
      });
    } catch (e) {
      /* Same neutral outcome either way — see the file header on why the
         request endpoint never reveals success/failure by shape, and the
         same honesty applies here: we don't know if it worked, so we say
         the same thing we'd say if it did. */
    }
    setView("sent");
    track(ids, "restore_requested");
  }

  return (
    <main className="min-h-screen font-sans" style={{ backgroundColor: C.cream }}>
      <div style={{ backgroundColor: C.green }} className="px-8 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tight" style={{ color: "#FFFFFF" }}>
          faim<span style={{ color: "#D2A54A" }}>go</span>
        </Link>
        <Link href="/" className="text-[15px] font-medium" style={{ color: "#FFFFFF" }}>Back to Faimgo</Link>
      </div>

      <div className="max-w-[560px] mx-auto px-6 py-16">
        {view === "ask" && (
          <>
            <h1 className="font-display text-3xl mb-4" style={{ color: C.green }}>Get your plan back</h1>
            <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.ink }}>
              On a new device, or cleared your browser? Enter the email you used before and we&apos;ll
              send a link that brings your plans over. You&apos;ll only need to do this once — after
              that, this browser remembers you the same as any other.
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl text-[16px] mb-2"
              style={{ border: `1px solid ${C.beige}`, backgroundColor: "#FFFFFF", color: C.ink }}
            />
            {emailErr && <p className="text-[14px] mb-3" style={{ color: "#9C3B2E" }}>{emailErr}</p>}
            <button
              onClick={submitRequest}
              className="mt-2 px-6 py-3 press rounded-full font-semibold text-[15px]"
              style={{ backgroundColor: C.green, color: C.cream }}
            >
              Send me the link
            </button>
          </>
        )}

        {view === "requesting" && (
          <p className="text-[17px]" style={{ color: C.ink }}>Sending…</p>
        )}

        {view === "sent" && (
          <div className="p-5 rounded-2xl" style={{ backgroundColor: C.greenSoft }}>
            <p className="text-[16px] leading-relaxed" style={{ color: C.green }}>
              If that email has plans with us, a link just went out to it — check your inbox (and
              spam) for the next few minutes. The link works once and expires in 30 minutes.
            </p>
          </div>
        )}

        {view === "verifying" && (
          <p className="text-[17px]" style={{ color: C.ink }}>Checking your link…</p>
        )}

        {view === "success" && (
          <div>
            <h1 className="font-display text-3xl mb-4" style={{ color: C.green }}>You&apos;re all set</h1>
            <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.ink }}>
              {restoredCount > 0
                ? `Brought ${restoredCount} plan${restoredCount === 1 ? "" : "s"} over to this device.`
                : "This browser is linked — no plans were on record for that email yet."}
              {" "}This browser will remember you from now on, same as before.
            </p>
            <Link href="/plan" className="inline-block px-6 py-3 press rounded-full font-semibold text-[15px]" style={{ backgroundColor: C.green, color: C.cream }}>
              Open my plan
            </Link>
          </div>
        )}

        {view === "failed" && (
          <div>
            <div className="p-5 rounded-2xl mb-6" style={{ backgroundColor: C.yellowSoft, border: `1px solid #EAD9A8` }}>
              <p className="text-[16px] leading-relaxed" style={{ color: C.ink }}>
                That link didn&apos;t work — it may have expired (links last 30 minutes) or already
                been used. Nothing was changed. Request a new one below.
              </p>
            </div>
            <button
              onClick={() => { setToken(null); setView("ask"); }}
              className="px-6 py-3 press rounded-full font-semibold text-[15px]"
              style={{ backgroundColor: C.green, color: C.cream }}
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
