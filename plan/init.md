Below is a **comprehensive product spec** for a lightweight web tool that lets users enter a simplified portfolio and see what a **“1929‑style crash”** could do to their net worth in **today’s (2025) environment**. It also ships with 4 forward‑looking “what‑if” crash scenarios the user can switch between. I’ve been explicit about **what’s known** (assumptions, data sources, fixed choices) and **what’s unknown** (open questions/decisions we should lock before implementation).

---

## 0) Working name & elevator pitch

**Working name:** *CrashMirror*
**One‑liner:** *Enter your portfolio. Pick a crash template (1929 or “what‑if”). Immediately see the new net worth and exactly what changed—and why.*

---

## 1) Core use cases & success criteria

**Use cases**

1. A user types in approximate holdings (cash, bonds, stocks, gold, real estate, other).
2. Selects **Scenario = 1929** (or another prebuilt scenario).
3. Sees **instant recalculated net worth** on the form page and a **results page** with deltas, simple graphs, and a short “what happened & why” explainer mapped to that scenario.

**What success looks like**

* < 2 minutes from first visit to insight.
* No jargon, no log‑in required for v1.
* Visuals that **explain** (not just “wow”): a before/after bar chart, a waterfall of contributions to loss/gain, and a short, sourced explainer.

---

## 2) Scenarios (A–E): one “1929” + four forward‑looking “what‑ifs”

Each scenario is a **shock template** (percentage move applied to user‑entered positions). “A” is historically anchored; B–E are deliberately stylized for exploration. Values are **defaults** users can edit in “Advanced”.

> 🧭 **Horizon modes (user toggle):**
>
> * **Year‑1 shock** (single‑year move)
> * **Trough shock** (peak‑to‑trough move)
> * **Cycle window** (e.g., 1929–1932 or 1929–1934; used for assets like gold where policy changed in 1934)

### A) **1929 analog (deflationary bust, bank panics)**

**Why:** Equity collapse, banking stress, deflation, policy mistakes; bond yields generally fell; gold revalued later (1934).
**Evidence anchors:**
• Dow peak‑to‑trough loss ≈ **−89%** (Sep 3, 1929 to Jul 8, 1932). ([Slickcharts][1])
• S&P (total return) calendar‑year path 1929–1932 cumulatively ≈ **−65%**; 10‑yr Treasuries cumulatively ≈ **+15%**; T‑bills ≈ **+11%**; Baa corporates ≈ **+8%**; Real estate ≈ **−23%**; Gold ≈ flat through 1932 but **+~68%** by end‑1934 after revaluation to $35/oz. ([Stern School of Business][2])
• Gold price revalued from **$20.67 → $35** in 1934 (≈ +69%). ([World Gold Council][3])
• Real estate: large local variation; Chicago land values down **≈50%** (1928–1932) vs modest national averages. ([Harvard Business School][4])
• Black Monday −12.8/−13% one‑day drop; part of the 1929 break. ([Federal Reserve History][5])

**Default shocks (editables):**

* **US stocks (broad):** −65% (Cycle 1929–1932) or −85% (Peak→Trough toggle)
* **Small‑cap stocks:** −82% (Cycle 1929–1932)
* **T‑bills (cash‑like):** +11% (Cycle) | default Year‑1: +3%
* **10‑yr Treasuries:** +15% (Cycle)
* **IG corporates (Baa proxy):** +8% (Cycle) with **−16%** Year‑1 stress year option
* **Real estate (national average proxy):** −25% (with “location risk” slider up to −50% for commercial/overbuilt markets)
* **Gold:** *Two modes* → “through 1932” ≈ 0% | “through 1934 revaluation” ≈ +68%
  *(All cycle values derived/rounded from Damodaran’s 1929–1932/34 lines; see Data section.)* ([Stern School of Business][2])

---

### B) **Stagflation 2.0 (energy/inflation shock)**

**Story:** Policy/inflation shock drives real yields up; bonds struggle, equities derate; gold and cash yields help.
**Shocks (defaults):** Stocks −45%; 10‑yr Treasuries −30%; IG corporates −20%; T‑bills **+6%** (rate jump); Real estate −20%; Gold **+40%**.

