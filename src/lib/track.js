/* ============================================================
   FAIMGO — EVENT TRACKING

   Lifted out of the assessment page because a second page now
   needs it. The walkthrough is linked from the plan email, and
   an email link nobody can measure is a link we will argue
   about later with no evidence.

   `ids` is { fid, sid, visits }. fid is the person and survives
   across visits; sid is this sitting. Both go out on every
   event so that the day we can join them up, the history is
   already there waiting. Events fired before the ids are read
   simply carry nulls — we never delay or block the flow to
   wait for storage.

   Two rules this file exists to keep:
   - Analytics must never break the flow. Every failure path
     here ends in a silent return, including a throw from
     fetch() itself in a locked-down browser.
   - The event NAME carries the signal. The Sheet behind this
     has a fixed set of columns and is a manual edit away from
     us, so a new dimension is better expressed as a second
     event name than as a field nothing reads.

   RESERVED NAMES, per claude/faimgo-money-seams.md §3.4 — not enforced
   here (there is no whitelist, by design, see the rule above), just
   written down so whoever eventually builds the AI coach or the upgrade
   flow doesn't have to re-derive them: coach_open, coach_ask, coach_limit,
   upgrade_view, upgrade_click. step_done:<play id> and first_dollar are
   already live (shipped in v11 / Batch 1's clearWork() and markOutcome()
   work) — the five above are the ones still waiting on a feature to fire
   them.
   ============================================================ */

export function track(ids, name, extra) {
  try {
    fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "event", name,
        sid: ids?.sid || null, fid: ids?.fid || null, visits: ids?.visits || null,
        /* First-touch attribution, carried on every event since Aug 15 —
           see captureAttribution() in store.js. Omitted rather than sent as
           null when absent, so an old cached bundle calling track() with a
           plain {fid,sid,visits} object still works unchanged. */
        ...(ids && ids.src !== undefined ? { src: ids.src } : {}),
        ...(ids && ids.ref !== undefined ? { ref: ids.ref } : {}),
        ts: new Date().toISOString(), ...(extra || {}),
      }),
      /* keepalive so an event fired as the page unloads still lands. */
      keepalive: true,
    }).catch(() => {});
  } catch (e) { /* analytics must never break the flow */ }
}
