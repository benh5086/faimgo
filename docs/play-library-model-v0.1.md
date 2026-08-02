# Faimgo — The Play Library Model (v0.1 for Ben's reaction)

*The keystone: the shape of a single "play." Everything — the router, the tracker, the assessment hand-off — builds on this. Below is the schema (each field earns its place by answering a question the engine must ask), then two real freelancing plays in it, including one cross-path jump.*

---

## Why a "play" and not a "chapter"

A chapter is read. A play is *run and tracked*. The library is one pool of plays; a "playbook" is just a **personalized sequence the engine assembles** from that pool — mixed and matched across paths, the same way the assessment assembles a path from branching answers. Many plays are **shared** across paths, so the library is much smaller than 9 × 7, and cross-path jumps are natural because an outreach play is the *same object* on every path.

---

## The schema — every field answers an engine question

| Field | What it holds | The engine question it answers |
|---|---|---|
| `id` | stable slug, e.g. `outreach.find-buyer` | "which play is this?" (lets the assessment deep-link) |
| `name` | short human title | what the person sees |
| `move` | the one-line action | "what is the single thing to do?" |
| `paths` | `[freelance, resell, ...]` or `universal` | "does this apply to this person's path?" |
| `gap` | which starting gaps it serves: `has-skill / can-market / stuck / scratch` | "is this the right entry point for where they're stuck?" |
| `phase` | `find / aim / grow` (coarse 30/60/90) | "roughly when in the journey?" |
| `prerequisites` | play ids or state facts (e.g. `has:first-client`) | "is the person *ready* for this yet?" — don't show 'raise your price' before they have a client |
| `unlocks` | play ids, **may point to another path** | "what road opens after this?" — this is how rerouting works |
| `payoff` | `{ speed, effort, ceiling_impact }` | "how do I score earlier / easier / bigger?" — **same three axes the assessment already scores paths on** |
| `reroute_signals` | plain-language triggers | "what should the AI watch for that means 'jump to a better road'?" |
| `content` | `{ goal, steps[], done_when, templates[] }` | the actual followable card |

The `payoff` axes are deliberately the assessment's own axes (speed / effort-investment / ceiling), so the router is the assessment's scoring brain at finer grain — not a new system.

---

## Sample play A — a *universal* play (shared across many paths)

```
id:            outreach.find-buyer
name:          Find the person who feels the pain
move:          Aim at the human who actually feels the problem — not just whoever signs the check.
paths:         universal            # freelance, resell, local, va, tutor, care...
gap:           [has-skill, stuck]
phase:         find
prerequisites: [offer.defined]
unlocks:       [outreach.reach-out]
payoff:        { speed: days, effort: medium, ceiling_impact: foundational }
reroute_signals:
  - "User keeps reaching the person who PAYS but not the one who CARES → coach toward the champion."
content:
  goal:      A list of ~20 real prospects, and for each, who feels the pain.
  steps:     [ "List anyone you have a connection to", "Add cold ones from LinkedIn / Maps / directories", "For each, name the person whose day gets worse from the problem" ]
  done_when: 20 names, each with a 'who feels it' tag.
  templates: [ ]
```

Because it's `universal`, this one play serves freelancing, reselling, local services, VA work, and more — authored once, reused everywhere.

## Sample play B — a path play with a **cross-path jump** (your exact example)

```
id:            freelance.productize-offer
name:          Turn custom work into a named package
move:          Package your repeated deliverable into one fixed-scope, fixed-price offer.
paths:         [freelance]
gap:           [has-skill]
phase:         grow
prerequisites: [has:first-client, has:one-testimonial]
unlocks:       [digital.package-into-product]      # <-- jumps to the Digital Products path
payoff:        { speed: weeks, effort: medium, ceiling_impact: high }
reroute_signals:
  - "User reports the SAME deliverable keeps selling, or they built a reusable template/asset
     → surface `digital.package-into-product`: a bigger, more scalable road than trading time."
content:
  goal:      One named package ('The Listing Refresh — 5 descriptions, 3-day turnaround, $X').
  steps:     [ "Pick the deliverable clients ask for most", "Fix its scope, price, turnaround", "Add the risk-killer (revisions/guarantee)" ]
  done_when: You can sell it by name without a custom quote.
  templates: [ package-one-pager ]
```

**This is the reroute you described.** A person on the freelancing track hits `productize-offer`. The engine sees its `unlocks` points across to the Digital Products path, and the `reroute_signals` say: *if they mention a reusable asset, the faster/bigger road just opened.* So instead of marching them further down freelancing, Faimgo says: "You've built something you can sell over and over — here's the shortcut to a bigger outcome." Play 7 of playbook 1 → an early play of playbook 8, exactly as you pictured.

---

## How the router uses all this (one paragraph)

At any moment: (1) **filter** to plays whose `prerequisites` are met (is the person ready?), (2) **score** the rest by the person's stated priority — *earlier* weights `speed`, *bigger* weights `ceiling_impact`, *easier* weights low `effort` — using the assessment's existing numbers, (3) **surface** the top 1–3 as "your next move," and (4) let `reroute_signals` (read by AI from the person's check-ins) *promote* a cross-path play above the current track when a better road opens. Stages 1–2 are simple rules we can build now; stage 4 is the AI-in-the-loop magic that comes once we have accounts + check-ins.

---

*Status: v0.1 schema, awaiting Ben's reaction to the SHAPE before converting all of freelancing (then the other 8 paths) into it. If the shape is right, the whole library is just filling this in — and the engine's data contract is already done.*
