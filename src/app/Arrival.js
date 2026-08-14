"use client";

import { useEffect } from "react";
import { session } from "../lib/store.js";
import { track } from "../lib/track.js";

/*
  Arrival — the missing bottom of the funnel.

  WHY THIS FILE EXISTS, AND IT IS WORSE THAN IT SOUNDS.

  Until today the earliest event the product could emit was `start`, and
  `start` only fires when somebody has already reached /assessment AND pressed
  the button. Everyone who opened faimgo.com and left did not exist in our
  data. Not "showed as a bounce" — did not exist.

  So every conversion rate we could have quoted was measured from the wrong
  starting line: not "of the people who arrived, how many acted" but "of the
  people who had already decided to act, how many acted." That number can
  only ever look good, which is exactly what makes it dangerous.

  This component supplies the denominator. It does two things and nothing
  else:

  1. Fires `landed` once per page mount, so an arrival is visible even if the
     person leaves a second later.
  2. Listens, at the document level, for a click on anything pointing at
     /assessment and fires `cta_click`. Delegation rather than props is a
     deliberate choice: the CTA appears four times on the home page plus once
     inside MobileNav, and the home page is a server component. Threading a
     handler into all five would mean making the page client-side to measure
     it — a real cost for a small feature, and the same reasoning that put
     MobileNav in its own file.

  WHAT IT DELIBERATELY DOES NOT DO: no IP address, no fingerprinting, no
  third-party script. `fid` already answers "how many people" better than an
  IP does — an IP merges a household into one person and splits one person
  across two networks — and an IP is personal data, which would mean the
  privacy page needs a different disclosure than the one it just got. We are
  not going to break that page twice in one day.

  Every failure path here is silent. Measurement must never be able to cost
  us the thing it measures.
*/

export default function Arrival({ page }) {
  useEffect(() => {
    let ids = null;
    try {
      ids = session();
    } catch (e) {
      /* storage disabled: the event still goes out, just without ids */
    }

    track(ids, "landed:" + (page || "home"));

    const onClick = (e) => {
      try {
        const a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
        if (!a) return;
        const href = a.getAttribute("href") || "";
        if (!href.startsWith("/assessment")) return;
        /* Where on the page they clicked from is the useful dimension, and
           the Sheet has fixed columns, so it goes in the event name. */
        const label = (a.textContent || "").trim().slice(0, 24) || "unlabelled";
        track(ids, "cta_click:" + label);
      } catch (err) {
        /* never let a measurement listener break a navigation */
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [page]);

  return null;
}
