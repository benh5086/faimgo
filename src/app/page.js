import Reveal from "./Reveal";
import FeedbackWidget from "./FeedbackWidget";

export default function Home() {
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
  return (
    <main className="min-h-screen font-sans" style={{backgroundColor: C.white, color: C.ink}}>

      {/* Navigation */}
      <nav style={{backgroundColor: C.green}} className="px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center">
          <span className="text-2xl font-bold tracking-tight" style={{color: C.white}}>
            faim<span style={{color: C.goldBright}}>go</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-[15px] font-medium transition-opacity hover:opacity-80" style={{color: C.white}}>How It Works</a>
          <a href="#examples" className="text-[15px] font-medium transition-opacity hover:opacity-80" style={{color: C.white}}>Examples</a>
          <a href="#faq" className="text-[15px] font-medium transition-opacity hover:opacity-80" style={{color: C.white}}>FAQ</a>
          <FeedbackWidget trigger="nav" kind="contact" navLabel="Contact" context="header-contact" />
          <a href="/assessment" className="press px-5 py-2.5 rounded-full text-[15px] font-semibold hover:opacity-90"
            style={{backgroundColor: C.goldBright, color: C.green}}>
            Get Started
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" style={{background: 'radial-gradient(1100px 460px at 82% -10%, rgba(210,165,74,0.16), transparent 60%), radial-gradient(900px 500px at 6% 8%, rgba(27,58,45,0.06), transparent 55%)'}} />
        <div className="relative px-8 py-24 max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <a href="/assessment" className="hero-rise inline-flex items-center gap-2 px-4 py-2 rounded-full text-[14px] font-semibold mb-7 transition-all hover:opacity-80"
              style={{backgroundColor: C.white, color: C.green, border: `1px solid ${C.line}`, boxShadow: C.soft, animationDelay: '0ms'}}>
              Free 2-minute assessment →
            </a>
            <h1 className="hero-rise font-display text-5xl md:text-6xl leading-[1.08] mb-6" style={{color: C.green, animationDelay: '80ms'}}>
              Find, Aim, and <span style={{color: C.gold}}>Grow</span> Your Side Income
            </h1>
            <p className="hero-rise text-xl leading-relaxed mb-9" style={{color: C.body, animationDelay: '160ms'}}>
              Most people already have what it takes — skills, experience, ideas —
              they just haven&apos;t discovered how to turn it into real income yet.
              Faimgo finds your hidden opportunity and gives you a clear path to act on it.
            </p>
            <div className="hero-rise flex flex-wrap gap-4" style={{animationDelay: '240ms'}}>
              <a href="/assessment" className="press px-8 py-4 rounded-full font-semibold text-[17px] hover:opacity-90"
                style={{backgroundColor: C.green, color: C.white, boxShadow: C.soft}}>
                Start My Assessment
              </a>
              <a href="#how-it-works" className="press px-8 py-4 rounded-full font-semibold text-[17px] border-2 hover:bg-black/[0.03]"
                style={{borderColor: C.green, color: C.green}}>
                How It Works
              </a>
            </div>
          </div>

          {/* Hero Card — mirrors a real assessment result */}
          <div className="hero-rise lift flex-1 w-full rounded-2xl p-8" style={{backgroundColor: C.tint, border: `1px solid ${C.line}`, boxShadow: C.soft, animationDelay: '320ms'}}>
            <p className="text-[13px] font-bold uppercase tracking-widest mb-4" style={{color: C.gold}}>Your two paths</p>
            <div className="rounded-xl p-5 mb-3" style={{backgroundColor: C.white, border: `1px solid ${C.line}`}}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[16px] font-semibold" style={{color: C.green}}>Freelancing Your Skill</span>
                <span className="text-[12px] px-2.5 py-1 rounded-full font-semibold" style={{backgroundColor: C.mint, color: C.mintText}}>Fastest first win</span>
              </div>
              <p className="text-[14px] mb-4" style={{color: C.body}}>Your computer is the only equipment it needs.</p>
              <div className="flex gap-7">
                <div>
                  <p className="text-[12px] font-semibold" style={{color: C.ink}}>First dollar</p>
                  <p className="text-[14px]" style={{color: C.body}}>1–3 weeks</p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold" style={{color: C.ink}}>To start</p>
                  <p className="text-[14px]" style={{color: C.body}}>$0</p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold" style={{color: C.ink}}>Income ceiling</p>
                  <p className="text-[14px]" style={{color: C.body}}>High</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl p-5" style={{backgroundColor: C.white, border: `1px solid ${C.line}`}}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[16px] font-semibold" style={{color: C.green}}>Digital Products</span>
                <span className="text-[12px] px-2.5 py-1 rounded-full font-semibold" style={{backgroundColor: C.sand, color: C.sandText}}>Long-term path</span>
              </div>
              <p className="text-[14px]" style={{color: C.body}}>Build it once — it keeps earning while you build the next.</p>
            </div>
            <p className="text-[13px] mt-4 text-center" style={{color: C.body}}>Based on your time, inventory, and how you work</p>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="px-8 py-24" style={{backgroundColor: C.tint}}>
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-[14px] font-bold tracking-widest uppercase mb-3" style={{color: C.gold}}>The Problem</p>
            <h2 className="font-display text-4xl md:text-5xl mb-4" style={{color: C.green}}>
              Why Most People Never Start
            </h2>
            <p className="text-xl mb-14 max-w-2xl leading-relaxed" style={{color: C.body}}>
              It&apos;s not laziness. It&apos;s that nobody shows you a path built specifically for your situation.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {title: 'Too many conflicting ideas', desc: 'You jump between options, second-guess yourself, and never commit to a path that actually fits you.'},
              {title: "Generic advice that doesn't apply", desc: 'Most "business advice" ignores your skills, budget, and experience — sending you in the wrong direction.'},
              {title: 'No clear roadmap', desc: 'Even a solid idea falls apart without realistic milestones and next steps you can actually follow.'},
              {title: 'No alignment with your strengths', desc: "You don't know which opportunities match what you can realistically do today — so you waste time."},
            ].map((item, i) => (
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
          <p className="text-[14px] font-bold tracking-widest uppercase mb-3" style={{color: C.gold}}>How It Works</p>
          <h2 className="font-display text-4xl md:text-5xl mb-14" style={{color: C.green}}>Four Steps to Your Income Path</h2>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {[
            {step: '01', title: 'Find', desc: 'Answer a few honest questions about your time, skills, and what you already have.'},
            {step: '02', title: 'Aim', desc: 'We match you to the paths that actually fit you — with a real reality check on each.'},
            {step: '03', title: 'Pitch', desc: 'Get your first three concrete moves toward landing your very first customer.'},
            {step: '04', title: 'Grow', desc: 'Build from your first dollar into steady income that compounds over time.'},
          ].map((item, i) => (
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
            <p className="text-[14px] font-bold tracking-widest uppercase mb-3" style={{color: C.gold}}>Example Outputs</p>
            <h2 className="font-display text-4xl md:text-5xl mb-14" style={{color: C.green}}>Real Paths for Real People</h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {persona: 'Corporate Professional', path: 'Freelancing Your Skill', why: 'Turns years of expertise into paid client work — no new skills required.', time: '1–3 weeks to first client', budget: '$0 to start'},
              {persona: 'Busy Parent', path: 'Tutoring & Coaching', why: 'Teach what you already know, on a schedule that fits around the kids.', time: '1–2 weeks to first session', budget: '$0 to start'},
              {persona: 'Hands-On & Practical', path: 'Local Services', why: 'High-demand work in your own neighborhood, paid the same week.', time: 'Days to first job', budget: 'Rent gear, buy later'},
            ].map((item, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="lift h-full p-7 rounded-2xl" style={{backgroundColor: C.white, border: `1px solid ${C.line}`, boxShadow: C.soft}}>
                  <p className="text-[12px] font-bold uppercase tracking-widest mb-1.5" style={{color: C.gold}}>{item.persona}</p>
                  <h3 className="text-xl font-bold mb-3" style={{color: C.green}}>{item.path}</h3>
                  <p className="text-[16px] mb-5 leading-relaxed" style={{color: C.body}}>{item.why}</p>
                  <div className="border-t pt-4 flex flex-col gap-1.5" style={{borderColor: C.line}}>
                    <p className="text-[14px]" style={{color: C.body}}><span className="font-semibold" style={{color: C.ink}}>Time to start:</span> {item.time}</p>
                    <p className="text-[14px]" style={{color: C.body}}><span className="font-semibold" style={{color: C.ink}}>Budget:</span> {item.budget}</p>
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
          <p className="text-[14px] font-bold tracking-widest uppercase mb-3" style={{color: C.gold}}>FAQ</p>
          <h2 className="font-display text-4xl md:text-5xl mb-14" style={{color: C.green}}>Common Questions</h2>
        </Reveal>
        <div className="flex flex-col gap-5">
          {[
            {q: 'What kinds of opportunities does Faimgo find?', a: 'Faimgo matches you with realistic side income paths based on your skills, available time, budget, and goals — from freelancing and tutoring to reselling, local services, digital products, and more.'},
            {q: 'Is this free to use?', a: "Yes — the assessment is completely free. You'll get your personalized two-path plan at no cost."},
            {q: 'How long does the assessment take?', a: "About two minutes. It's designed to be fast and specific — no fluff, just what we need to find your best path."},
            {q: 'Do I need any prior business experience?', a: 'Not at all. Faimgo is built for people who are just starting out. We meet you where you are and build a path from there.'},
          ].map((item, i) => (
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
            Your Income Is Already <span style={{color: C.goldBright}}>Waiting</span>
          </h2>
          <p className="text-xl mb-11 max-w-xl mx-auto leading-relaxed" style={{color: '#B7C9BF'}}>
            Take the free assessment and get your personalized plan in about two minutes.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="/assessment" className="press px-10 py-4 rounded-full font-semibold text-[17px] hover:opacity-90"
              style={{backgroundColor: C.goldBright, color: C.green}}>
              Start Free Assessment
            </a>
            <a href="#how-it-works" className="press px-10 py-4 rounded-full font-semibold text-[17px] border-2 hover:bg-white/10"
              style={{borderColor: C.white, color: C.white}}>
              How It Works
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
        <p className="text-[14px]" style={{color: '#9DB0A6'}}>© 2026 Faimgo. All rights reserved.</p>
        <div className="flex gap-6 items-center">
          <a href="#" className="text-[14px] transition-opacity hover:opacity-80" style={{color: '#9DB0A6'}}>Privacy</a>
          <a href="#" className="text-[14px] transition-opacity hover:opacity-80" style={{color: '#9DB0A6'}}>Terms</a>
          <FeedbackWidget trigger="link" kind="contact" navLabel="Contact" context="footer-contact" />
        </div>
      </footer>

    </main>
  );
}
