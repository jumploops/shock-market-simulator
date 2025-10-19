# Shock engine review (2025-02-14)

Goal: audit the current simulation logic, note assumptions, and flag any modelling risks before we make further changes.

## What the engine does today

- **Data inputs** — `App.tsx` builds the scenario list from `data/scenarioTemplates.ts`.
  - Each template defines `shockMap` (e.g., `us_large: -0.65`, `tbills: 0.11`) plus options (`defaultHorizon`, real/nominal default, gold toggle, location risk default).
  - `scenarioMappingRules` maps simple form buckets to advanced keys (`bonds → ["tbills","treasuries_10y","corporates_ig"]`).
- **Portfolio normalisation** — `engine/portfolio.ts`
  - `createInitialFormState()` seeds both simple and advanced maps with zero.
  - `getEffectivePortfolioAmounts()`:
    - Applies advanced overrides first.
    - For each simple key:
      - Deducts the sum of advanced overrides mapped to it.
      - Evenly distributes any remaining amount across the mapped advanced keys.
      - Liabilities (mortgage, margin debt) are treated as standalone keys (no fan-out).
    - Returns a map across **all** advanced keys (`tbills`, `us_large`, etc.) plus liabilities.
- **Shock math** — `engine/shockEngine.ts`
  - `applyScenarioAdjustments()` tweaks scenario values based on options:
    - Scenario A (1929) honours horizon (cycle vs trough vs year1) and gold revaluation toggle.
    - Location risk subtracts additional haircut from `real_estate_value`.
  - `computeShock()`:
    - Loops every portfolio key; if the amount is ≠0, multiplies by `(1 + shock)`.
    - Assets have the shock applied; liabilities remain unchanged.
    - Aggregates totals (assets, liabilities, net worth before/after, delta, pct).
    - If `useRealReturns` is true, divides asset/liability after-values by `(1 + purchasingPowerAdjustment)` (per horizon).
  - Returns both the per-key breakdown (`items`) and totals.
- **Display layer** — `App.tsx`
  - `CATEGORY_DEFINITIONS` defines how charts group advanced keys (e.g., “bonds” = tbills, treasuries_10y, corporates_ig, corporates_hy).
  - `aggregatedCategories` rebuilds the before/after totals per display category.
  - `topImpacts` uses raw `shockResult.items` (advanced keys) sorted by absolute delta.

## Potential modelling issues & discrepancies

| ID | Area | Observation | Risk / Impact | Suggested direction |
|----|------|-------------|---------------|---------------------|
| M1 | Fan-out (`getEffectivePortfolioAmounts`) | Simple buckets are split **equally** across mapped advanced keys once overrides are deducted. | Real portfolios rarely split bonds 1/3–1/3–1/3; “Other” also defaults to equities. Results depend heavily on these implicit weights. | Allow custom weights in Advanced (e.g., slider or percent inputs). At minimum, surface the split to the user (tooltip already added). |
| M2 | Advanced overrides | Setting one advanced field consumes part of the simple bucket, but leaving the rest blank still distributes the remainder evenly across the other advanced keys. | Users expecting to zero out a channel by entering 0 may be surprised; they must override **all** child keys to avoid residual allocation. | Add UI hint/warning or provide an option to zero-out unspecified keys once any override is present. |
| M3 | Scenario options | Horizon and gold toggles only alter Scenario A. Other scenarios reuse the same `shockMap` regardless of horizon selection. | Users may expect horizon switch to impact other scenarios (e.g., Stagflation year-1 vs multi-year). | Either disable horizon toggles for scenarios that don’t support them or extend scenario data with multi-horizon shock maps. |
| M4 | Purchasing power adjustment | Real mode divides all asset/liability after-values by `(1 + adjustment)` pulled from scenario options. | Adjustment values are hard-coded guesses (e.g., Cycle -0.18). There’s no time-dimension or compounding detail. | Document explicitly (done in README) and consider moving adjustments into scenario data with source references; maybe allow toggling CPI path or custom entry. |
| M5 | Location risk | Slider simply subtracts additional haircut from `real_estate_value` shock (e.g., base -0.25 → slider 0.20 = -0.45). | With large sliders, total shock can exceed -100%; no guardrails or non-linear behaviour. | Clamp final shock to [-1, 1)? or communicate risk of negative values. Possibly model separate commercial/residential toggles later. |
| M6 | Liabilities | Mortgage and margin debt stay constant; no interest-rate or margin-call dynamics. | Real-world events might force liquidation or rate changes, but the model keeps liabilities static, leading to optimistic survival. | Acknowledge as known limitation (already in README). Future enhancement could add “margin call threshold” or refinance penalty. |
| M7 | Scenario data coverage | Assumptions rely on external sources (Damodaran, etc.) but not all scenarios have citations (B–E are story-driven). | Without clear provenance, future edits may be inconsistent or contested. | Keep `content/sources.md` updated; consider adding inline annotations for B–E (e.g., references to historical analogs). |
| M8 | Category aggregation | Charts show aggregated categories (e.g., “Bonds”) but Top Drivers list uses raw advanced keys. | Users may misunderstand: “Bonds” chart vs “T-Bills” driver. Tooltips help but there’s still divergence. | Optionally add a “Group by simple bucket” toggle for drivers to align visuals. |
| M9 | Serverless assumption | Everything persists to `localStorage`; no server state. | Users switching devices will lose data; cannot export. | Already communicated via banner; future addition could be a local export/import (JSON). |
| M10 | Input validation | We simply parse floats; negative values allowed (useful for liabilities), but positive margin debt input is required. | No guard against entering negative assets (e.g., negative stocks). Could break assumptions. | Add warnings/validation for asset fields if negative values entered accidentally. |

## Summary

The engine is deterministic and transparent, but its realism hinges on weighting assumptions (M1/M2) and the static scenario shocks (M3/M4). Before altering code, consider whether we want to (a) expose more controls for weights, (b) enrich scenario data with multi-horizon values, or (c) keep the model simple and lean harder on documentation. The tooltips, README, and content files should continue to call out these limitations until modelling depth increases.

