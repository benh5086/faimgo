"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { session, loadSaved, getAccountSession, setAccountSession, clearAccountSession } from "../../lib/store.js";
import { track } from "../../lib/track.js";
import { pathById } from "../../lib/paths.js";
import Avatar from "../Avatar.js";

/* "Working on: X" — derived from this device's own most-recently-active
   plan, never typed by hand (see claude/faimgo-profile-scope-sep6.md).
   `results.chosen` is the path someone named directly; `results.fastestWin`
   is the fallback used when computeResults() couldn't match one (see
   assessment/page.js's computeResults()). Returns null rather than
   guessing when neither is present — a profile with no headline is
   honest; a wrong one is not. */
function headlineFromLocalPlan() {
  try {
    const saved = loadSaved();
    const results = saved?.plan?.results;
    if (!results) return null;
    const pathId = results.chosen || results.fastestWin;
    if (!pathId) return null;
    const p = pathById(pathId);
    return p ? `Working on: ${p.name}` : null;
  } catch (e) {
    return null;
  }
}

/*
  FAIMGO — ACCOUNT (/account)

  The private "home" — see claude/faimgo-profile-scope-sep6.md for the full
  reasoning. Deliberately separate from /restore even though the underlying
  magic-link mechanics are shared: restore is about getting YOUR OWN plans
  back, this is about the public-facing half (display name, bio) that
  someone else can eventually see via /u/[id]. Conflating the two into one
  page would blur a distinction worth keeping clear in the code even though
  a person may go through both in the same sitting.

  Same deliberately-plain UX as /restore: no loading skeleton, no clever
  redirect timing — a stuck person reading a plain sentence is better than a
  blank screen that might be doing something.

  Two ways to land here:
    /account              — no token: if this device already has a session
                             (getAccountSession), skip straight to the edit
                             form; otherwise show the "enter your email" form.
    /account?token=...    — a token from the emailed link: verify it
                             automatically, no button to press.
*/

const C = {
  cream: "#F1F4F2", green: "#1B3A2D", gold: "#8A6A14", beige: "#E4E8E5",
  gray: "#464C54", ink: "#15181B", greenSoft: "#E4EEE9", yellowSoft: "#FBF3DE",
};

function fmtMonthYear(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } catch (e) {
    return "";
  }
}

