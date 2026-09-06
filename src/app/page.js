"use client";

/*
  This page was a server component until the i18n batch below. Every
  visible section on it needs a translated string, so keeping it server-
  rendered would mean either duplicating the whole render tree per locale
  or piping translated strings down from the server — real complexity for
  a homepage. The honest trade-off, made deliberately: this page now
  server-renders in English (the default locale) and swaps client-side
  to a visitor's saved language choice a moment after hydration — the
  same "correct once JS runs" pattern MobileNav.js already uses for its
  menu. A search engine crawling the raw HTML sees the English version,
  which is normal and fine unless a future project deliberately wants
  separate indexed URLs per language (a bigger, distinct piece of work,
  not needed for a switcher used by the people already on the page).
*/

import Link from "next/link";
import Reveal from "./Reveal";
import FeedbackWidget from "./FeedbackWidget";
import MobileNav from "./MobileNav";
import Arrival from "./Arrival";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLocale } from "../lib/i18n/LocaleContext";

export default function Home() {
  const { t, tRaw } = useLocale();

  // Crisp modern palette
  const C = {
    white: '#FFFFFF',
    tint: '#F1F4F2',
    line: '#E4E8E5',
    green: '#1B3A2D',
    greenDeep: '#14241B',
    ink: '#15181B',
    body: '#464C54',
    gold: '#8A6A14',
    goldBright: '#D2A54A',
    mint: '#E4EEE9', mintText: '#0F6B3F',
    sand: '#FBF3DE', sandText: '#8A6A14',
    soft: '0 1px 2px rgba(20,36,27,0.04), 0 14px 34px -20px rgba(20,36,27,0.14)',
  };

  const problemItems = tRaw("problem.items");
  const stepItems = tRaw("howItWorks.steps");
  const exampleItems = tRaw("examples.items");
  const faqItems = tRaw("faq.items");

  return (
    <main className="min-h-screen font-sans" style={{backgroundColor: C.white, color: C.ink}}>
      {/* Renders nothing. Supplies the funnel's denominator — see Arrival.js. */}
      <Arrival page="home" />

      {/* Navigation */}
      <nav style={{backgroundColor: C.green}} className="relative px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center">
          {/* The wordmark links home. It used to be a plain <span>, so the one
              thing every visitor instinctively clicks to get back to the top —
              the logo — did nothing. On the homepage it's a no-op scroll-to-top;
              from anywhere the header is reused it's the way back. */}
          <Link href="/" aria-label="Faimgo — home" className="text-2xl font-bold tracking-tight" style={{color: C.white, textDecoration: "none"}}>
            faim<span style={{color: C.goldBright}}>go</span>
          </Link>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-[15px] font-medium transition-opacity hover:opacity-80" style={{color: C.white}}>{t("common.howItWorks")}</a>
          <a href="#examples" className="text-[15px] font-medium transition-opacity hover:opacity-80" style={{color: C.white}}>{t("nav.examples")}</a>
          <a href="#faq" className="text-[15px] font-medium transition-opacity hover:opacity-80" style={{color: C.white}}>{t("nav.faq")}</a>
          <FeedbackWidget trigger="nav" kind="contact" navLabel={t("common.contact")} context="header-contact" />
          <LanguageSwitcher tone="dark" />
          <a href="/assessment" className="press px-5 py-2.5 rounded-full text-[15px] font-semibold hover:opacity-90"
            style={{backgroundColor: C.goldBright, color: C.green}}>
            {t("common.getStarted")}
          </a>
        </div>

        {/* Below `md` the block above is hidden. Without this, a phone showed
            the wordmark and nothing else — including no Get Started. */}
        <MobileNav C={C}>
          <FeedbackWidget trigger="nav" kind="contact" navLabel={t("common.contact")} context="header-contact-mobile" />
        </MobileNav>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" style={{background: 'radial-gradient(1100px 460px at 82% -10%, rgba(210,165,74,0.16), transparent 60%), radial-gradient(900px 500px at 6% 8%, rgba(27,58,45,0.06), transparent 55%)'}} />
        <div className="relative px-8 py-24 max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <a href="/assessment" className="hero-rise inline-flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-semibold mb-7 transition-all hover:opacity-80"
              style={{backgroundColor: C.white, color: C.green, border: `1px solid ${C.line}`, boxShadow: C.soft, animationDelay: '0ms'}}>
              {t("hero.badge")}
            </a>
            <h1 className="hero-rise font-display text-5xl md:text-6xl leading-[1.08] mb-6" style={{color: C.green, animationDelay: '80ms'}}>
              {t("hero.titlePre")}<span style={{color: C.gold}}>{t("hero.titleHighlight")}</span>{t("hero.titlePost")}
            </h1>
            <p className="hero-rise text-xl leading-relaxed mb-9" style={{color: C.body, animationDelay: '160ms'}}>
              {t("hero.subtitle")}
            </p>
            <div className="hero-rise flex flex-wrap gap-4" style={{animationDelay: '240ms'}}>
              <a href="/assessment" className="press px-8 py-4 rounded-full font-semibold text-[17px] hover:opacity-90"
                style={{backgroundColor: C.green, color: C.white, boxShadow: C.soft}}>
                {t("hero.startAssessment")}
              </a>
              <a href="#how-it-works" className="press px-8 py-4 rounded-full font-semibold text-[17px] border-2 hover:bg-black/[0.03]"
                style={{borderColor: C.green, color: C.green}}>
                {t("common.howItWorks")}
              </a>
            </div>
          </div>

          {/* Hero Card — mirrors a real assessment result */}
          <div className="hero-rise lift flex-1 w-full rounded-2xl p-8" style={{backgroundColor: C.tint, border: `1px solid ${C.line}`, boxShadow: C.soft, animationDelay: '320ms'}}>
            <p className="text-[13px] font-bold uppercase tracking-widest mb-4" style={{color: C.gold}}>{t("hero.cardLabel")}</p>
            <div className="rounded-xl p-5 mb-3" style={{backgroundColor: C.white, border: `1px solid ${C.line}`}}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[16px] font-semibold" style={{color: C.green}}>{t("hero.card1Title")}</span>
                <span className="text-[12px] px-2.5 py-1 rounded-full font-semibold" style={{backgroundColor: C.mint, color: C.mintText}}>{t("hero.card1Badge")}</span>
              </div>
              <p className="text-[14px] mb-4" style={{color: C.body}}>{t("hero.card1Desc")}</p>
              <div className="flex gap-7">
                <div>
                  <p className="text-[12px] font-semibold" style={{color: C.ink}}>{t("hero.firstDollarLabel")}</p>
                  <p className="text-[14px]" style={{color: C.body}}>{t("hero.firstDollarValue")}</p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold" style={{color: C.ink}}>{t("hero.toStartLabel")}</p>
                  <p className="text-[14px]" style={{color: C.body}}>{t("hero.toStartValue")}</p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold" style={{color: C.ink}}>{t("hero.ceilingLabel")}</p>
                  <p className="text-[14px]" style={{color: C.body}}>{t("hero.ceilingValue")}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl p-5" style={{backgroundColor: C.white, border: `1px solid ${C.line}`}}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[16px] font-semibold" style={{color: C.green}}>{t("hero.card2Title")}</span>
                <span className="text-[12px] px-2.5 py-1 rounded-full font-semibold" style={{backgroundColor: C.sand, color: C.sandText}}>{t("hero.card2Badge")}</span>
              </div>
              <p className="text-[14px]" style={{color: C.body}}>{t("hero.card2Desc")}</p>
            </div>
            <p className="text-[13px] mt-4 text-center" style={{color: C.body}}>{t("hero.cardFooter")}</p>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="px-8 py-24" style={{backgroundColor: C.tint}}>
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-[14px] font-bold tracking-widest uppercase mb-3" style={{color: C.gold}}>{t("problem.eyebrow")}</p>
            <h2 className="font-display text-4xl md:text-5xl mb-4" style={{color: C.green}}>
              {t("problem.title")}
            </h2>
            <p className="text-xl mb-14 max-w-2xl leading-relaxed" style={{color: C.body}}>
              {t("problem.subtitle")}
            </p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {problemItems.map((item, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="lift h-full p-8 rounded-2xl" style={{backgroundColor: C.white, border: `1px solid ${C.line}`, boxShadow: C.soft}}>
                  <p className="text-[15px] font-bold mb-3 tracking-widest" style={{color: C.gold}}>{String(i + 1).padStart(2, '0')}</p>
                  <h3 className="font-semibold text-xl mb-2.5" style={{color: C.green}}>{item.title}</h3>
                  <p className="text-[16px] leading-relaxed" style={{color: C.body}}>{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-8 py-24 max-w-6xl mx-auto">
        <Reveal>
          <p className="text-[14px] font-bold tracking-widest uppercase mb-3" style={{color: C.gold}}>{t("howItWorks.eyebrow")}</p>
          <h2 className="font-display text-4xl md:text-5xl mb-4" style={{color: C.green}}>{t("howItWorks.title")}</h2>
          {/* Step 3 was "Pitch" until Aug 10. Two reasons it had to go. It
              assumed the outreach model, so it was simply wrong for two of the
              nine paths — nobody pitches on a gig app, and content creators
              publish rather than pitch. That is the same mistake the play
              library had, where the sales spine leaked into paths that do not
              sell that way. And "Find, Aim, Go" is the only version of the
              framework the product's own name teaches. */}
          <p className="text-[17px] leading-relaxed mb-14" style={{color: C.body}}>
            {t("howItWorks.subtitle")}
          </p>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {stepItems.map((item, i) => (
            <Reveal key={i} delay={i * 90}>
              <div className="flex flex-col gap-3">
                <span className="font-display text-5xl" style={{color: C.gold}}>{item.step}</span>
                <h3 className="text-2xl font-bold" style={{color: C.green}}>{item.title}</h3>
                <p className="text-[16px] leading-relaxed" style={{color: C.body}}>{item.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Example Outputs */}
      <section id="examples" className="px-8 py-24" style={{backgroundColor: C.tint}}>
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-[14px] font-bold tracking-widest uppercase mb-3" style={{color: C.gold}}>{t("examples.eyebrow")}</p>
            <h2 className="font-display text-4xl md:text-5xl mb-14" style={{color: C.green}}>{t("examples.title")}</h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {exampleItems.map((item, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="lift h-full p-7 rounded-2xl" style={{backgroundColor: C.white, border: `1px solid ${C.line}`, boxShadow: C.soft}}>
                  <p className="text-[12px] font-bold uppercase tracking-widest mb-1.5" style={{color: C.gold}}>{item.persona}</p>
                  <h3 className="text-xl font-bold mb-3" style={{color: C.green}}>{item.path}</h3>
                  <p className="text-[16px] mb-5 leading-relaxed" style={{color: C.body}}>{item.why}</p>
                  <div className="border-t pt-4 flex flex-col gap-1.5" style={{borderColor: C.line}}>
                    <p className="text-[14px]" style={{color: C.body}}><span className="font-semibold" style={{color: C.ink}}>{t("examples.timeLabel")}</span> {item.time}</p>
                    <p className="text-[14px]" style={{color: C.body}}><span className="font-semibold" style={{color: C.ink}}>{t("examples.budgetLabel")}</span> {item.budget}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-8 py-24 max-w-4xl mx-auto">
        <Reveal>
          <p className="text-[14px] font-bold tracking-widest uppercase mb-3" style={{color: C.gold}}>{t("faq.eyebrow")}</p>
          <h2 className="font-display text-4xl md:text-5xl mb-14" style={{color: C.green}}>{t("faq.title")}</h2>
        </Reveal>
        <div className="flex flex-col gap-5">
          {faqItems.map((item, i) => (
            <Reveal key={i} delay={i * 60}>
              <div className="p-7 rounded-2xl" style={{backgroundColor: C.tint, border: `1px solid ${C.line}`}}>
                <h3 className="font-semibold text-lg mb-2" style={{color: C.green}}>{item.q}</h3>
                <p className="text-[16px] leading-relaxed" style={{color: C.body}}>{item.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section id="start" className="px-8 py-28 text-center" style={{backgroundColor: C.green}}>
        <Reveal>
          <h2 className="font-display text-4xl md:text-5xl mb-5" style={{color: C.white}}>
            {t("cta.titlePre")}<span style={{color: C.goldBright}}>{t("cta.titleHighlight")}</span>
          </h2>
          <p className="text-xl mb-11 max-w-xl mx-auto leading-relaxed" style={{color: '#B7C9BF'}}>
            {t("cta.subtitle")}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="/assessment" className="press px-10 py-4 rounded-full font-semibold text-[17px] hover:opacity-90"
              style={{backgroundColor: C.goldBright, color: C.green}}>
              {t("cta.startFree")}
            </a>
            <a href="#how-it-works" className="press px-10 py-4 rounded-full font-semibold text-[17px] border-2 hover:bg-white/10"
              style={{borderColor: C.white, color: C.white}}>
              {t("common.howItWorks")}
            </a>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-4"
        style={{backgroundColor: C.greenDeep}}>
        <span className="text-xl font-bold tracking-tight" style={{color: C.white}}>
          faim<span style={{color: C.goldBright}}>go</span>
        </span>
        <p className="text-[14px]" style={{color: '#9DB0A6'}}>{t("footer.copyright")}</p>
        <div className="flex gap-6 items-center">
          {/* Privacy is a real page now. Terms was removed rather than left
              pointing at "#": a dead link on a site that collects email reads
              as a document you are not being shown, which is worse than an
              absent one. It comes back when it exists. */}
          <Link href="/privacy" className="text-[14px] transition-opacity hover:opacity-80" style={{color: '#9DB0A6'}}>{t("footer.privacy")}</Link>
          {/* Added Aug 16 alongside /restore — a second, quieter door back to
              a plan for anyone who lands on the homepage instead of straight
              into the assessment (a bookmark, a search result, a share). The
              assessment's own start screen carries the same link for the
              more common case of clicking "Start" first. */}
          <Link href="/restore" className="text-[14px] transition-opacity hover:opacity-80" style={{color: '#9DB0A6'}}>{t("footer.getPlanBack")}</Link>
          {/* Added Sep 6, same understated treatment as the link above —
              this is a private "my account" page (display name, bio, your
              own stats), not a public directory. See
              claude/faimgo-profile-scope-sep6.md. */}
          <Link href="/account" className="text-[14px] transition-opacity hover:opacity-80" style={{color: '#9DB0A6'}}>{t("footer.myAccount")}</Link>
          <FeedbackWidget trigger="link" kind="contact" navLabel={t("common.contact")} context="footer-contact" />
        </div>
      </footer>

    </main>
  );
}
