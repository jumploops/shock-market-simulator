# Shock Market Simulator

The Shock Market Simulator is a lightweight web app that lets you explore what a 1929-style crash—or four alternate “what-if” stress events—could do to your modern (2025) portfolio. Enter your holdings, pick a scenario, and watch the engine recalculate your net worth, chart the before/after mix, and surface the biggest drivers.

## What it does

1. **Portfolio inputs**  
   - Quick fields for cash, bonds, stocks, gold, real estate, liabilities, plus an “Other” bucket.  
   - Optional advanced splits map simple buckets (e.g. “Bonds”) into specific assets—T-Bills, 10Y Treasuries, IG/HY credit, etc.—so you can tweak how shocks fan out.

2. **Scenario selector**  
   Five stress templates sit on top of the engine:
   - **A) 1929 analog (deflationary bust)** — built from Damodaran’s 1929-1932 asset returns, FDIC history, World Gold Council’s Gold Reserve Act, and period housing data (e.g., Chicago land prices).  
   - **B) Stagflation 2.0** — inflation shock with bonds and stocks selling off, gold and bills gaining.  
   - **C) Bondquake** — a term-premium spike; long duration gets hit first, equities follow.  
   - **D) Credit crunch & property bust** — refinancing wall, spreads widen; Treasuries rally while property slumps.  
   - **E) Tech-lever meltdown (AI unwind)** — growth equity mean reversion, safe rates fall, gold rallies.

   Horizon modes (Year 1, Cycle, Peak→Trough) and location-risk sliders let you adjust the intensity; Scenario A also exposes the 1934 gold revaluation toggle.

3. **Shock engine**  
   - Applies deterministic percentage moves per asset key (e.g. `us_large: -65%`, `tbills: +11%`).  
   - Handles liabilities (mortgage, margin debt) explicitly—assets get shocked, liabilities stay put.  
   - Offers a “real terms” view by dividing nominal results by CPI-style adjustments derived from the same scenario data.

4. **Results panel**  
   - Big before/after net worth numbers, optional real vs nominal.  
   - Stacked bar snapshot of composition and a waterfall chart that attributes the change.  
   - Top drivers list (with tooltips explaining how simple inputs mapped to the advanced keys).  
   - Scenario-specific “Why it changed” bullets plus collapsible drawers for key assumptions and sources.

## Why these numbers?

| Scenario | Basis | Notes |
|----------|-------|-------|
| 1929 analog | Damodaran “Historical Returns on Stocks, Bonds, Bills & more (1928–2024)”; World Gold Council’s 1934 revaluation; FDIC guidance; Harvard Business School work on Chicago land values. | Stocks -65% (cycle) / -85% (peak→trough), T-Bills +11%, 10Y Treasuries +15%, IG credit +8%, real estate -25% (location slider up to -50%), gold 0% or +68% when toggled. |
| Stagflation 2.0 | Post-1970s style inflation spikes, policy drives real yields up. | Stocks -45%, 10Y Treasuries -30%, IG -20%, T-Bills +6%, real estate -20%, gold +40%. |
| Bondquake | Term-premium shock approximating a 400 bps jump with duration 8. | Stocks -35%, 10Y Treasuries -30%, IG -25%, T-Bills +8%, real estate -25%, gold -10%. |
| Credit crunch & property bust | Flight-to-quality playbook with equity/property stress. | Stocks -50%, 10Y Treasuries +10%, IG -20%, T-Bills +4%, real estate -35% (plus slider), gold +10%. |
| Tech-lever meltdown | Growth unwind narrative, rates compress. | Broad stocks -45%, growth bucket -65% (if split), 10Y Treasuries +12%, IG -10%, T-Bills +3%, real estate -10%, gold +20%. |

Every scenario ships with the sources called out in-app. See `plan/init.md` for the full product spec and the raw scenario JSON plus mapping rules in [`app/src/data/scenarioTemplates.ts`](app/src/data/scenarioTemplates.ts). The deterministic shock calculations live in [`app/src/engine/shockEngine.ts`](app/src/engine/shockEngine.ts), and the fan-out logic that turns “simple” buckets into advanced asset keys is in [`app/src/engine/portfolio.ts`](app/src/engine/portfolio.ts).

## Running it locally

```bash
cd app
pnpm install
pnpm run dev
```

Visit http://localhost:5173/ and start modelling.

## Defaults & caveats

- No authentication, no network calls: everything you enter stays in localStorage.
- Liabilities (mortgage, margin debt) don’t recurse; no forced deleveraging modeled.
- “Other assets” mimic stocks unless you override them in Advanced.
- Advanced overrides subtract from the simple bucket; leaving advanced blank means we split your simple bucket evenly across the mapped assets.
- Real view is a convenience factor based on scenario CPI assumptions—path effects aren’t modeled.

For design and roadmap ideas, see `plan/design-directions.md`; debugging notes live under `debug/`.
