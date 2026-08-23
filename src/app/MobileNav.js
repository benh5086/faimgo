"use client";

import { useState, useEffect } from "react";
import { useLocale } from "../lib/i18n/LocaleContext";
import LanguageSwitcher from "./LanguageSwitcher";

/*
  MobileNav — the header menu for screens below `md`.

  Until now the entire header nav was `hidden md:flex`, which meant a phone
  showed the wordmark and nothing else: How It Works, Examples, FAQ, Contact
  and — worst of the five — **Get Started** were all unreachable from the top
  of the page. The hero CTA saved the funnel, but Contact and FAQ were only
  reachable by scrolling to the footer, and most of this product's visitors
  arrive on a phone.

  Two deliberate choices:

  1. **Get Started stays visible at all times, outside the menu.** A person who
     already knows they want to start should never have to open a menu to do
     it. Only the secondary links hide behind the toggle.

  2. **This is a client component on its own**, not a "use client" added to
     page.js. Originally kept page.js server-rendered and free of this
     component's boolean; page.js later became a client component itself
     (see its own header comment, added with the i18n batch), so that
     specific reason no longer holds — but the separation is still worth
     keeping for its own sake, not worth undoing for no benefit. The Contact
     widget is still passed in as `children` from the parent either way.

  Language switcher added the same batch: it lives inside the open menu
  here (not next to Get Started) so the primary CTA stays the single most
  prominent thing in the collapsed state.
*/

export default function MobileNav({ C, children }) {
  const [open, setOpen] = useState(false);
  const { t } = useLocale();

  /* Escape closes it. Someone who opened a menu by accident on a phone should
     not have to hunt for the way out. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const link = "block w-full py-3 text-[17px] font-medium transition-opacity hover:opacity-80";

  return (
    <div className="md:hidden flex items-center gap-3">
      <a href="/assessment" className="press px-4 py-2 rounded-full text-[14px] font-semibold"
        style={{ backgroundColor: C.goldBright, color: C.green }}>
        {t("common.getStarted")}
      </a>

      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? t("common.closeMenu") : t("common.openMenu")}
        className="press flex flex-col justify-center items-center gap-[5px] w-11 h-11 rounded-lg"
      >
        {/* Three rules that become an X. No icon library for one button. */}
        <span className="block h-[2px] w-[22px] rounded transition-transform duration-200"
          style={{ backgroundColor: C.white, transform: open ? "translateY(7px) rotate(45deg)" : "none" }} />
        <span className="block h-[2px] w-[22px] rounded transition-opacity duration-200"
          style={{ backgroundColor: C.white, opacity: open ? 0 : 1 }} />
        <span className="block h-[2px] w-[22px] rounded transition-transform duration-200"
          style={{ backgroundColor: C.white, transform: open ? "translateY(-7px) rotate(-45deg)" : "none" }} />
      </button>

      {open && (
        <div
          className="reveal-in absolute left-0 right-0 top-full px-8 pb-6 pt-2"
          style={{ backgroundColor: C.green, borderTop: "1px solid rgba(255,255,255,0.12)" }}
        >
          <a href="#how-it-works" onClick={() => setOpen(false)} className={link} style={{ color: C.white }}>{t("common.howItWorks")}</a>
          <a href="#examples" onClick={() => setOpen(false)} className={link} style={{ color: C.white }}>{t("nav.examples")}</a>
          <a href="#faq" onClick={() => setOpen(false)} className={link} style={{ color: C.white }}>{t("nav.faq")}</a>
          <div className="py-3" onClick={() => setOpen(false)}>{children}</div>
          <div className="py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.12)" }}>
            <LanguageSwitcher tone="dark" />
          </div>
        </div>
      )}
    </div>
  );
}