export default function Account() {
  const [ids, setIds] = useState({ fid: null, sid: null });
  const [token, setToken] = useState(null);
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [view, setView] = useState("checking"); // checking | ask | requesting | sent | verifying | ready | failed
  const [sessionInfo, setSessionInfo] = useState(null); // { personId, editSessionToken }
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ username: "", bio: "", firstName: "", middleName: "", lastName: "" });
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved | error:taken | error:required | error

  useEffect(() => {
    const s = session();
    setIds({ fid: s.fid, sid: s.sid });

    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (t) {
      setToken(t);
      setView("verifying");
      return;
    }

    const existing = getAccountSession();
    if (existing) {
      setSessionInfo(existing);
      setView("ready");
    } else {
      setView("ask");
    }
  }, []);

  // Fetch profile data once we know which person this is (fresh verify, or
  // an existing session found on mount).
  useEffect(() => {
    if (view !== "ready" || !sessionInfo?.personId) return;
    (async () => {
      try {
        const res = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // editSessionToken is included here (not just on "update") so the
          // server can prove this is the profile's owner, not a stranger
          // with a link, and hand back the private name fields too — see
          // api/profile/route.js's "get" action and sql/003_names.sql.
          body: JSON.stringify({ action: "get", personId: sessionInfo.personId, editSessionToken: sessionInfo.editSessionToken }),
        });
        const data = await res.json().catch(() => ({}));
        if (data?.ok && data.profile) {
          setProfile(data.profile);
          setForm({
            username: data.profile.username || "",
            bio: data.profile.bio || "",
            firstName: data.profile.firstName || "",
            middleName: data.profile.middleName || "",
            lastName: data.profile.lastName || "",
          });
        }
      } catch (e) { /* the edit form still works with blank defaults */ }
    })();
  }, [view, sessionInfo]);

  useEffect(() => {
    if (view !== "verifying" || !token || !ids.fid) return;
    (async () => {
      try {
        const res = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verify", token, fid: ids.fid }),
        });
        const data = await res.json().catch(() => ({}));
        if (data?.ok && data.personId && data.editSessionToken) {
          setAccountSession(data.personId, data.editSessionToken);
          setSessionInfo({ personId: data.personId, editSessionToken: data.editSessionToken });
          setView("ready");
          track(ids, "account_verified");
        } else {
          setView("failed");
          track(ids, "account_failed");
        }
      } catch (e) {
        setView("failed");
        track(ids, "account_failed");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, token, ids.fid]);

  async function submitRequest() {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!ok) { setEmailErr("Enter your email."); return; }
    setEmailErr("");
    setView("requesting");
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", email, fid: ids.fid }),
      });
    } catch (e) { /* same neutral outcome either way — see /restore for why */ }
    setView("sent");
    track(ids, "account_requested");
  }

  async function saveProfile() {
    if (!sessionInfo?.editSessionToken) return;
    // First name, last name, and "Your Faimgo name" are required — added
    // Sep 7 2026 so the account page always has a real name to show at the
    // top instead of ever needing to show the person's email (see
    // sql/003_names.sql). Middle name stays optional on purpose — most
    // people don't use one, and no comparable signup flow requires it.
    if (!form.firstName.trim() || !form.lastName.trim() || !form.username.trim()) {
      setSaveState("error:required");
      return;
    }
    setSaveState("saving");
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          editSessionToken: sessionInfo.editSessionToken,
          username: form.username,
          bio: form.bio,
          firstName: form.firstName,
          middleName: form.middleName,
          lastName: form.lastName,
          headline: headlineFromLocalPlan(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.ok) {
        setSaveState("saved");
        setProfile((p) => (p ? { ...p, username: form.username || null, bio: form.bio || null } : p));
      } else if (data?.reason === "taken") {
        setSaveState("error:taken");
      } else {
        setSaveState("error");
      }
    } catch (e) {
      setSaveState("error");
    }
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
        {view === "checking" && (
          <p className="text-[17px]" style={{ color: C.ink }}>One moment…</p>
        )}

        {view === "ask" && (
          <>
            <h1 className="font-display text-3xl mb-4" style={{ color: C.green }}>Your account</h1>
            <p className="text-[17px] leading-relaxed mb-6" style={{ color: C.ink }}>
              Enter the email you used on Faimgo and we&apos;ll send you a link in. You&apos;ll only
              need to do this once — after that, this browser remembers you.
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
              If that email has a Faimgo account, a link just went out to it — check your inbox
              (and spam) for the next few minutes. The link works once and expires in 30 minutes.
            </p>
          </div>
        )}

        {view === "verifying" && (
          <p className="text-[17px]" style={{ color: C.ink }}>Checking your link…</p>
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

        {view === "ready" && (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <Avatar name={form.username || "Faimgo Member"} size={64} />
              <div>
                {/* The username is the FIRST thing shown, above anything else —
                    added Sep 7 2026 so it's always unmistakable which account
                    is loaded on this device, without ever needing to show an
                    email address. Falls back to a plain prompt only in the
                    narrow window before the very first save. */}
                <p className="text-[12px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: C.gray }}>Your account</p>
                <h1 className="font-display text-2xl" style={{ color: C.green }}>{profile?.username || "Set up your profile"}</h1>
                {profile?.headline && (
                  <p className="text-[14px] font-medium" style={{ color: C.gold }}>{profile.headline}</p>
                )}
                {profile?.memberSince && (
                  <p className="text-[14px]" style={{ color: C.gray }}>Member since {fmtMonthYear(profile.memberSince)}</p>
                )}
              </div>
            </div>

            {profile && (
              <div className="flex gap-6 mb-6 p-4 rounded-xl" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${C.beige}` }}>
                <div>
                  <p className="text-[22px] font-bold" style={{ color: C.green }}>{profile.completedCount}</p>
                  <p className="text-[13px]" style={{ color: C.gray }}>steps completed</p>
                </div>
                <div>
                  <p className="text-[22px] font-bold" style={{ color: C.green }}>
                    {profile.ratingAvg != null ? `${profile.ratingAvg}★` : "—"}
                  </p>
                  <p className="text-[13px]" style={{ color: C.gray }}>
                    {profile.reviewCount > 0 ? `${profile.reviewCount} review${profile.reviewCount === 1 ? "" : "s"}` : "no reviews yet"}
                  </p>
                </div>
              </div>
            )}

            {/* First/last/middle name — added Sep 7 2026 (sql/003_names.sql).
                Real name, kept private: never returned by getPublicProfile,
                never shown on /u/[id] — this is for Ben's own records, not a
                public field. First and last are required; middle isn't —
                most people don't use one, and no comparable signup flow
                requires it. */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[14px] font-semibold mb-1" style={{ color: C.ink }}>First name</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  placeholder="First name"
                  maxLength={60}
                  className="w-full px-4 py-3 rounded-xl text-[16px]"
                  style={{ border: `1px solid ${C.beige}`, backgroundColor: "#FFFFFF", color: C.ink }}
                />
              </div>
              <div>
                <label className="block text-[14px] font-semibold mb-1" style={{ color: C.ink }}>Last name</label>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  placeholder="Last name"
                  maxLength={60}
                  className="w-full px-4 py-3 rounded-xl text-[16px]"
                  style={{ border: `1px solid ${C.beige}`, backgroundColor: "#FFFFFF", color: C.ink }}
                />
              </div>
            </div>

            <label className="block text-[14px] font-semibold mb-1" style={{ color: C.ink }}>Middle name (optional)</label>
            <input
              type="text"
              value={form.middleName}
              onChange={(e) => setForm((f) => ({ ...f, middleName: e.target.value }))}
              placeholder="Middle name"
              maxLength={60}
              className="w-full px-4 py-3 rounded-xl text-[16px] mb-4"
              style={{ border: `1px solid ${C.beige}`, backgroundColor: "#FFFFFF", color: C.ink }}
            />

            <label className="block text-[14px] font-semibold mb-1" style={{ color: C.ink }}>Your Faimgo name</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="Pick anything — this is what shows on your profile"
              maxLength={40}
              className="w-full px-4 py-3 rounded-xl text-[16px] mb-4"
              style={{ border: `1px solid ${C.beige}`, backgroundColor: "#FFFFFF", color: C.ink }}
            />

            <label className="block text-[14px] font-semibold mb-1" style={{ color: C.ink }}>About you (optional)</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="A line or two — what you're working on, what you're about."
              maxLength={500}
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-[15px] mb-4"
              style={{ border: `1px solid ${C.beige}`, backgroundColor: "#FFFFFF", color: C.ink }}
            />

            <button
              onClick={saveProfile}
              disabled={saveState === "saving"}
              className="px-6 py-3 press rounded-full font-semibold text-[15px]"
              style={{ backgroundColor: C.green, color: C.cream, opacity: saveState === "saving" ? 0.6 : 1 }}
            >
              {saveState === "saving" ? "Saving…" : "Save"}
            </button>
            {saveState === "saved" && <span className="ml-3 text-[14px]" style={{ color: C.green }}>Saved.</span>}
            {saveState === "error:taken" && <span className="ml-3 text-[14px]" style={{ color: "#9C3B2E" }}>That Faimgo name is taken — try another.</span>}
            {saveState === "error:required" && <span className="ml-3 text-[14px]" style={{ color: "#9C3B2E" }}>First name, last name, and a Faimgo name are all required.</span>}
            {saveState === "error" && <span className="ml-3 text-[14px]" style={{ color: "#9C3B2E" }}>Couldn&apos;t save — try again.</span>}

            {sessionInfo?.personId && (
              <div className="mt-8 pt-6" style={{ borderTop: `1px solid ${C.beige}` }}>
                <p className="text-[14px] mb-2" style={{ color: C.gray }}>Your shareable profile:</p>
                <Link href={`/u/${sessionInfo.personId}`} className="text-[15px] font-medium underline" style={{ color: C.green }}>
                  faimgo.com/u/{sessionInfo.personId}
                </Link>
              </div>
            )}

            <div className="mt-8">
              <Link href="/plan" className="text-[14px] underline" style={{ color: C.gray }}>Back to my plan</Link>
              <button
                onClick={() => { clearAccountSession(); setSessionInfo(null); setProfile(null); setView("ask"); }}
                className="ml-6 text-[14px] underline"
                style={{ color: C.gray }}
              >
                Sign out of this device
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
