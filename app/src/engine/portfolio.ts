import type {
  PortfolioAmounts,
  PortfolioFormState,
  PortfolioKey,
  SimplePortfolioKey,
} from "../types";
import { scenarioMappingRules } from "../data/scenarioTemplates";

export const SIMPLE_PORTFOLIO_KEYS: SimplePortfolioKey[] = [
  "cash_insured",
  "cash_other",
  "bonds",
  "stocks",
  "gold",
  "real_estate_value",
  "mortgage",
  "other",
  "margin_debt",
];

export const PORTFOLIO_KEYS: PortfolioKey[] = [
  "cash_insured",
  "cash_other",
  "bonds",
  "stocks",
  "gold",
  "real_estate_value",
  "mortgage",
  "other",
  "margin_debt",
  "tbills",
  "treasuries_10y",
  "corporates_ig",
  "corporates_hy",
  "us_large",
  "us_small",
  "international",
  "growth_equity",
];

const LIABILITY_KEYS = new Set<PortfolioKey>(["mortgage", "margin_debt"]);

export const ADVANCED_ONLY_KEYS: PortfolioKey[] = [
  "tbills",
  "treasuries_10y",
  "corporates_ig",
  "corporates_hy",
  "us_large",
  "us_small",
  "international",
  "growth_equity",
];

export const createInitialFormState = (): PortfolioFormState => ({
  simple: SIMPLE_PORTFOLIO_KEYS.reduce(
    (acc, key) => {
      acc[key] = 0;
      return acc;
    },
    {} as Record<SimplePortfolioKey, number>,
  ),
  advanced: {},
});

export const createEmptyPortfolioAmounts = (): PortfolioAmounts =>
  PORTFOLIO_KEYS.reduce(
    (acc, key) => {
      acc[key] = 0;
      return acc;
    },
    {} as PortfolioAmounts,
  );

export const isLiabilityKey = (key: PortfolioKey): boolean =>
  LIABILITY_KEYS.has(key);

export const getEffectivePortfolioAmounts = (
  state: PortfolioFormState,
): PortfolioAmounts => {
  const amounts = createEmptyPortfolioAmounts();

  // Apply advanced overrides first.
  for (const [key, value] of Object.entries(state.advanced)) {
    if (value === undefined || Number.isNaN(value)) {
      continue;
    }
    const typedKey = key as PortfolioKey;
    amounts[typedKey] += value;
  }

  for (const key of SIMPLE_PORTFOLIO_KEYS) {
    const value = state.simple[key] ?? 0;
    if (!value) {
      continue;
    }

    if (isLiabilityKey(key)) {
      amounts[key] += value;
      continue;
    }

    const mappedKeys =
      scenarioMappingRules.simpleToAdvanced[key] ?? [key as PortfolioKey];

    const overrideSum = mappedKeys.reduce((sum, mappedKey) => {
      const overrideValue = state.advanced[mappedKey];
      return sum + (overrideValue ?? 0);
    }, 0);

    const remaining = Math.max(value - overrideSum, 0);

    if (remaining === 0) {
      continue;
    }

    const share = remaining / mappedKeys.length;

    for (const mappedKey of mappedKeys) {
      amounts[mappedKey] += share;
    }
  }

  return amounts;
};