### C) **Bondquake (rates snapback)**

**Story:** A rapid term‑premium spike (duration event) hits bonds first, then equities & property via refinancing costs.
**Shocks:** Stocks −35%; 10‑yr Treasuries **−30%** (≈ duration 8 × +400 bps); IG corporates −25%; HY −35%; T‑bills **+8%**; Real estate −25%; Gold −10%.

### D) **Credit crunch & property bust**

**Story:** Credit events + refinancing wall → defaults; property reprices hard; safe govvies rally.
**Shocks:** Stocks −50%; 10‑yr Treasuries **+10%** (flight to quality); IG corporates −20%; HY −40%; T‑bills +4%; Real estate **−35%** (location slider up to −50%); Gold +10%.

### E) **Tech‑lever meltdown (AI unwind)**

**Story:** Narrow leadership reverses; growth equity down most; safe rates compress.
**Shocks:** Stocks (broad) −45% (Growth bucket −65% if split enabled); 10‑yr Treasuries +12%; IG corporates −10%; T‑bills +3%; Real estate −10%; Gold +20%.

> **Note (cash in 2025):** FDIC insurance covers deposits **to at least $250,000 per depositor per ownership category per bank**; we model **insured cash at 0% price loss** (opportunity cost shows only under “real terms”). ([FDIC][6])

---

## 3) Data & methodology (what’s known)

**Primary historical anchors for Scenario A (1929)**

* **Stocks, T‑bills, 10‑yr Treasuries, Baa corporates, “Real estate”, Gold** annual U.S. returns: **Aswath Damodaran** (1928–present), Jan 2025 update. We will reference specific rows for 1929–1934. ([Stern School of Business][2])
* **Equity crash magnitude (peak→trough):** DJIA −89% (Sep 1929 → Jul 1932). ([Slickcharts][1])
* **Gold revaluation:** U.S. $20.67→$35 in 1934 per Proclamation 2072 / Gold Reserve Act. ([World Gold Council][3])
* **Banking panic context:** 1930–31 panics turned downturn into depression. ([Federal Reserve History][7])
* **Local real estate variation:** Chicago land −50% (1928–1932). ([Harvard Business School][4])

**Modeling choices (v1)**

* **Nominal vs Real:** Default to **nominal** results with a toggle to **real (inflation‑adjusted)** when a scenario includes an inflation path. (1929 had deflation; we can show a footnote that real returns for high‑grade bonds looked better given falling prices.) ([Bureau of Labor Statistics][8])
* **Price shocks, not path‑dependent P&L:** v1 applies **multiplicative shocks** to each asset bucket. (Timeline playback is a v1.5 enhancement.)
* **Gold in 1929:** Offer both **through‑1932** and **through‑1934** options to reflect revaluation mechanics.
* **Cash in 2025:** **Insured cash loss = 0%** (price), with an **inflation toggle** to show purchasing‑power erosion, not price haircuts. ([FDIC][6])

---

## 4) Unknowns & decisions to lock

* **Scope of asset buckets** (keep it simple vs. add Advanced splits):

  * **Simple** (default): Cash (insured), Cash (uninsured/other), Bonds (Treasury/IG blend), Stocks (broad), Gold, Real Estate (with mortgage field), Other.
  * **Advanced** (toggle): T‑bills, 10‑yr Treasuries, IG corporates, HY corporates, US large/small, International ex‑US, RE (primary vs investment), Commodities, Crypto, Private business equity.
