/*
  Faimgo — affiliate / referral seam.

  WHY THIS FILE EXISTS (bury the seam now, connect it later — the project's
  standing rule from faimgo-principles.md).
  The plays already name real tools in every `concrete.tools[].name`
  (Gumroad, Stripe, Payhip, Wave, Calendly, Google Docs, and more), and the
  walkthrough already sends people to them for free. Several of those tools
  run referral/affiliate programs, so those same clicks can carry revenue that
  costs the user nothing and touches nothing that is free. See
  faimgo-business-model.md (revenue line #2) and faimgo-money-seams.md §1b.3.

  This file is the ONE place a referral link lives. Until a program is actually
  joined and a real referral URL exists, AFFILIATE stays empty and every tool
  simply links to its normal site — already better than the plain text it used
  to be. The day a referral link exists, adding one line here turns that tool's
  link into a revenue link everywhere it appears. No page needs to change.

  IMPORTANT — these links render ONLY on Faimgo's own pages (e.g. /plan). They
  must never be used in outreach: an affiliate link in a Reddit/forum reply is
  the fast way to get an account banned (see faimgo-first-10-customers.md). On
  our own site they are completely fine and expected.

  PROGRAM NOTES as of Aug 2026 — verify each before enrolling, terms change;
  NONE are enrolled yet, and enrolling is Ben's action (create the account, get
  the referral URL, paste it into AFFILIATE below):
    - Calendly — has an affiliate program. A real candidate.
    - Wave — runs a partner/referral program. A real candidate.
    - Payhip — has affiliate features; confirm it pays for referring the
      platform itself, not only for reselling products on it.
    - Gumroad — is an affiliate MARKETPLACE (you earn as an affiliate of
      products listed on it), not a "refer the platform" payout — a different
      shape that may not fit here.
    - Stripe — a partner program for platforms, not a consumer referral payout;
      likely not an affiliate fit.
*/

/* Tool name (must match plays.json `concrete.tools[].name` EXACTLY) -> full
   referral URL. EMPTY today, on purpose. Add one line per joined program, e.g.:
     "Calendly": "https://calendly.com/?ref=REPLACE_WITH_YOUR_CODE",
     "Wave": "https://www.waveapps.com/?via=REPLACE_WITH_YOUR_CODE",
*/
export const AFFILIATE = {};

/*
  The link for a tool row on the plan page. Returns one of:
    - { href, isAffiliate:true }  — a registered referral URL for this tool
    - { href, isAffiliate:false } — https://<domain> from the play's `at` field
    - null                        — render as plain text, not a link
                                    (e.g. `at` is "—", or not a real domain)

  isAffiliate lets the caller tag the link rel="sponsored", which is the
  correct, honest markup for a paid/affiliate link.
*/
export function toolHref(name, at) {
  const ref = name && AFFILIATE[name];
  if (ref) return { href: ref, isAffiliate: true };
  const s = typeof at === "string" ? at.trim() : "";
  const domainish = s && s !== "—" && /\.[a-z]{2,}(\/|$)/i.test(s);
  if (domainish) {
    return { href: /^https?:\/\//i.test(s) ? s : "https://" + s, isAffiliate: false };
  }
  return null;
}
