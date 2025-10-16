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

export type PortfolioKey = keyof PortfolioAdvanced;
export type SimplePortfolioKey = keyof PortfolioSimple;
export type AdvancedPortfolioKey = keyof PortfolioAdvanced;

export type LiabilityKey = "mortgage" | "margin_debt";

export type ShockMap = Partial<Record<PortfolioKey, number>>;

export interface ScenarioTemplate {
  id: string;
  name: string;
  defaultHorizon: HorizonMode;
  notesKey: string;
  shockMap: ShockMap;
  options?: {
    goldRevaluation1934Enabled?: boolean;
    realVsNominalDefault?: "nominal" | "real";
    locationRiskDefault?: number;
    purchasingPowerAdjustments?: Partial<Record<HorizonMode, number>>;
  };
}

export interface Options {
  horizon: HorizonMode;
  useRealReturns: boolean;
  includeGoldRevaluation1934: boolean;
  locationRisk: number;
}

export interface ScenarioMappingRules {
  simpleToAdvanced: Partial<Record<keyof PortfolioSimple, PortfolioKey[]>>;
}

export type PortfolioAmounts = Record<AdvancedPortfolioKey, number>;

export interface PortfolioFormState {
  simple: Record<SimplePortfolioKey, number>;
  advanced: Partial<Record<AdvancedPortfolioKey, number>>;
}

export type ShockValueType = "asset" | "liability";

export interface ShockedValue {
  key: PortfolioKey;
  before: number;
  after: number;
  delta: number;
  shock: number;
  type: ShockValueType;
}

export interface ShockComputation {
  items: ShockedValue[];
  totals: {
    assetsBefore: number;
    assetsAfter: number;
    liabilitiesBefore: number;
    liabilitiesAfter: number;
    netWorthBefore: number;
    netWorthAfter: number;
    netWorthDelta: number;
    netWorthDeltaPct: number;
    purchasingPowerAdjustment: number;
  };
}

export type ScenarioNarratives = Record<string, string[]>;
