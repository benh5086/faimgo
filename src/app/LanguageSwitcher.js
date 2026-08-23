"use client";

/*
  LanguageSwitcher — a small dropdown for EN / Español / 中文.

  Lives on the homepage nav (desktop) and inside MobileNav (mobile), both
  on a dark green background, so it takes its colors as props rather than
  hardcoding — same pattern the rest of the homepage already uses (a `C`
  color object passed down) rather than introducing a second styling
  approach for one component.
*/

import { useState, useRef, useEffect } from "react";
import { useLocale, LOCALES } from "../lib/i18n/LocaleContext";

export default function LanguageSwitcher({ tone = "dark" }) {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const textColor = tone === "dark" ? "#FFFFFF" : "#15181B";
  const panelBg = tone === "dark" ? "#14241B" : "#FFFFFF";
  const panelBorder = tone === "dark" ? "rgba(255,255,255,0.14)" : "#E4E8E5";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={t("langSwitcher.label")}
        className="press flex items-center gap-1.5 text-[14px] font-medium transition-opacity hover:opacity-80"
        style={{ color: textColor }}
      >
        <span aria-hidden="true">🌐</span>
        <span>{t(`langSwitcher.${locale}`)}</span>
      </button>

      {open && (
        <div
          className="reveal-in absolute right-0 top-full mt-2 py-1.5 rounded-xl z-50 min-w-[140px]"
          style={{ backgroundColor: panelBg, border: `1px solid ${panelBorder}`, boxShadow: "0 8px 24px rgba(0,0,0,0.18)" }}
        >
          {LOCALES.map((code) => (
            <button
              key={code}
              onClick={() => {
                setLocale(code);
                setOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-[14px] font-medium transition-opacity hover:opacity-80"
              style={{
                color: tone === "dark" ? "#FFFFFF" : "#15181B",
                fontWeight: code === locale ? 700 : 500,
              }}
            >
              {t(`langSwitcher.${code}`)}
              {code === locale && <span className="ml-2">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
