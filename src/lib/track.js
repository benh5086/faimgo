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
   ============================================================ */

export function track(ids, name, extra) {
  try {
    fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "event", name,
        sid: ids?.sid || null, fid: ids?.fid || null, visits: ids?.visits || null,
        ts: new Date().toISOString(), ...(extra || {}),
      }),
      /* keepalive so an event fired as the page unloads still lands. */
      keepalive: true,
    }).catch(() => {});
  } catch (e) { /* analytics must never break the flow */ }
}
