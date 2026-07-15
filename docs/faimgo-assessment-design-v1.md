# Faimgo Assessment — Design v1

**Flow:** 3 sections × 4 questions (~12 questions, under 3 minutes) → insight break after each section → email gate → results showing **Fastest First Win** + **Best Long-Term Path**.

## The Path Library (9 paths)

Every answer scores against these. Each path has a speed rating (how fast to first dollar) and a ceiling rating (long-term income potential).

| # | Path | First dollar | Speed | Ceiling | Hard requirements |
|---|------|-------------|-------|---------|-------------------|
| 1 | Freelancing your skill (writing, design, coding, admin) | 1–3 weeks | ★★★★ | ★★★★ | A marketable skill, computer |
| 2 | Reselling & flipping (thrift, clearance, marketplaces) | Days | ★★★★★ | ★★★ | ~$50–100 to start, some storage space |
| 3 | Local services (cleaning, lawn care, pressure washing, moving help) | Days | ★★★★★ | ★★★ | Comfortable with physical work; car helps |
| 4 | Gig apps (delivery, rideshare, task apps) | This week | ★★★★★ | ★★ | Reliable car |
| 5 | Tutoring & coaching (academic, language, fitness, skills) | 1–2 weeks | ★★★★ | ★★★★ | Something you can teach |
| 6 | Virtual assistant / online services | 2–4 weeks | ★★★ | ★★★ | Computer, organized personality |
| 7 | Digital products (templates, printables, mini-courses) | 1–3 months | ★★ | ★★★★ | Computer, creative bent |
| 8 | Content creation (YouTube, TikTok, newsletter) | 2–6 months | ★ | ★★★★★ | Comfort being visible online, patience |
| 9 | Care services (pet sitting, babysitting, senior help) | 1–2 weeks | ★★★★ | ★★★ | Genuinely likes people/animals |

**Fastest First Win** = highest-scoring path with Speed ≥ 4 (after hard filters).
**Best Long-Term Path** = highest-scoring path weighted by Ceiling.
If they're the same path, we show it once as "your path" and surface the #2 long-term option — always two outputs.

## Section 1 — Your Starting Point (time, money, urgency, risk)

**Q1. How many hours a week can you realistically give this?**
- Less than 5 — squeezing it in
- 5–10 — a few evenings
- 10–20 — serious side commitment
- 20+ — this is a priority

**Q2. How much could you put in to start — without stressing about it?**
- $0 — needs to be free to start
- Under $100
- $100–$500
- $500+ — I can invest in this

**Q3. How soon do you need to see your first dollar?**
- This week if possible
- Within a month
- 1–3 months is fine
- No rush — I'm building something bigger

**Q4. Which sounds more like you?**
- Give me guaranteed small money over a risky big win
- Mostly sure things, with a little upside
- Balanced — some safe, some bets
- I'll bet my time on a bigger payoff

**🔍 Insight break 1 — "Your speed profile"** — computed from Q1–Q4 → one of three profiles:
- **Sprinter** (needs money fast, low investment) → "We're prioritizing paths that pay in days, not months. 5 of 9 paths fit your speed."
- **Builder** (patient, can invest) → "You can afford to build something with a real ceiling. 6 of 9 paths fit."
- **Hybrid** → "You want a quick win and a long game — that's exactly the two-path plan Faimgo builds."

Plus a live "X of 9 paths still in play" counter.

## Section 2 — What You've Got (skills, assets, background, online comfort)

**Q5. What's your strongest marketable ability?**
- Writing, design, tech, or marketing
- Teaching or explaining things
- Hands-on: fixing, building, physical work
- Organizing, admin, getting details right
- Talking to people, selling, persuading
- Honestly not sure yet

**Q6. What do you have access to? (select all that apply)**
- A reliable car
- A computer + solid internet
- Tools or equipment (lawn, cleaning, craft…)
- Spare space (garage, storage, a spare room)
- None of these right now

*Hard filters: no car → Gig apps excluded; no computer → Freelancing/VA/Digital/Content demoted; no space → Reselling demoted.*

**Q7. Your work background is mostly…**
- Office / professional
- Trades, physical, or hands-on work
- Retail, service, or hospitality
- Student, homemaker, or between things

**Q8. How do you feel about putting yourself out there online?**
- Love it — camera doesn't scare me
- Happy to post, prefer not on camera
- Behind the scenes only
- I'd rather work offline entirely

**🔍 Insight break 2 — "Your unfair advantage"** — names their strongest asset in plain words, e.g. "Your hands-on background + a car + tools is the classic local-services profile — the most underrated fast money in America." Counter updates: "Down to X paths."

## Section 3 — How You Work (personality, style, history)

**Q9. What gives you energy?**
- Being around people, face to face
- People in small doses — online is ideal
- Mostly working alone
- Strictly solo, headphones on

**Q10. Which feels most like you?**
- Making and creating things
- Selling, negotiating, closing
- Helping and taking care of people
- Building systems and keeping things running

**Q11. Your consistency style, honestly:**
- Short intense bursts
- Steady bit-every-day person
- Weekend warrior — big chunks
- My schedule is chaos

**Q12. What's gotten in the way before?**
- Never knew where to start
- Started things but lost steam
- Time — life keeps eating it
- Scared of wasting money
- This is my first real attempt

*(Q12 mostly personalizes the plan copy — e.g. "lost steam" → emphasize the day-by-day walkthrough; "scared of wasting money" → lead with the $0-to-start step.)*

## Email gate

After Q12: **"Your two paths are ready."** One field (email) + button: **"Show me my plan."**
Microcopy: "We'll also send your plan so you don't lose it. No spam — you can unsubscribe anytime."
For v1 (no backend): store the lead via a simple endpoint or a form service — decided during build. Results render client-side immediately after submit.

## Results page

Two cards:

**⚡ Your Fastest First Win — [Path]**
- "Why this fits you" — 2–3 sentences generated from their actual answers
- "Your first 3 moves" — concrete steps
- "First dollar: ~X days" mapped against the 30/60/90 promise

**🏔 Your Long-Term Path — [Path]**
- Why it fits, what the ceiling looks like, first 3 moves
- "How the two work together" — one line, e.g. "Flip while you build: reselling pays your first 60 days while the digital product compounds."

**CTA:** subscribe to get walked through it step-by-step (the Faimgo core offer).

## Scoring mechanics (summary)

- Every option carries small weights (+0 to +3) toward relevant paths; a few carry hard excludes (no car → no gig apps).
- Fastest First Win = top score among Speed ≥ 4 paths.
- Long-Term = top of (score × ceiling weight).
- All client-side, instant, no backend required for scoring.