* **Horizon default for 1929:** Year‑1 vs Cycle (1929–1932) vs Peak→Trough. (Recommendation: **Cycle** as default, with a conspicuous option to “Stress to trough”.)
* **Real estate series:** Use Damodaran’s “Real Estate” line for national proxy **and** expose a **“location risk” slider** referencing Hoyt‑type local drawdowns. ([Stern School of Business][2])
* **Corporate bond treatment:** One‑line “IG corporates” vs split IG/HY (and whether to include default‑loss haircuts).
* **Taxes & liquidity:** v1 **pre‑tax**, **no liquidity haircuts**; v1.5 could add capital‑gains/tax‑lot awareness and “liquidity discount” sliders.
* **Liabilities:** Include **mortgage and margin debt** fields now? (Recommendation: Yes. If provided, we haircut collateral and recompute **equity**.)
* **Geo:** US‑centric by default; v2 can add non‑US templates.

---

## 5) Information architecture & flows

### Pages

1. **Input (Form)**

   * **Top bar:** **“Net Worth (Now)”** — big numeric, live‑updating as the user types.
   * **Scenario selector:** Radio: **A) 1929** | **B–E what‑ifs**.
   * **Asset inputs:** Numeric fields with simple tooltips.
   * **Advanced** disclosure (optional splits + horizon toggle + real/nominal toggle).
   * **Primary CTA:** “Simulate crash”. Secondary: “Explain assumptions”.

2. **Results**

   * **Hero panel (top‑left):** **“Net Worth (After)”** — big numeric.
   * **Delta chips:** “Change”, “% change”, “Max drawdown mode used”.
   * **Visuals (v1):**

     * **Before vs After** stacked bar by asset bucket.
     * **Waterfall**: Start net worth → asset impacts → end net worth.
     * **Attribution table**: each asset, its shock %, its dollar impact.
   * **Why it changed (for the chosen scenario):** 4–6 short bullets mapping data→story (e.g., “Banks failed in waves in 1930–31, deflation raised real rates…”). ([Federal Reserve History][7])
   * **Footnotes / sources drawer** with link-outs to the specific data references used. (Citations list below.)

3. **Assumptions & methodology (static page)**

   * “What we know / what we infer” and precise data anchors with links.

**Empty/error states**

* Insufficient data → default zeros.
* Negative net worth → clear badge + copy (“debt exceeds assets under this shock”).

---

## 6) Visual style (neobrutalist)

* **Palette:** Monochrome base (#000 / #fff) with **one accent** (e.g., electric blue) for scenario tags & focus states.
* **Typography:** Large, utilitarian; e.g., **system UI / Inter / JetBrains Mono**.
* **Layout:** Tight grid, **hard edges**, **2–4 px borders**, no shadows, no gradients.
* **Affordances:** Obvious radio buttons, chunky sliders, keyboard‑friendly inputs.
* **Motion:** Minimal—1–2 frame “snap” transitions.

---

## 7) Calculation engine (deterministic v1)

**Inputs**

```
Portfolio {
  cash_insured
  cash_uninsured (optional)
  bonds (or: tbills, treasuries_10y, corporates_ig, corporates_hy)
  stocks (or: us_large, us_small, intl)
  gold
  real_estate_value
  real_estate_debt (mortgage)
  other
}
Scenario {
  name
  horizon_mode: "year1" | "cycle" | "trough"
  shock_map: { asset_key -> percentage_return }
  notes / footnotes
}
Options {
  nominal_or_real
  include_gold_revaluation (A only)
  location_risk (for real estate)
}
```

**Computation (pseudo)**

* `real_estate_equity = max(real_estate_value - real_estate_debt, 0)`
* Apply shock to each **asset value** (and to **real_estate_equity** as a single line item).
* Sum post‑shock assets → **NetWorth_after**.
* Produce **by‑asset impact** list for visuals.

**Known numeric anchors used for A/1929 (Cycle mode by default)**

* Stocks −65%, Small caps −82%, T‑bills +11%, 10‑yr Treasuries +15%, Baa corporates +8%, Real estate −23% (national proxy), Gold ≈ 0% (or +68% if “through 1934” toggle). ([Stern School of Business][2])

---

## 8) “Why did this happen?” content blocks

**A) 1929 analog**

