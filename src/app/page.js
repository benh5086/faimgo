export default function Home() {
  return (
    <main className="min-h-screen font-sans" style={{backgroundColor: '#FAF7F2', color: '#1C1C1C'}}>

      {/* Navigation */}
      <nav style={{backgroundColor: '#1B3A2D'}} className="px-8 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-2xl font-bold tracking-tight" style={{color: '#FAF7F2'}}>
            faim<span style={{color: '#C49A3C'}}>go</span>
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-sm font-medium" style={{color: '#FAF7F2'}}>How It Works</a>
          <a href="#examples" className="text-sm font-medium" style={{color: '#FAF7F2'}}>Examples</a>
          <a href="#faq" className="text-sm font-medium" style={{color: '#FAF7F2'}}>FAQ</a>
          <a href="#start" className="px-5 py-2 rounded-full text-sm font-semibold transition-all"
            style={{backgroundColor: '#C49A3C', color: '#1B3A2D'}}>
            Get Started
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-8 py-24 max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-16">
        <div className="flex-1">
          <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full text-sm font-medium mb-6"
            style={{backgroundColor: '#F0EBE1', color: '#1B3A2D'}}>
            ● NEW &nbsp; Take the 3–5 minute assessment →
          </span>
          <h1 className="text-5xl font-bold leading-tight mb-6" style={{color: '#1B3A2D'}}>
            Find, Aim, and <span style={{color: '#C49A3C'}}>Grow</span> Your Side Income
          </h1>
          <p className="text-lg leading-relaxed mb-8" style={{color: '#6B7280'}}>
            Most people already have what it takes — skills, experience, ideas —
            they just haven't discovered how to turn it into real income yet.
            Faimgo finds your hidden opportunity and gives you a clear path to act on it.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#start" className="px-8 py-3 rounded-full font-semibold text-base transition-all hover:opacity-90"
              style={{backgroundColor: '#1B3A2D', color: '#FAF7F2'}}>
              Start My Assessment
            </a>
            <a href="#how-it-works" className="px-8 py-3 rounded-full font-semibold text-base border-2 transition-all hover:opacity-80"
              style={{borderColor: '#1B3A2D', color: '#1B3A2D'}}>
              How It Works
            </a>
          </div>
        </div>

        {/* Hero Card Mockup */}
        <div className="flex-1 w-full rounded-2xl p-8" style={{backgroundColor: '#F0EBE1'}}>
          <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{color: '#C49A3C'}}>Your Opportunity Match</p>
          <div className="rounded-xl p-5 mb-4" style={{backgroundColor: '#FAF7F2'}}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold" style={{color: '#1B3A2D'}}>AI Consulting</span>
              <span className="text-xs px-2 py-1 rounded-full font-medium" style={{backgroundColor: '#1B3A2D', color: '#C49A3C'}}>Top Match</span>
            </div>
            <p className="text-xs mb-3" style={{color: '#6B7280'}}>Leverages your expertise + client communication skills.</p>
            <div className="flex gap-4">
              <div>
                <p className="text-xs font-semibold" style={{color: '#1B3A2D'}}>Time to start</p>
                <p className="text-xs" style={{color: '#6B7280'}}>2–4 weeks</p>
              </div>
              <div>
                <p className="text-xs font-semibold" style={{color: '#1B3A2D'}}>Budget needed</p>
                <p className="text-xs" style={{color: '#6B7280'}}>Low</p>
              </div>
              <div>
                <p className="text-xs font-semibold" style={{color: '#1B3A2D'}}>Income potential</p>
                <p className="text-xs" style={{color: '#6B7280'}}>$2k–$8k/mo</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl p-4 opacity-60" style={{backgroundColor: '#FAF7F2'}}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold" style={{color: '#1B3A2D'}}>Digital Products</span>
              <span className="text-xs px-2 py-1 rounded-full font-medium" style={{backgroundColor: '#F0EBE1', color: '#1B3A2D'}}>Strong Fit</span>
            </div>
            <p className="text-xs" style={{color: '#6B7280'}}>Flexible schedule + compounding content assets.</p>
          </div>
          <p className="text-xs mt-4 text-center" style={{color: '#6B7280'}}>Based on your skills, time, budget and goals</p>
        </div>
      </section>

      {/* Problem */}
      <section className="px-8 py-20" style={{backgroundColor: '#F0EBE1'}}>
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-bold tracking-widest uppercase mb-3" style={{color: '#C49A3C'}}>Problem</p>
          <h2 className="text-4xl font-bold mb-3" style={{color: '#1B3A2D'}}>
            Why Most People Never Start
          </h2>
          <p className="text-lg mb-12 max-w-2xl" style={{color: '#6B7280'}}>
            It's not laziness. It's that nobody shows you a path built specifically for your situation.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {icon: '🔀', title: 'Too many conflicting ideas', desc: 'You jump between options, second-guess yourself, and never commit to a path that actually fits you.'},
              {icon: '🧩', title: "Generic advice that doesn't apply", desc: 'Most "business advice" ignores your skills, budget, and experience — sending you in the wrong direction.'},
              {icon: '🗺️', title: 'No clear roadmap', desc: 'Even a solid idea falls apart without realistic milestones and next steps you can actually follow.'},
              {icon: '🎯', title: 'No alignment with your strengths', desc: "You don't know which opportunities match what you can realistically do today — so you waste time."},
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl" style={{backgroundColor: '#FAF7F2'}}>
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-semibold text-lg mb-2" style={{color: '#1B3A2D'}}>{item.title}</h3>
                <p className="text-sm leading-relaxed" style={{color: '#6B7280'}}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-8 py-20 max-w-6xl mx-auto">
        <p className="text-sm font-bold tracking-widest uppercase mb-3" style={{color: '#C49A3C'}}>How It Works</p>
        <h2 className="text-4xl font-bold mb-12" style={{color: '#1B3A2D'}}>Four Steps to Your Income Path</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            {step: '01', title: 'Find', desc: 'Answer questions about your background, skills, and goals.'},
            {step: '02', title: 'Aim', desc: 'We analyze your profile and identify opportunities that fit you.'},
            {step: '03', title: 'Pitch', desc: 'Receive a personalized list of opportunities with clear next steps.'},
            {step: '04', title: 'Grow', desc: 'Start taking action and build income that compounds over time.'},
          ].map((item, i) => (
            <div key={i} className="flex flex-col gap-3">
              <span className="text-4xl font-bold" style={{color: '#C49A3C'}}>{item.step}</span>
              <h3 className="text-xl font-bold" style={{color: '#1B3A2D'}}>{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{color: '#6B7280'}}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Example Outputs */}
      <section id="examples" className="px-8 py-20" style={{backgroundColor: '#F0EBE1'}}>
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-bold tracking-widest uppercase mb-3" style={{color: '#C49A3C'}}>Example Outputs</p>
          <h2 className="text-4xl font-bold mb-12" style={{color: '#1B3A2D'}}>Real Paths for Real People</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {persona: 'Corporate Professional', path: 'AI Consulting', why: 'Leverages domain expertise + client communication skills.', time: '2–4 weeks to first offer', budget: 'Low — tools + outreach'},
              {persona: 'Stay-at-Home Parent', path: 'Digital Products + Content', why: 'Flexible schedule + compounding content assets.', time: '1–2 weeks to publish', budget: 'Low — platform + basic tools'},
              {persona: 'Skilled Trades Worker', path: 'Local Service + Online Lead Gen', why: 'High-demand services + simple lead capture.', time: '1–3 weeks to first leads', budget: 'Low-medium — basic ads + tools'},
            ].map((item, i) => (
              <div key={i} className="p-6 rounded-2xl" style={{backgroundColor: '#FAF7F2'}}>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{color: '#C49A3C'}}>{item.persona}</p>
                <h3 className="text-lg font-bold mb-3" style={{color: '#1B3A2D'}}>→ {item.path}</h3>
                <p className="text-sm mb-4" style={{color: '#6B7280'}}>{item.why}</p>
                <div className="border-t pt-4 flex flex-col gap-1" style={{borderColor: '#F0EBE1'}}>
                  <p className="text-xs" style={{color: '#6B7280'}}><span className="font-semibold">Time to start:</span> {item.time}</p>
                  <p className="text-xs" style={{color: '#6B7280'}}><span className="font-semibold">Budget:</span> {item.budget}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-8 py-20 max-w-4xl mx-auto">
        <p className="text-sm font-bold tracking-widest uppercase mb-3" style={{color: '#C49A3C'}}>FAQ</p>
        <h2 className="text-4xl font-bold mb-12" style={{color: '#1B3A2D'}}>Common Questions</h2>
        <div className="flex flex-col gap-6">
          {[
            {q: 'What kinds of opportunities does Faimgo find?', a: 'Faimgo matches you with realistic side income opportunities based on your skills, available time, budget, and goals — from consulting and freelancing to digital products and local services.'},
            {q: 'Is this free to use?', a: "Yes — the assessment is completely free. You'll receive a personalized opportunity report at no cost."},
            {q: 'How long does the assessment take?', a: "Most people complete it in 3–5 minutes. It's designed to be fast and specific — no fluff, just what we need to find your best path."},
            {q: 'Do I need any prior business experience?', a: 'Not at all. Faimgo is built for people who are just starting out. We meet you where you are and build a path from there.'},
          ].map((item, i) => (
            <div key={i} className="p-6 rounded-2xl" style={{backgroundColor: '#F0EBE1'}}>
              <h3 className="font-semibold mb-2" style={{color: '#1B3A2D'}}>{item.q}</h3>
              <p className="text-sm leading-relaxed" style={{color: '#6B7280'}}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section id="start" className="px-8 py-24 text-center" style={{backgroundColor: '#1B3A2D'}}>
        <h2 className="text-4xl font-bold mb-4" style={{color: '#FAF7F2'}}>
          Your Income Is Already <span style={{color: '#C49A3C'}}>Waiting</span>
        </h2>
        <p className="text-lg mb-10 max-w-xl mx-auto" style={{color: '#A3B8AE'}}>
          Take the free assessment and get your personalized opportunity map in minutes.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a href="#" className="px-10 py-4 rounded-full font-semibold text-base transition-all hover:opacity-90"
            style={{backgroundColor: '#C49A3C', color: '#1B3A2D'}}>
            Start Free Assessment
          </a>
          <a href="#how-it-works" className="px-10 py-4 rounded-full font-semibold text-base border-2 transition-all hover:opacity-80"
            style={{borderColor: '#FAF7F2', color: '#FAF7F2'}}>
            How It Works
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-10 py-8 flex flex-col md:flex-row items-center justify-between gap-4"
        style={{backgroundColor: '#1C1C1C'}}>
        <span className="text-xl font-bold tracking-tight" style={{color: '#FAF7F2'}}>
          faim<span style={{color: '#C49A3C'}}>go</span>
        </span>
        <p className="text-sm" style={{color: '#6B7280'}}>© 2025 Faimgo. All rights reserved.</p>
        <div className="flex gap-6">
          <a href="#" className="text-sm" style={{color: '#6B7280'}}>Privacy</a>
          <a href="#" className="text-sm" style={{color: '#6B7280'}}>Terms</a>
          <a href="#" className="text-sm" style={{color: '#6B7280'}}>Contact</a>
        </div>
      </footer>

    </main>
  );
}