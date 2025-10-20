import { scenarioMappingRules } from "../data/scenarioTemplates";
import type {
  AdvancedPortfolioKey,
  PortfolioKey,
  SimplePortfolioKey,
} from "../types";

export const CATEGORY_DEFINITIONS = [
  {
    key: "cash",
    label: "Cash",
    color: "#33658A",
    keys: ["cash_insured", "cash_other"],
  },
  {
    key: "bonds",
    label: "Bonds",
    color: "#55A630",
    keys: ["tbills", "treasuries_10y", "corporates_ig", "corporates_hy"],
  },
  {
    key: "stocks",
    label: "Stocks",
    color: "#EE964B",
    keys: ["us_large", "us_small", "international", "growth_equity"],
  },
  {
    key: "gold",
    label: "Gold",
    color: "#F4B942",
    keys: ["gold"],
  },
  {
    key: "real_estate",
    label: "Real estate",
    color: "#7D4E57",
    keys: ["real_estate_value"],
  },
  {
    key: "other",
    label: "Other assets",
    color: "#8884D8",
    keys: ["other"],
  },
] as const;

export const SIMPLE_FIELD_LABELS: Record<SimplePortfolioKey, string> = {
  cash_insured: "Cash (insured)",
  cash_other: "Cash (other/uninsured)",
  bonds: "Bonds (simple total)",
  stocks: "Stocks (broad)",
  gold: "Gold",
  real_estate_value: "Real estate (value)",
  mortgage: "Mortgage balance",
  other: "Other assets",
  margin_debt: "Margin debt",
};

export const SIMPLE_FIELD_DESCRIPTIONS: Partial<Record<SimplePortfolioKey, string>> = {
  bonds:
    "Auto-distributes equally into T-Bills, 10Y Treasuries, and IG corporates unless you set the advanced bond fields.",
  stocks:
    "Defaults to US large cap. Use the advanced equity inputs to rebalance into small cap, international, or growth buckets.",
  other:
    "Behaves like Stocks by default. Enter a value in Advanced to pin it to a different asset behaviour.",
  real_estate_value:
    "Scenario shocks apply to property value only. Mortgage stays unchanged, so negative equity can appear here.",
  gold:
    "Physical bullion, vaulted allocations, or gold ETFs you want shocked like the metal itself.",
  mortgage:
    "Outstanding principal on property loans; treated as a liability that does not reprice in shocks.",
  margin_debt:
    "Borrowed funds against brokerage accounts; stays fixed while asset values move during the scenarios.",
};

export const ADVANCED_FIELD_DESCRIPTIONS: Partial<Record<AdvancedPortfolioKey, string>> = {
  tbills:
    "Portion of Bonds mapped to short-term bills. Overrides the default split when you enter a value.",
  treasuries_10y:
    "Portion of Bonds allocated to 10-year Treasuries (duration-heavy).",
  corporates_ig:
    "Investment-grade credit share of the Bonds bucket. Entering a value replaces the default equal split.",
  corporates_hy:
    "High-yield corporates participate only when you assign an amount here.",
  us_large:
    "Large-cap equities; inherits the Stocks bucket unless you redistribute in Advanced.",
  us_small:
    "Small-cap equities. Requires an explicit value to participate in shocks.",
  international:
    "International equities allocated only when you set an amount.",
  growth_equity:
    "Growth/tech-style equities. Only moves when this field is populated.",
};

export const ADVANCED_FIELD_LABELS: Record<PortfolioKey, string> = {
  cash_insured: "Cash (insured)",
  cash_other: "Cash (other/uninsured)",
  bonds: "Bonds (simple total)",
  stocks: "Stocks (broad)",
  gold: "Gold",
  real_estate_value: "Real estate (value)",
  mortgage: "Mortgage balance",
  other: "Other assets",
  margin_debt: "Margin debt",
  tbills: "T-Bills",
  treasuries_10y: "10Y Treasuries",
  corporates_ig: "Investment-grade corporates",
  corporates_hy: "High-yield corporates",
  us_large: "US large cap",
  us_small: "US small cap",
  international: "International equity",
  growth_equity: "Growth (tech) equity",
};

export const ADVANCED_KEY_ORIGINS: Partial<Record<PortfolioKey, string>> = (() => {
  const inverse: Partial<Record<PortfolioKey, string>> = {};
  for (const [simpleKey, advancedKeys] of Object.entries(
    scenarioMappingRules.simpleToAdvanced,
  )) {
    const label = SIMPLE_FIELD_LABELS[simpleKey as SimplePortfolioKey];
    if (!label) {
      continue;
    }
    for (const advKey of advancedKeys ?? []) {
      inverse[advKey as PortfolioKey] = `Derived from ${label} unless overridden in Advanced.`;
    }
  }
  return inverse;
})();

export const getScenarioLabel = (key: PortfolioKey): string =>
  ADVANCED_FIELD_LABELS[key] ?? key;