* **Equity collapse:** Peak→trough around **−89%**; earnings and multiples compressed amid contraction. ([Slickcharts][1])
* **Banking panics:** 1930–31 waves of failures magnified the downturn. ([Federal Reserve History][7])
* **Deflation dynamics:** Falling prices raised **real** debt burdens/real yields; high‑grade bonds did comparatively fine. ([Bureau of Labor Statistics][8])
* **Gold regime shift:** 1934 revaluation from $20.67→$35 lifted gold’s dollar price ~**+69%**. ([World Gold Council][3])
* **Housing divergence:** National averages vs city‑level busts (e.g., Chicago land −50%). ([Harvard Business School][4])

**B–E** each get a short, plain‑English “narrative” blurb (as described in §2) tied to their shocks.

---

## 9) Validation, edge cases & safeguards

* **Rounding:** Show currency with 0 decimals for big numbers; show % with 1 decimal.
* **Extremes:** Support very large portfolios (up to 12–13 digits) without scientific notation.
* **Negatives:** Clearly display negative equity if RE debt > RE value post‑shock.
* **Education vs advice:** Prominent disclaimer: *“Educational simulation; not investment advice.”*
* **Cash safety in 2025:** Label explicitly that **insured deposits** are covered to **$250k per depositor per ownership category per bank**. ([FDIC][6])

---

## 10) Non‑functional requirements

* **Perf:** All calculations client‑side; no round‑trips required.
* **Privacy:** No sign‑in; no data leaves the browser in v1.
* **A11y:** Full keyboard support; visible focus; WCAG AA color contrasts.
* **I18n (later):** Currency/number formatting via Intl APIs.

---

## 11) Tech stack (proposed)

* **Frontend:** TypeScript + SvelteKit or Next.js (either fine), **no external charting heavyweights**; use a tiny SVG chart util.
* **State:** URL‑safe JSON (so a scenario can be shared as a link).
* **Design tokens:** CSS variables; prefers‑color‑scheme support.

---

## 12) Visualizations (v1)

* **“Now vs After” stacked bar** (asset composition).
* **Waterfall** from current net worth to post‑shock net worth (bar for each asset bucket’s impact).
* **Scenario card** with short bullets and a link to **Sources** drawer.

---

## 13) Copy (draft)

* **Form headline:** “What’s in your portfolio?”
* **Primary CTA:** “Simulate crash”
* **Hero numbers:** “Net Worth (Now)” → “Net Worth (After)”
* **Explainers:** short, source‑backed blurbs per scenario.

---

## 14) Testing & analytics

* **Unit tests** on shock math, rounding, negative equity.
* **Snapshot tests** for rendering across scenarios.
* **Light telemetry (optional in v1):** time‑to‑first‑result, scenario selection counts (off by default for privacy).

---

## 15) Roadmap ideas (beyond v1)

* **Timeline playback** of 1929 monthly path (stocks/bonds/gold). (Use Shiller monthly + simple bond proxies.) ([Yale Economics][9])
* **Stress sliders** (e.g., widen spreads +300 bps; duration = 9; home price location shock).
* **Real/nominal side‑by‑side** with CPI path overlays. ([Bureau of Labor Statistics][8])
* **Downloadable PDF** report with charts and the assumptions table.

---

## 16) Source list (for the in‑app “Sources” drawer)

* **Damodaran, A.** *Historical Returns on Stocks, Bonds, Bills & more (1928–2024)* — table entries for 1929–1934 (stocks, T‑bills, 10‑yr Treasuries, Baa corporates, real estate, gold). ([Stern School of Business][2])
* **Federal Reserve History** — Black Monday 1929; Banking Panics 1930–31. ([Federal Reserve History][5])
* **SlickCharts (DJIA crash page)** — peak (381.17) to trough (41.22) ≈ −89%. ([Slickcharts][1])
* **World Gold Council / Proclamation 2072** — 1934 gold revaluation to $35/oz; **Gold Reserve Act** explainer. ([World Gold Council][3])
* **Hoyt (via HBS paper)** — Chicago land values −50% (1928–1932) context. ([Harvard Business School][4])
* **FDIC** — Deposit insurance basics and limits, for 2025 cash treatment. ([FDIC][6])

