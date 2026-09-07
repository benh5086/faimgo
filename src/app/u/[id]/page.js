"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Avatar from "../../Avatar.js";
import AccountLink from "../../AccountLink";

/*
  FAIMGO — PUBLIC PROFILE (/u/[id])

  See claude/faimgo-profile-scope-sep6.md. Reachable only by direct link —
  not listed, not searchable, no directory anywhere links here yet. This is
  deliberate: matching is still Ben, by hand, per the standing "cohorts, not
  a feed" rule (faimgo-operating-model.md) — this page exists so the very
  first manually-brokered match has somewhere real to send the other party,
  not so strangers can browse.

  Shows exactly two kinds of thing, and the distinction is the whole point
  of this batch: the self-entered layer (display name, headline, bio) reads
  as a home, not a claim; the platform-generated layer (completed steps,
  rating) is what a stranger should actually weigh — see the file's own
  design note in db.js's getPublicProfile for why rating is omitted rather
  than shown as 0 when nobody has reviewed yet.

  Uses useParams() (needs no <Suspense> wrapper, unlike useSearchParams())
  since `id` is a path segment, not a query string — same reasoning
  /plan's own header comment gives for reading its query string manually
  instead of using the hook family that would need one.
*/

const C = {
  cream: "#F1F4F2", green: "#1B3A2D", gold: "#8A6A14", beige: "#E4E8E5",
  gray: "#464C54", ink: "#15181B",
};

function fmtMonthYear(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } catch (e) {
    return "";
  }
}

export default function PublicProfile() {
  const params = useParams();
  const id = params?.id;
  const [state, setState] = useState({ loading: true, profile: null, notFound: false });

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get", personId: id }),
        });
        const data = await res.json().catch(() => ({}));
        if (data?.ok && data.profile) {
          setState({ loading: false, profile: data.profile, notFound: false });
        } else {
          setState({ loading: false, profile: null, notFound: true });
        }
      } catch (e) {
        setState({ loading: false, profile: null, notFound: true });
      }
    })();
  }, [id]);

  return (
    <main className="min-h-screen font-sans" style={{ backgroundColor: C.cream }}>
      <div style={{ backgroundColor: C.green }} className="px-8 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold tracking-tight" style={{ color: "#FFFFFF" }}>
          faim<span style={{ color: "#D2A54A" }}>go</span>
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/" className="text-[15px] font-medium" style={{ color: "#FFFFFF" }}>Back to Faimgo</Link>
          <AccountLink />
        </div>
      </div>

      <div className="max-w-[560px] mx-auto px-6 py-16">
        {state.loading && (
          <p className="text-[17px]" style={{ color: C.ink }}>Loading…</p>
        )}

        {!state.loading && state.notFound && (
          <div className="p-5 rounded-2xl" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${C.beige}` }}>
            <p className="text-[16px] leading-relaxed" style={{ color: C.ink }}>
              This profile doesn&apos;t exist, or the link isn&apos;t right.
            </p>
          </div>
        )}

        {!state.loading && state.profile && (
          <div>
            <div className="flex items-center gap-4 mb-6">
              <Avatar name={state.profile.username || "Faimgo Member"} size={72} />
              <div>
                <h1 className="font-display text-2xl" style={{ color: C.green }}>
                  {state.profile.username || "A Faimgo member"}
                </h1>
                {state.profile.headline && (
                  <p className="text-[14px] font-medium" style={{ color: C.gold }}>{state.profile.headline}</p>
                )}
                {state.profile.memberSince && (
                  <p className="text-[13px]" style={{ color: C.gray }}>Member since {fmtMonthYear(state.profile.memberSince)}</p>
                )}
              </div>
            </div>

            <div className="flex gap-6 mb-6 p-4 rounded-xl" style={{ backgroundColor: "#FFFFFF", border: `1px solid ${C.beige}` }}>
              <div>
                <p className="text-[22px] font-bold" style={{ color: C.green }}>{state.profile.completedCount}</p>
                <p className="text-[13px]" style={{ color: C.gray }}>steps completed</p>
              </div>
              <div>
                <p className="text-[22px] font-bold" style={{ color: C.green }}>
                  {state.profile.ratingAvg != null ? `${state.profile.ratingAvg}★` : "—"}
                </p>
                <p className="text-[13px]" style={{ color: C.gray }}>
                  {state.profile.reviewCount > 0
                    ? `${state.profile.reviewCount} review${state.profile.reviewCount === 1 ? "" : "s"}`
                    : "no reviews yet"}
                </p>
              </div>
            </div>

            {state.profile.bio && (
              <p className="text-[16px] leading-relaxed" style={{ color: C.ink }}>{state.profile.bio}</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
