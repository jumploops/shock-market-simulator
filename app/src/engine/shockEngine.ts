import {
  GOLD_REVALUATION_1934_SHOCK,
  PEAK_TO_TROUGH_US_LARGE_SHOCK,
  YEAR1_CORPORATES_IG_1929_SHOCK,
  YEAR1_TBILLS_1929_SHOCK,
} from "../data/constants";
import { PORTFOLIO_KEYS, isLiabilityKey } from "./portfolio";
import type {
  Options,
  PortfolioAmounts,
  ShockComputation,
  ShockMap,
  ShockedValue,
  ScenarioTemplate,
} from "../types";

const applyScenarioAdjustments = (
  template: ScenarioTemplate,
  options: Options,
): ShockMap => {
  const adjusted: ShockMap = { ...template.shockMap };

  if (template.id === "A_1929") {
    if (options.horizon === "trough") {
      adjusted.us_large = PEAK_TO_TROUGH_US_LARGE_SHOCK;
    } else if (options.horizon === "year1") {
      adjusted.tbills = YEAR1_TBILLS_1929_SHOCK;
      adjusted.corporates_ig = YEAR1_CORPORATES_IG_1929_SHOCK;
    }

    if (options.includeGoldRevaluation1934) {
      adjusted.gold = GOLD_REVALUATION_1934_SHOCK;
    }
  }

  if (options.locationRisk) {
    const base = adjusted.real_estate_value ?? 0;
    adjusted.real_estate_value = base - options.locationRisk;
  }

  return adjusted;
};

export const computeShock = (
  amounts: PortfolioAmounts,
  template: ScenarioTemplate,
  options: Options,
): ShockComputation => {
    const shockMap = applyScenarioAdjustments(template, options);
    const items: ShockedValue[] = [];

    let assetsBefore = 0;
    let assetsAfter = 0;
    let liabilitiesBefore = 0;
    let liabilitiesAfter = 0;

    for (const key of PORTFOLIO_KEYS) {
      const before = amounts[key] ?? 0;
      const type = isLiabilityKey(key) ? "liability" : "asset";
      const shock = type === "asset" ? shockMap[key] ?? 0 : 0;

      if (Math.abs(before) < 1e-9) {
        continue;
      }

      const after = type === "asset" ? before * (1 + shock) : before;
      const delta = after - before;

      if (type === "asset") {
        assetsBefore += before;
        assetsAfter += after;
      } else {
        liabilitiesBefore += before;
        liabilitiesAfter += after;
      }

      items.push({
        key,
        before,
        after,
        delta,
        shock,
        type,
      });
    }

    const netWorthBefore = assetsBefore - liabilitiesBefore;
    const netWorthAfter = assetsAfter - liabilitiesAfter;
    const netWorthDelta = netWorthAfter - netWorthBefore;
    const netWorthDeltaPct =
      netWorthBefore === 0 ? 0 : netWorthDelta / netWorthBefore;

    return {
      items,
      totals: {
        assetsBefore,
        assetsAfter,
        liabilitiesBefore,
        liabilitiesAfter,
        netWorthBefore,
        netWorthAfter,
        netWorthDelta,
        netWorthDeltaPct,
      },
    };
};
