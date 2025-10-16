import { describe, expect, it } from "vitest";
import {
  ADVANCED_ONLY_KEYS,
  createEmptyPortfolioAmounts,
  createInitialFormState,
  getEffectivePortfolioAmounts,
} from "../portfolio";
import { computeShock } from "../shockEngine";
import {
  buildInitialOptions,
  scenarioTemplateMap,
} from "../../data/scenarioTemplates";

describe("portfolio normalization", () => {
  it("distributes simple buckets across advanced splits while honoring overrides", () => {
    const state = createInitialFormState();
    state.simple.bonds = 300_000;
    state.advanced.tbills = 100_000;

    const amounts = getEffectivePortfolioAmounts(state);

    expect(amounts.tbills).toBeCloseTo(100_000 + 200_000 / 3, 2);
    expect(amounts.treasuries_10y).toBeCloseTo(200_000 / 3, 2);
    expect(amounts.corporates_ig).toBeCloseTo(200_000 / 3, 2);
  });

  it("keeps liabilities separate from asset shocks", () => {
    const state = createInitialFormState();
    state.simple.stocks = 200_000;
    state.simple.mortgage = 150_000;

    const amounts = getEffectivePortfolioAmounts(state);

    expect(amounts.us_large).toBeCloseTo(200_000, 2);
    expect(amounts.mortgage).toBe(150_000);
  });

  it("initializes advanced-only keys to zero to avoid undefined math downstream", () => {
    const state = createInitialFormState();
    const amounts = getEffectivePortfolioAmounts(state);

    for (const key of ADVANCED_ONLY_KEYS) {
      expect(amounts[key]).toBe(0);
    }
  });
});

describe("shock engine", () => {
  it("applies scenario shocks and purchasing power adjustments correctly", () => {
    const template = scenarioTemplateMap.B_stagflation;
    const options = {
      ...buildInitialOptions(template),
      horizon: "year1",
      useRealReturns: true,
    };

    const amounts = createEmptyPortfolioAmounts();
    amounts.cash_insured = 100_000;

    const result = computeShock(amounts, template, options);
    expect(result.totals.assetsBefore).toBe(100_000);
    expect(result.totals.assetsAfter).toBeCloseTo(100_000 / 1.09, 2);
    expect(result.totals.netWorthAfter).toBeCloseTo(100_000 / 1.09, 2);
    expect(result.totals.purchasingPowerAdjustment).toBeCloseTo(0.09, 4);
  });

  it("handles deflationary adjustments by increasing real net worth", () => {
    const template = scenarioTemplateMap.A_1929;
    const options = {
      ...buildInitialOptions(template),
      horizon: "cycle",
      useRealReturns: true,
    };

    const amounts = createEmptyPortfolioAmounts();
    amounts.cash_insured = 50_000;

    const result = computeShock(amounts, template, options);
    // 50,000 nominal cash, deflation of 18% -> divide by 0.82.
    expect(result.totals.netWorthAfter).toBeCloseTo(
      50_000 / (1 - 0.18),
      2,
    );
    expect(result.totals.netWorthAfter).toBeGreaterThan(
      result.totals.netWorthBefore,
    );
  });
});