---

## 17) What we will show the user (at a glance)

* **On the form:** a bold **Net Worth (Now)** number that updates as they type; a simple scenario switcher.
* **On the results page:** an equally bold **Net Worth (After)** number, a short “*Here’s what changed*” with a one‑screen set of charts, and a tiny **“Why (1929)”** panel that explains the move with the above sources.

---

### TL;DR — What’s locked vs open

**Locked (ready to implement)**

* Deterministic **shock engine** with editable scenario templates.
* **A–E scenarios** with sensible defaults and a **horizon toggle**.
* **Neobrutalist** UI with big “Net Worth” numbers on both pages.
* Historical anchors and citations for 1929.

**Open (needs a call before build)**

* Exact default **horizon** for Scenario A (recommend “Cycle 1929–1932”).
* Whether to expose **Advanced** asset splits in v1 or v1.5.
* Inclusion of **liabilities** (mortgage/margin) in v1 (recommended: yes).
* Whether to default **gold** in A to “through 1932” (flat) or “through 1934” (+68%).

If you’d like, I can convert this into a sprint‑ready ticket set (UX wireframe checklist, TypeScript interfaces, and a JSON file of the five scenario templates).

[1]: https://www.slickcharts.com/dowjones/crash/1929?utm_source=chatgpt.com "Dow Jones 1929 Stock Market Crash Chart - SlickCharts"
[2]: https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html "pages.stern.nyu.edu"
[3]: https://www.gold.org/sites/default/files/documents/after-the-gold-standard/1934jan31.pdf?utm_source=chatgpt.com "1934jan31 - World Gold Council"
[4]: https://www.hbs.edu/ris/Publication%20Files/Anna_tom_59f6af5f-72f2-4a72-9ffa-c604d236cc98.pdf?utm_source=chatgpt.com "Real Estate Prices During the Roaring Twenties and the Great Depression"
[5]: https://www.federalreservehistory.org/essays/stock-market-crash-of-1929?utm_source=chatgpt.com "Stock Market Crash of 1929 - Federal Reserve History"
[6]: https://www.fdic.gov/resources/deposit-insurance/understanding-deposit-insurance?utm_source=chatgpt.com "Understanding Deposit Insurance - FDIC.gov"
[7]: https://www.federalreservehistory.org/essays/banking-panics-1930-31?utm_source=chatgpt.com "Banking Panics of 1930-31 - Federal Reserve History"
[8]: https://www.bls.gov/opub/mlr/2014/article/pdf/one-hundred-years-of-price-change-the-consumer-price-index-and-the-american-inflation-experience.pdf?utm_source=chatgpt.com "One hundred years of price change: the Consumer Price Index and the ..."
[9]: https://www.econ.yale.edu/~shiller/data.htm?utm_source=chatgpt.com "Online Data - Robert Shiller"




## 1) Decision log (locked defaults)

1. **Scenario A (1929) horizon default:** **Cycle 1929–1932** (user can switch to Year‑1 or Peak→Trough).
2. **Advanced asset splits:** **Included in v1** behind a collapsed **Advanced** section (on the form).
3. **Liabilities in v1:** **Yes** — *Mortgage* (for real estate) and *Margin debt* (optional) included.
4. **Gold (Scenario A) default:** **“Through 1932” (≈ flat)**; optional toggle for **“include 1934 revaluation”** in Advanced.
5. **Real vs nominal default:** **Nominal** by default, with an **Inflation/deflation (real)** toggle in Advanced.
6. **Real‑estate location risk slider:** Default **0%**, range **0–50%** additional haircut (applied additively to the base RE shock).

---

## 2) Updated spec snapshot (only the deltas)

