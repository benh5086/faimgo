/* ============================================================
   FAIMGO — PATH LIBRARY (single source of truth)
   Imported by the assessment UI *and* by the server that
   emails the plan, so the email can never drift from the
   screen the person actually saw.
   ============================================================ */

/* ---------- PATHS ---------- */
export const PATHS = [
  { id: "freelance", name: "Freelancing Your Skill", plain: "Freelance my skill (writing, design, tech, admin)", dollar: "1–3 weeks", speed: 4, ceiling: 4,
    moves: ["List the one skill people already ask you for help with", "Create one profile (Upwork or direct outreach) with a specific offer, not a generic title", "Pitch 10 real prospects with a personalized first line — volume beats polish"],
    kit: ["Free portfolio: Notion or Google Docs — no website needed for client #1", "Use free tiers (Canva, AI assistants) before paying for any tool"] },
  { id: "resell", name: "Reselling & Flipping", plain: "Resell / flip items (thrift, clearance, marketplaces)", dollar: "days", speed: 5, ceiling: 3,
    moves: ["Pick one category you can judge value in — start with what you know", "Source 5 items this weekend: thrift stores, clearance aisles, garage sales", "List the same day on FB Marketplace + eBay; price to sell, not to hope"],
    kit: ["Start with $50 and one shelf — no storage unit until profits pay for it", "Free listing photos: natural light + a plain wall beats any equipment"] },
  { id: "local", name: "Local Services", plain: "Local services (cleaning, lawn care, pressure washing, moving help)", dollar: "days", speed: 5, ceiling: 3,
    moves: ["Pick one service, one neighborhood — be the person for that thing", "Post in local FB groups + Nextdoor with a simple before/after and a price", "Do the first 3 jobs cheap in exchange for reviews and photos"],
    kit: ["Rent equipment for the first jobs (Home Depot rents by the day) — buy after job #5 pays for it", "Used tools on FB Marketplace go for 30–50% of retail"] },
  { id: "gig", name: "Gig Apps", plain: "Gig apps (delivery, rideshare, task apps)", dollar: "this week", speed: 5, ceiling: 2,
    moves: ["Sign up for two apps today — approval takes days, so start the clock now", "Work the peak windows only (meal times, weekends) — the hourly rate doubles", "Track your real earnings minus gas for 2 weeks before scaling up"],
    kit: [] },
  { id: "tutor", name: "Tutoring & Coaching", plain: "Tutoring or coaching (academics, language, fitness, a skill)", dollar: "1–2 weeks", speed: 4, ceiling: 4,
    moves: ["Define exactly who you teach and what outcome they get", "Post one clear offer on Wyzant/Preply or in local parent/community groups", "Offer the first session discounted in exchange for a testimonial"],
    kit: ["Free scheduling: Calendly free tier", "No certification needed to start most subjects — results are the credential"] },
  { id: "va", name: "Virtual Assistant / Online Services", plain: "Virtual assistant or online services", dollar: "2–4 weeks", speed: 3, ceiling: 3,
    moves: ["List 5 concrete tasks you'd handle (inbox, scheduling, data, listings)", "Message 15 small business owners who are visibly drowning — offer 5 trial hours", "Turn the first happy client into a weekly retainer"],
    kit: ["Everything you need is free: Gmail, Sheets, Calendly, Trello"] },
  { id: "digital", name: "Digital Products", plain: "Digital products (templates, printables, mini-courses)", dollar: "1–3 months", speed: 2, ceiling: 4,
    moves: ["Find one specific problem people already search for (check Etsy/Gumroad bestsellers)", "Build one small product in a weekend — a template, not a masterpiece", "List it, then spend 80% of your time on distribution, not more products"],
    kit: ["Free build stack: Canva free + Gumroad (no upfront fees, they take a cut)"] },
  { id: "content", name: "Content Creation", plain: "Content creation (YouTube, TikTok, newsletter)", dollar: "2–6 months", speed: 1, ceiling: 5,
    moves: ["Pick one platform and one narrow topic you can talk about for a year", "Publish on a fixed schedule for 8 weeks before judging anything", "Study your 2 best performers and make more of exactly that"],
    kit: ["Your phone camera is enough for the first 100 videos — creators upgrade after traction, not before"] },
  { id: "care", name: "Care Services", plain: "Care services (pet sitting, babysitting, senior help)", dollar: "1–2 weeks", speed: 4, ceiling: 3,
    moves: ["Create profiles on Rover/Care.com and tell your own network you're available", "Get 3 references lined up — trust is the entire product", "Nail the first bookings, ask every happy client for a review and a referral"],
    kit: ["Certifications (CPR, first aid) cost ~$30–50 online and double your credibility — worth it after first jobs, not before"] },
  { id: "food", name: "Food & Catering", plain: "Food you make (baked goods, meal prep, catering, personal chef)", dollar: "1–2 weeks", speed: 4, ceiling: 4,
    moves: ["Start in your state's cottage food lane — the non-perishable things you can legally sell from a home kitchen today (baked goods, jams, granola)", "Sell the first batches where buyers already gather: your own network, a farmers market stall, local FB groups — take orders before you scale up", "Check your county health department once before you sell — it's the one step that decides what's legal where you live, and clearing the next gate (a shared kitchen) is how the path grows bigger"],
    kit: ["Your home kitchen and simple packaging is enough to start under cottage food law — no commercial kitchen until orders pay for it", "The whole legal setup is usually your state's cottage food rules, a label listing ingredients and your contact, and a cheap permit in some states — check your state's allowed-foods list and sales cap"] },
];
export const CEILING_LABEL = { 2: "Modest", 3: "Solid", 4: "High", 5: "Very high" };
export const pathById = (id) => PATHS.find((p) => p.id === id);
