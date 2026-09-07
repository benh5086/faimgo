import Link from "next/link";

/*
  AccountLink — the one "My account" entry point, meant to sit in every
  page's header, not just the homepage footer.

  Added Sep 7 2026: Ben went looking for it and could only find it in the
  homepage footer, in small muted 14px text — and nowhere else, since
  /plan, /assessment, /restore, /privacy and /u/[id] never had it in their
  own header at all. Checked how real marketplaces handle this before
  building anything (fetched Fiverr and TaskRabbit directly, not assumed):
  both keep account access in a persistent header, present on every page,
  at the far right — never buried in a footer. This is that same placement,
  copied on purpose.

  One shared definition so it can't quietly go missing from a page again by
  omission — which is exactly how it ended up missing from five pages the
  first time.

  `label` defaults to plain English "My account" — every page besides the
  homepage stays English-only by design (see LocaleContext.js's own note
  on why), so only the homepage passes a translated label; everywhere else
  just uses the default, matching the rest of that page's hardcoded English.
*/
export default function AccountLink({ label = "My account", color = "#FFFFFF", className = "" }) {
  return (
    <Link
      href="/account"
      className={`text-[15px] font-medium transition-opacity hover:opacity-80 inline-flex items-center gap-1.5 ${className}`}
      style={{ color }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
      {label}
    </Link>
  );
}