* **Input (Form) page**

  * **Big number:** “Net Worth (Now)” updates as user types (sum of assets minus liabilities).
  * **Scenario selector:** A (1929) default; B–E alternative scenarios.
  * **Assets (simple):** Cash (insured), Cash (other), Bonds, Stocks, Gold, Real Estate (value), Other.
  * **Liabilities (simple):** **Mortgage**, **Margin debt** (optional).
  * **Advanced (collapsed):** T‑Bills, 10‑Year Treasuries, IG Corporates, HY Corporates, US Large, US Small, International, Growth (equity style), RE location risk slider, **Horizon** (Year‑1/Cycle/Trough), **Nominal vs Real** toggle, **Gold revaluation (1934)** toggle.

* **Results page**

  * **Big number:** “Net Worth (After)”.
  * **Deltas:** absolute and % change, horizon mode used.
  * **Visuals:** Before/After stacked bars (composition), Waterfall (attribution by asset bucket), and an attribution table (shock %, dollar impact, notes).
  * **“Why it changed” panel:** 4–6 bullets tailored to the chosen scenario (short, plain‑English).

* **Calculation notes (consistency updates)**

  * Real estate is modeled as **Asset(=property value)** shocked by scenario %, **Debt** unchanged; Net impact = shocked property value − mortgage. (We surface **negative equity** if value < debt.)
  * Margin debt reduces net worth directly; **we do not** model path‑dependent margin calls in v1 (documented in assumptions).
  * Cash (insured) price shock = 0%. “Real terms” effects show under the **Real** toggle.

---

## 3) Backlog — follow‑on tasks (prioritized, with acceptance criteria)

> T‑shirt sizing: XS (<½ day), S (~1 day), M (~2–3 days), L (≥1 week). Owners use placeholders: **PM**, **Design**, **FE**, **DS**, **QA**, **Legal**.

### A. Product & data decisions

1. **Finalize 1929 data anchors (Cycle mode)** — *S* — **PM/DS**

   * AC: A single source‑of‑truth table (1929–1932/34) with the returns we show in‑app, and a short footnote explaining gold revaluation timing and RE proxy limitations.
   * Output: `historical_anchors.md` + CSV used to populate scenario A notes.

2. **Scenario narratives (A–E)** — *S* — **PM/Design**

   * AC: Each scenario has 4–6 bullets (≤280 chars each) and a 1‑sentence summary.
   * Output: `scenarios_copy.json` (keys match template IDs below).

3. **Assumptions page copy** — *S* — **PM/Legal**

   * AC: Includes “educational only” disclaimer, data limitations, and how we treat insured cash, liabilities, and inflation/deflation toggles.
   * Output: `assumptions.md`.

### B. UX & visual design

4. **Wireframes: Form & Results (neobrutalist)** — *M* — **Design**

   * AC: Frame for each state: empty, partially filled, fully filled; results with all three visuals; mobile and desktop.
   * Output: Figma frames + redlines for spacing, borders (2–4 px), typographic scale.

5. **Micro‑copy & tooltips** — *S* — **Design/PM**

   * AC: Tooltips for each input; “location risk” explainer; “Gold revaluation” explainer; “Real vs Nominal” explainer.
   * Output: `tooltips.json`.

### C. Frontend engineering

6. **Data model & types** — *S* — **FE**

   * AC: TypeScript interfaces for `Portfolio`, `ScenarioTemplate`, `Options`, plus validators.
   * Output: `types.ts`, `validators.ts`.

7. **Calculation engine** — *M* — **FE**

   * AC: Pure functions with 100% unit test coverage:

     * shocks applied per bucket,
     * RE value shocked then subtract mortgage,
     * margin debt subtraction,
     * attribution map (per bucket deltas),
     * handling of missing buckets (treated as 0).
   * Output: `engine.ts`, `engine.test.ts`.

8. **Scenario templates loader** — *S* — **FE**

   * AC: Loads `scenarios_v0_1.json`; validates; exposes to UI store; supports future overrides via URL param.
   * Output: `scenarios.ts`.

9. **State & persistence** — *S* — **FE**

   * AC: URL‑safe state sharing; localStorage persistence; reset button.
   * Output: `state.ts`.

10. **Charts (SVG)** — *M* — **FE**

* AC: Accessible charts with text alternatives; no external heavy chart libs; handles large numbers; single accent color applied via CSS variable.
* Output: `charts/stackedBar.tsx`, `charts/waterfall.tsx`.

