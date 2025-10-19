import type {
  Options,
  ScenarioMappingRules,
  ScenarioTemplate,
} from "../types";

export const scenarioMappingRules: ScenarioMappingRules = {
  simpleToAdvanced: {
    cash_insured: ["cash_insured"],
    cash_other: ["cash_other"],
    bonds: ["tbills", "treasuries_10y", "corporates_ig"],
    stocks: ["us_large"],
    gold: ["gold"],
    real_estate_value: ["real_estate_value"],
    other: ["other"],
  },
};

export const scenarioTemplates: ScenarioTemplate[] = [
  {
    id: "A_1929",
    name: "A) 1929 analog (deflationary bust)",
    defaultHorizon: "cycle",
    notesKey: "A_1929",
    options: {
      goldRevaluation1934Enabled: false,
      realVsNominalDefault: "nominal",
      locationRiskDefault: 0,
      purchasingPowerAdjustments: {
        year1: -0.08,
        cycle: -0.18,
        trough: -0.25,
      },
    },
    shockMap: {
      tbills: 0.11,
      treasuries_10y: 0.15,
      corporates_ig: 0.08,
      us_large: -0.65,
      us_small: -0.82,
      gold: 0,
      real_estate_value: -0.25,
      cash_insured: 0,
      cash_other: 0,
      other: -0.45,
    },
  },
  {
    id: "B_stagflation",
    name: "B) Stagflation 2.0",
    defaultHorizon: "year1",
    notesKey: "B_stagflation",
    options: {
      purchasingPowerAdjustments: {
        year1: 0.09,
        cycle: 0.15,
        trough: 0.18,
      },
    },
    shockMap: {
      us_large: -0.45,
      treasuries_10y: -0.3,
      corporates_ig: -0.2,
      tbills: 0.06,
      real_estate_value: -0.2,
      gold: 0.4,
      cash_insured: 0,
      cash_other: 0,
      other: -0.35,
    },
  },
  {
    id: "C_bondquake",
    name: "C) Bondquake (rates snapback)",
    defaultHorizon: "year1",
    notesKey: "C_bondquake",
    options: {
      purchasingPowerAdjustments: {
        year1: 0.04,
        cycle: 0.06,
        trough: 0.08,
      },
    },
    shockMap: {
      us_large: -0.35,
      treasuries_10y: -0.3,
      corporates_ig: -0.25,
      tbills: 0.08,
      real_estate_value: -0.25,
      gold: -0.1,
      cash_insured: 0,
      cash_other: 0,
      other: -0.3,
    },
  },
  {
    id: "D_credit_crunch",
    name: "D) Credit crunch & property bust",
    defaultHorizon: "year1",
    notesKey: "D_credit_crunch",
    options: {
      purchasingPowerAdjustments: {
        year1: 0.02,
        cycle: 0.04,
        trough: 0.06,
      },
    },
    shockMap: {
      us_large: -0.5,
      treasuries_10y: 0.1,
      corporates_ig: -0.2,
      tbills: 0.04,
      real_estate_value: -0.35,
      gold: 0.1,
      cash_insured: 0,
      cash_other: 0,
      other: -0.4,
    },
  },
  {
    id: "E_tech_lever",
    name: "E) Tech-lever meltdown (AI unwind)",
    defaultHorizon: "year1",
    notesKey: "E_tech_lever",
    options: {
      purchasingPowerAdjustments: {
        year1: 0.03,
        cycle: 0.05,
        trough: 0.06,
      },
    },
    shockMap: {
      us_large: -0.45,
      growth_equity: -0.65,
      treasuries_10y: 0.12,
      corporates_ig: -0.1,
      tbills: 0.03,
      real_estate_value: -0.1,
      gold: 0.2,
      cash_insured: 0,
      cash_other: 0,
      other: -0.35,
    },
  },
  {
    id: "F_dot_com",
    name: "F) Dot-com boom/bust",
    defaultHorizon: "year1",
    notesKey: "F_dot_com",
    options: {
      purchasingPowerAdjustments: {
        year1: 0.02,
        cycle: 0.04,
        trough: 0.05,
      },
    },
    shockMap: {
      us_large: -0.45,
      us_small: -0.35,
      international: -0.3,
      growth_equity: -0.78,
      treasuries_10y: 0.15,
      corporates_ig: -0.05,
      corporates_hy: -0.25,
      tbills: 0.03,
      real_estate_value: -0.08,
      gold: 0.12,
      cash_insured: 0,
      cash_other: 0,
      other: -0.6,
    },
  },
];

export type ScenarioId = (typeof scenarioTemplates)[number]["id"];

export const scenarioTemplateMap: Record<ScenarioId, ScenarioTemplate> =
  scenarioTemplates.reduce(
    (acc, template) => {
      acc[template.id as ScenarioId] = template;
      return acc;
    },
    {} as Record<ScenarioId, ScenarioTemplate>,
  );

export const DEFAULT_SCENARIO_ID: ScenarioId = "A_1929";

export const baseOptions: Options = {
  horizon: "cycle",
  useRealReturns: false,
  includeGoldRevaluation1934: false,
  locationRisk: 0,
};

export const buildInitialOptions = (template: ScenarioTemplate): Options => ({
  ...baseOptions,
  horizon: template.defaultHorizon,
  useRealReturns:
    template.options?.realVsNominalDefault === "real"
      ? true
      : baseOptions.useRealReturns,
  includeGoldRevaluation1934:
    template.options?.goldRevaluation1934Enabled ??
    baseOptions.includeGoldRevaluation1934,
  locationRisk:
    template.options?.locationRiskDefault ?? baseOptions.locationRisk,
});
