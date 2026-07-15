# Faimgo — Project History & Status

*Consolidated from all prior chats and tasks, migrated into the Faimgo project July 13, 2026. Full transcripts live in the chats/tasks attached to the project.*

## What Faimgo is

Faimgo is Ben's platform to help working professionals find and launch real, structured side income streams. One-line pitch: **"The first platform that tells you not just what side income to pursue, but exactly how to start it based on who you actually are — and walks you through it until you make your first dollar."**

Core framework: **Find, Pitch, Grow (FPG)** — find the right opportunity, pitch for the first customers, grow it into a real income stream. User-outcome goal: 30 days = leads, 60 days = first money, 90 days = steady income.

Ben's edge: 14 years as a PM in commodities trading (grain) and product sourcing (Uline — fire safety, dock equipment, hazmat, truck seals). The product thesis is "the PM mindset applied to personal income" — plans validated like product launches, not generic idea lists. Profile for planning purposes: tech level B (has used site builders; not a coder), daily tools are Claude and basic Google Sheets, no existing audience, a few hours/day, ~$200/mo budget (flexible if outcomes justify).

## Key assets

- Live site: **faimgo.vercel.app** (Next.js + Tailwind homepage)
- Code: GitHub **benh5086/faimgo**; local folder **C:\Users\iamin\Desktop\faimgo** (Ben's laptop)
- Registered domain: **aimfpg.com** (bought ~Jun 25 on Namecheap; DNS not yet connected)
- Earlier prototype: a basic **Softr** site (pre-Vercel; was never fully reviewed)
- Assessment design v1 (Jul 5 task) and **v2 (Jul 14, current source of truth)** + working HTML prototype of v2

## Timeline

**Jun 24 — Task: "AI side income website business analysis"** (market validation)
Deep, sourced analysis. Verdict: real market, real documented gap. Highlights: ~90M US side hustlers, 72% of workers have/considering one; gig economy $556.7B → projected $2.15T by 2033; top barriers are execution/knowledge (marketing/finance 67% of Gen Z, finding clients 47%); AI side-hustle interest +28% YoY, adoption high but effective use low — that's the gap. Competitive white space sits between content platforms (Starter Story $1.6M ARR, acquired by HubSpot Feb 2026; Lenny's Newsletter ~$2M/yr, 4-5% free→paid) and high-ticket coaching ($7.3B industry). Nobody delivers personalized, executable plans at accessible price. Find/Pitch/Grow judged a defensible product architecture — "Pitch" (getting first customers) is the most underserved layer. Named risks: trust/credibility (must show own results), churn if newsletter-first (13.33%/mo for AI topics — prefer community model), personalization at scale, and the execution gap (user outcomes = product quality).

**Jun 24–25 — same task: 0→1 plan and Step 1 executed**
Four-phase plan, 3 steps each, executed chain-style (one step at a time): Phase 1 Foundation (positioning/name/domain → website → intake system), Phase 2 Prove It Works Free (10 manual users → 2-3 documented results → community), Phase 3 Content Engine (pillar case study → one distribution platform → SEO), Phase 4 Monetize (paid tier → affiliate revenue → repeatable onboarding). Step 1 completed: **aimfpg.com registered**; north-star positioning sentence: *"FPG helps working professionals find real side income opportunities, build a plan to land their first customer, and grow it into a system that works alongside their career — using AI tools and frameworks that actually apply to their life."* Ben also mentioned an existing Softr site; task ended awaiting the Softr URL.

**Jun 24–29 — Chat: "Brand names for side income platform"**
20 professional names + 3 positioning statements, then 30 coined names (standouts: Velo, Kairo, Lantis, Trove, Strata). Ben floated "Selfyr", then debated **selfdevmo.com vs faimgo.com**; assessment: neither ideal for a LinkedIn-professional audience — suggested formal names (Kairo, Lantis, fpg.co) or LinkedIn-style fused names (Pitchin, Finpitch, Pitchwell, Growpath). Ben wants a LinkedIn-model name: brand-first, meaning (FPG core) revealed in retrospect. He evidently went with **Faimgo** (find-aim-go) for the Vercel site.

**Jul 5 — Task: "FPG website building"**
Built the Next.js + Tailwind homepage now live at faimgo.vercel.app, code on GitHub benh5086/faimgo.

**Jul 5 — Task: "Faimgo assessment page"**
Designed assessment v1: 12 questions (3 sections × 4), insight break after each section, email-gated results scored against a 9-path library, two outputs (fastest first win + best long-term path). Build was blocked on connecting the faimgo folder.

**Jul 13–14 — Task: "Faimgo migration" (this session)**
Moved all Faimgo chats/tasks into the Faimgo project. Ben redesigned the assessment logic → **v2**: desire-first flow (want → why → experience → time), resources & reality section (money → tools → timeline → risk) with a reality-check engine (slow path + no experience + fast timeline = honest verdict), Start Cheap Kit for missing gear, and a results page that reality-checks a named dream path (green/yellow/red-but-kind) paired with a Fastest First Win framed as the funder. Built a working single-file HTML prototype of v2 with live scoring. Files saved to the repo's docs/ folder.

## Decisions made

Assessment = two outputs (fastest win + long-term path). v2 = desire-first with reality-check engine. Simple subscription model. AI features come later. Action-focused, not idea lists. Name in use: Faimgo. Domain owned: aimfpg.com (final domain/brand decision open).

## Open threads

1. **Tailor v2** — open items: bluntness of the red verdict, plain-word path picker labels, whether the risk question (Q8) stays, Start Cheap Kit depth (static vs personalized).
2. **Build the assessment page** into the Next.js site once v2 is approved; decide email destination (Vercel serverless + Sheet/Resend vs Formspree).
3. **Name/domain final call** — Faimgo vs aimfpg.com vs alternatives; DNS unconfigured on Namecheap either way.
4. **Market-gap answers** — Ben's answers to the two domain-gap questions (grain trading + industrial sourcing).
5. Phase 2 of the 0→1 plan (first 10 free users, documented results, community space) comes after the assessment page ships.