11. **Neobrutalist UI shell** — *M* — **FE/Design**

* AC: Base layout, typography, buttons, radio group, sliders; big number components for “Now” and “After”.
* Output: `ui/` components + `tokens.css`.

### D. Content integration

12. **“Why it changed” renderer** — *S* — **FE**

* AC: Pulls bullets from scenario JSON; shows horizon + toggles chosen in badges.
* Output: `ScenarioNotes.tsx`.

13. **Sources drawer** — *S* — **FE/PM**

* AC: Expandable drawer with the small source list; link out safely (rel=noopener).
* Output: `SourcesDrawer.tsx`.

### E. QA & safeguards

14. **Unit tests: math & edge cases** — *S* — **QA/FE**

* AC: Negative equity, zero inputs, large numbers (≥ 1e12), all scenarios.
* Output: Extended tests in `engine.test.ts`.

15. **A11y pass** — *S* — **QA/Design**

* AC: Keyboard nav, focus states visible, color contrast AA.
* Output: A11y checklist with screenshots.

16. **Copy review (compliance)** — *XS* — **Legal/PM**

* AC: Disclaimers present; no advice language; cash insurance statement scoped to US.

### F. Optional nice‑to‑haves (defer if time‑boxed)

17. **CSV/PDF export** — *M* — **FE**
18. **Scenario editor (user‑defined)** — *M* — **FE/PM**

---

## 4) Scenario templates (v0.1 JSON)

> Keys are opinionated and match the Advanced splits. If a user hasn’t split an asset (e.g., only “Bonds”), we’ll map that line to the relevant composite (see “mapping rules” just below).

```json
{
  "version": "0.1",
  "mappingRules": {
    "simpleToAdvanced": {
      "cash_insured": ["cash_insured"],
      "cash_other": ["cash_other"],
      "bonds": ["tbills", "treasuries_10y", "corporates_ig"],
      "stocks": ["us_large"],
      "gold": ["gold"],
      "real_estate_value": ["real_estate_value"],
      "other": ["stocks"]  // default: map to broad stocks unless user overrides
    }
  },
  "templates": [
    {
      "id": "A_1929",
      "name": "A) 1929 analog (deflationary bust)",
      "defaultHorizon": "cycle",
      "notesKey": "A_1929",
      "options": {
        "goldRevaluation1934Enabled": false,
        "realVsNominalDefault": "nominal",
        "locationRiskDefault": 0
      },
      "shockMap": {
        "tbills": 0.11,
        "treasuries_10y": 0.15,
        "corporates_ig": 0.08,
        "us_large": -0.65,
        "us_small": -0.82,
        "gold": 0.0,
        "real_estate_value": -0.25,
        "cash_insured": 0.0,
        "cash_other": 0.0,
        "other": -0.45
      }
    },
    {
      "id": "B_stagflation",
      "name": "B) Stagflation 2.0",
      "defaultHorizon": "year1",
      "notesKey": "B_stagflation",
      "shockMap": {
        "us_large": -0.45,
        "treasuries_10y": -0.30,
        "corporates_ig": -0.20,
        "tbills": 0.06,
        "real_estate_value": -0.20,
        "gold": 0.40,
        "cash_insured": 0.0,
        "cash_other": 0.0,
        "other": -0.35
      }
    },
    {
      "id": "C_bondquake",
      "name": "C) Bondquake (rates snapback)",
      "defaultHorizon": "year1",
      "notesKey": "C_bondquake",
      "shockMap": {
        "us_large": -0.35,
        "treasuries_10y": -0.30,
        "corporates_ig": -0.25,
        "tbills": 0.08,
        "real_estate_value": -0.25,
        "gold": -0.10,
        "cash_insured": 0.0,
        "cash_other": 0.0,
        "other": -0.30
      }
    },
    {
      "id": "D_credit_crunch",
      "name": "D) Credit crunch & property bust",
      "defaultHorizon": "year1",
      "notesKey": "D_credit_crunch",
      "shockMap": {
        "us_large": -0.50,
        "treasuries_10y": 0.10,
        "corporates_ig": -0.20,
        "tbills": 0.04,
        "real_estate_value": -0.35,
        "gold": 0.10,
        "cash_insured": 0.0,
        "cash_other": 0.0,
        "other": -0.40
      }
    },
    {
      "id": "E_tech_lever",
      "name": "E) Tech‑lever meltdown (AI unwind)",
      "defaultHorizon": "year1",
      "notesKey": "E_tech_lever",
      "shockMap": {
        "us_large": -0.45,
        "growth_equity": -0.65,
        "treasuries_10y": 0.12,
        "corporates_ig": -0.10,
        "tbills": 0.03,
        "real_estate_value": -0.10,
        "gold": 0.20,
        "cash_insured": 0.0,
        "cash_other": 0.0,
        "other": -0.35
      }
    }
  ]
}
```

