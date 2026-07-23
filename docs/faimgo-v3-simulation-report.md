# Assessment v3 — Scoring Equivalence Report

*Generated July 16, 2026. Per the project's verification rule: no opinion-based claims about question cuts — simulate and measure. All 303,104 possible answer combinations were run through both engines.*

## What v3 changed

- 14 questions → **8** (named path) / **6** (match me): merged motivation+experience into one "relationship" question, merged energy+online-comfort into one "how do you like to work" question, folded budget into the Starting Inventory as a "cash" asset, cut the risk-appetite question, moved the obstacle question to the email screen as optional.
- The removed risk question's signal now derives from the timeline answer (urgency → sure-thing weighting, patience → high-ceiling weighting), matching v2's weights exactly for the timeline-consistent risk postures.

## Results

| Check | Result |
|---|---|
| Combinations tested | 303,104 |
| Invariant failures (missing fastest win, excluded path shown, content shown to offline users, gig without a car) | **0** |
| Reality-check verdict (green/yellow/red) matches v2 | **100%** |
| Both result cards identical to v2 | 69.1% |
| Fastest-win card identical to v2 | 80.8% |
| Long-term card identical to v2 | 83.0% |

## Are the differences a problem?

Where v3's fastest win differs from v2's, the v2 score gap between the two candidate paths was:

| v2 score gap | share of disagreements |
|---|---|
| 0 (exact tie in v2) | 46% |
| 1 | 38% |
| 2 | 13% |
| 3 | 3% |
| 4+ | **0%** |

**97% of all disagreements occur where v2 scored the two paths within 2 points of each other** — i.e., both paths fit the user well and the "winner" was already an effective coin-flip. v3 never overrides a clear v2 winner. The remaining differences are the intentional redesign choices (cash counted as inventory, merged work-style weights), not accidents.

## What the risk question was actually worth (honest finding)

The simulation contradicted our initial assumption that the risk question carried "near-zero weight": in v2, varying the risk answer alone could change the output in 44.8% of combos (27.0% could flip even the fastest win). However, those flips were also tie-breaks among near-equals, and the signal is now supplied deterministically by the timeline answer. Conclusion: the cut is safe, but the question was informative — worth remembering if we ever want a v4 with adaptive question count.

## Verdict

v3 preserves every hard filter, every safety invariant, and the entire honesty engine (verdicts 100% identical), while asking 43% fewer questions. Output differences are confined to near-tie tie-breaking under intentionally redesigned weights.

*Simulation source: `sim/sim-v2-v3.mjs` — run with `bun sim/sim-v2-v3.mjs` (or `node`).*
