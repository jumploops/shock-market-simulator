## Dot-com boom/bust scenario — scoping notes (2025-02-19)

### 1. Objective & framing
- Add a sixth preset that captures the late-1990s tech mania followed by the 2000–2002 collapse.
- Make it clear this scenario is tech-heavy and differs from broad-market crashes already modeled.
- Support both “boom” uplift (useful for sensitivity testing) and the “bust” drawdown within our existing horizon toggles.

### 2. Historical anchors to collect
- Nasdaq Composite: peak March 2000 vs trough October 2002 (≈ −78%), plus calendar-year 1999 rally (~+85%).
- S&P 500 broad market: peak-to-trough during dot-com bust (≈ −49%) and annual path 2000–2002.
- Sector dispersion: tech vs non-tech (e.g., Dow Jones Internet, MSCI Growth, small-cap value).
- Fixed income: 10Y Treasury total return 2000–2002 (benefited from rate cuts), IG vs HY default spikes, money-market yields collapsing.
- Venture/IPO fallout: percentage of internet IPOs delisted or trading below offer (qualitative input for “Other assets” bucket).
- Real estate & inflation backdrop: national CRE/residential price indices remained roughly flat to mildly negative; CPI subdued (~2–3%).
- Policy context: Federal Reserve rate cuts, liquidity programs, and investor sentiment data for narrative copy.
- Sources to tap: Shiller data, Federal Reserve Economic Data (FRED), Nasdaq fact sheets, academic post-mortems (e.g., Ofek/Richardson 2002).

### 3. Modeling approach (draft)
- Scenario metadata:
  - `id`: `F_dot_com`
  - Display name: “F) Dot-com boom/bust”
  - `defaultHorizon`: consider `year1` to emphasize the sharp reversal after the peak.
  - `notesKey`: `F_dot_com`
  - `purchasingPowerAdjustments`: low inflation erosion (roughly +2% to +5% over the window; CPI ~2–3% annually).
- Final shock map assumptions (anchored to 2000–2002 drawdowns; tune during implementation if better data surfaces):
  - `us_large`: −0.45 (S&P 500 peak-to-trough ≈ −49%).
  - `growth_equity`: −0.78 (Nasdaq composite peak-to-trough ≈ −78%).
  - `us_small`: −0.35 (Russell 2000 growth ≈ −64%, value ≈ −20%; blended mid-point).
  - `international`: −0.30 (MSCI EAFE drawdown ≈ −35% over the period).
  - `tbills`: 0.03 (cash-like total return as rates collapsed).
  - `treasuries_10y`: 0.15 (10Y TR index ~+35% cumulative; Year-1 focus ~+15%).
  - `corporates_ig`: −0.05 (spread widening plus Enron/WorldCom hits).
  - `corporates_hy`: −0.25 (telecom defaults ~25–30% losses).
  - `real_estate_value`: −0.08 (national home prices flat with tech hub softness).
  - `gold`: 0.12 (gold rose from ~$280 to ~$314 by 2002).
  - `cash_insured` / `cash_other`: 0.
  - `other`: −0.60 (venture-backed IPOs went effectively to zero; captures concentrated tech bets).
- Horizon tailoring:
  - `year1`: capture peak-to-one-year-later move (steepest drop).
  - `cycle`: 1998–2003 window blending boom (+) then bust (−); may yield small net negative, so consider presenting separate “Boom” and “Bust” toggles in copy.
  - `trough`: worst point (October 2002) vs peak.
- Location risk slider: leave existing behavior but add guidance that tech hubs (SF, Seattle) saw bigger office vacancy spikes.

### 4. Engine & data tasks
- Extend `scenarioTemplates` with the new template and ensure `shockMap` keys cover advanced buckets in use (growth equity, HY credit, etc.).
- Update `scenarioNarratives` JSON with four concise bullets (boom context, tech collapse, bond behavior, venture fallout).
- Add supporting copy to `content/sources.md` and `assumptions.md` (dot-com methodology, survivorship bias warning).
- Rename the advanced label to “Growth (tech) equity” so users recognise the bucket without relying on tooltips.
- Verify advanced portfolio defaults: consider pre-populating “Growth (tech) equity” split or providing a quick toggle for “Tech-heavy allocation”.
- Review `purchasingPowerAdjustments` logic to ensure low inflation is represented (may be near-zero vs other scenarios).
- Ensure charts handle more extreme negative values for `other` bucket (venture losses) without layout regressions.

### 5. UX & communication updates
- Add scenario card description and tooltip clarifying that returns are concentrated in tech/telecom.
- Highlight in Top Drivers narrative that diversification away from tech dampens the shock.
- Possibly add an optional “boom preview” note: e.g., “Had you held through 1999, portfolio ran +X before reversing.”
- Surface scenario-specific disclaimer about survivorship bias (many dot-com names went to zero, indices understate total losses).
- Update README and marketing copy to mention the new scenario category once implemented.

### 6. Open questions for the team
- Do we want to model separate boom vs bust phases explicitly (two linked templates) or rely on horizon toggles?
- Should we introduce a new portfolio sub-bucket (e.g., `venture_startup`) for users with heavy private tech exposure?
- How granular should the tech shock be? (e.g., differentiate between large profitable tech vs speculative internet plays.)
- Are we comfortable with available data quality for private market/value-at-delisting estimates, or do we rely on broad public indices?
- Is there interest in layering macro policy toggles (e.g., Fed put activation) or keep scenario streamlined like others?

### 7. Next steps checklist
- [x] Finalize quantitative targets for each asset bucket with citations.
- [x] Draft narrative copy + tooltip language and circulate for review.
- [x] Implement scenario in `scenarioTemplates.ts` and associated copy files.
- [ ] QA charts/results for tech-heavy mock portfolios.
- [x] Update documentation + screenshots once scenario ships. (Screenshot unchanged by choice.)