### Notes on mapping & behavior

* If the user **doesn’t** expand Advanced, “Bonds” maps to the weighted average of T‑Bills, 10‑Year Treasuries, and IG corporates (equal weights for v1).
* “Other” defaults to **stocks** behavior; users can override in Advanced or we hide “Other” in v1 if you prefer.
* **Location risk slider**: final RE shock = base shock − slider value (e.g., −0.25 base with +0.20 slider → −0.45).
* **Gold revaluation toggle** (Scenario A only): replaces gold’s shock 0.00 with +0.68 when enabled.
* **Peak→Trough** mode (Scenario A): swaps `us_large` −0.65 with −0.85 (and we leave bonds/gold as Cycle by default unless the user explicitly selects a different sub‑mode).

---

## 5) TypeScript interfaces (for reference)

```ts
export type HorizonMode = "year1" | "cycle" | "trough";
export interface PortfolioSimple {
  cash_insured: number;
  cash_other?: number;
  bonds?: number;
  stocks?: number;
  gold?: number;
  real_estate_value?: number;
  mortgage?: number;
  other?: number;
  margin_debt?: number;
}
export interface PortfolioAdvanced extends PortfolioSimple {
  tbills?: number;
  treasuries_10y?: number;
  corporates_ig?: number;
  corporates_hy?: number;
  us_large?: number;
  us_small?: number;
  international?: number;
  growth_equity?: number;
}
export interface ScenarioTemplate {
  id: string;
  name: string;
  defaultHorizon: HorizonMode;
  notesKey: string; // look up copy for “Why it changed”
  shockMap: Record<string, number>;
  options?: {
    goldRevaluation1934Enabled?: boolean;
    realVsNominalDefault?: "nominal" | "real";
    locationRiskDefault?: number; // 0..0.5
  };
}
export interface Options {
  horizon: HorizonMode;
  useRealReturns: boolean;
  includeGoldRevaluation1934: boolean;
  locationRisk: number; // 0..0.5 additive
}
```

---

## 6) Acceptance tests (spot checks we’ll automate)

* **All‑cash portfolio (insured)** → After = Now (nominal), delta = 0; Real toggle reduces purchasing power appropriately.
* **RE with mortgage:** $500k value, $400k debt; Scenario A (RE −25%) → After RE = $375k − $400k = **−$25k** equity contribution; badge shows “Negative equity in real estate”.
* **Margin debt:** $100k stocks, $20k margin → Scenario A (−65%) → Stocks to $35k; Net worth delta reflects equity loss plus unchanged margin liability.
* **Scenario toggle:** Switching A→B recalculates instantly without refreshing; charts and “Why it changed” content update.
* **Peak→Trough switch (A):** Big number changes from Cycle to Trough; delta badge updates mode label.

---

## 7) Content to draft (short list we’ll attach in the repo)

* `assumptions.md` (disclaimer; coverage of insured cash; US‑centric scope).
* `scenarios_copy.json` (A–E bullets; ≤280 chars each).
* `sources.md` (short references list, human‑readable).
* `empty_states.md` (example copy for blank inputs and errors).

