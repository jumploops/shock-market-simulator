import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import {
  ADVANCED_ONLY_KEYS,
  SIMPLE_PORTFOLIO_KEYS,
  createInitialFormState,
  getEffectivePortfolioAmounts,
  isLiabilityKey,
} from "./engine/portfolio";
import { computeShock } from "./engine/shockEngine";
import {
  DEFAULT_SCENARIO_ID,
  baseOptions,
  buildInitialOptions,
  scenarioTemplateMap,
  scenarioTemplates,
  scenarioMappingRules,
} from "./data/scenarioTemplates";
import type { ScenarioId } from "./data/scenarioTemplates";
import {
  LOCATION_RISK_MAX,
  LOCATION_RISK_MIN,
  LOCATION_RISK_STEP,
} from "./data/constants";
import { scenarioNarratives } from "./data/scenarioCopy";
import CompositionChart from "./components/CompositionChart";
import WaterfallChart from "./components/WaterfallChart";
import Tooltip from "./components/Tooltip";
import assumptionsContent from "../content/assumptions.md?raw";
import sourcesContent from "../content/sources.md?raw";
import emptyStatesContent from "../content/empty_states.md?raw";
import type {
  AdvancedPortfolioKey,
  HorizonMode,
  Options,
  PortfolioFormState,
  PortfolioKey,
  ScenarioTemplate,
  SimplePortfolioKey,
} from "./types";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const signedCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
  signDisplay: "always",
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "auto",
});

const horizonLabels: Record<Options["horizon"], string> = {
  year1: "Year 1",
  cycle: "Cycle window",
  trough: "Peak -> Trough",
};

const extractBullets = (markdown: string): string[] =>
  markdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.replace(/^-+\s*/, "").trim());

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

type EmptyStateEntry = {
  title: string;
  body: string;
};

const parseEmptyStates = (markdown: string): Record<string, EmptyStateEntry> => {
  const map: Record<string, EmptyStateEntry> = {};

  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim();
    if (!line.startsWith("- ")) {
      continue;
    }

    const cleaned = line.replace(/^-+\s*/, "");
    const match = cleaned.match(/^\*\*(.+?)\*\*\s*-\s*"(.*)"$/);
    if (!match) {
      continue;
    }

    const [, title, bodyRaw] = match;
    const body = bodyRaw.replace(/^"|"$/g, "").trim();
    const key = slugify(title);
    map[key] = { title, body };
  }

  return map;
};

const assumptionsList = extractBullets(assumptionsContent);
const sourcesList = extractBullets(sourcesContent);
const emptyStates = parseEmptyStates(emptyStatesContent);

const STORAGE_KEY = "crashmirror_state_v1";
const PERSIST_VERSION = 1;
const HORIZON_OPTIONS: HorizonMode[] = ["year1", "cycle", "trough"];
const isBrowser = typeof window !== "undefined";

const CATEGORY_DEFINITIONS = [
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

const simpleFieldLabels: Record<SimplePortfolioKey, string> = {
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

const simpleFieldDescriptions: Partial<Record<SimplePortfolioKey, string>> = {
  bonds:
    "Auto-distributes equally into T-Bills, 10Y Treasuries, and IG corporates unless you set the advanced bond fields.",
  stocks:
    "Defaults to US large cap. Use the advanced equity inputs to rebalance into small cap, international, or growth buckets.",
  other:
    "Behaves like Stocks by default. Enter a value in Advanced to pin it to a different asset behaviour.",
  real_estate_value:
    "Scenario shocks apply to property value only. Mortgage stays unchanged, so negative equity can appear here.",
};

const advancedFieldDescriptions: Partial<Record<AdvancedPortfolioKey, string>> = {
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

const advancedKeyOrigins: Partial<Record<PortfolioKey, string>> = (() => {
  const inverse: Partial<Record<PortfolioKey, string>> = {};
  for (const [simpleKey, advancedKeys] of Object.entries(
    scenarioMappingRules.simpleToAdvanced,
  )) {
    const label = simpleFieldLabels[simpleKey as SimplePortfolioKey];
    if (!label) {
      continue;
    }
    for (const advKey of advancedKeys ?? []) {
      inverse[advKey as PortfolioKey] = `Derived from ${label} unless overridden in Advanced.`;
    }
  }
  return inverse;
})();

type PersistedState = {
  version: number;
  scenarioId?: string;
  options?: Partial<Options>;
  formState?: Partial<PortfolioFormState>;
};

const clampLocationRisk = (value: unknown): number => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return LOCATION_RISK_MIN;
  }
  return Math.min(
    Math.max(numeric, LOCATION_RISK_MIN),
    LOCATION_RISK_MAX,
  );
};

const isValidHorizon = (value: unknown): value is Options["horizon"] =>
  typeof value === "string" &&
  (HORIZON_OPTIONS as string[]).includes(value);

const sanitizeOptions = (
  raw: Partial<Options> | undefined,
  template: ScenarioTemplate,
): Options => {
  const base = buildInitialOptions(template);
  if (!raw) {
    return base;
  }

  const horizon = isValidHorizon(raw.horizon) ? raw.horizon : base.horizon;
  const useRealReturns =
    typeof raw.useRealReturns === "boolean"
      ? raw.useRealReturns
      : base.useRealReturns;
  const includeGold =
    typeof raw.includeGoldRevaluation1934 === "boolean"
      ? raw.includeGoldRevaluation1934
      : base.includeGoldRevaluation1934;
  const locationRisk =
    typeof raw.locationRisk === "number"
      ? clampLocationRisk(raw.locationRisk)
      : base.locationRisk;

  return {
    horizon,
    useRealReturns,
    includeGoldRevaluation1934: includeGold,
    locationRisk,
  };
};

const sanitizeFormState = (
  raw: Partial<PortfolioFormState> | undefined,
): PortfolioFormState => {
  const initial = createInitialFormState();
  if (!raw) {
    return initial;
  }

  const simple = { ...initial.simple };
  if (raw.simple) {
    for (const key of SIMPLE_PORTFOLIO_KEYS) {
      const value = raw.simple[key];
      const numeric = Number(value);
      simple[key] = Number.isFinite(numeric) ? numeric : simple[key];
    }
  }

  const advanced: PortfolioFormState["advanced"] = {};
  if (raw.advanced) {
    for (const [key, value] of Object.entries(raw.advanced)) {
      if (value === undefined || value === null) {
        continue;
      }
      const numeric = Number(value);
      if (Number.isFinite(numeric)) {
        advanced[key as AdvancedPortfolioKey] = numeric;
      }
    }
  }

  return {
    simple,
    advanced,
  };
};

const advancedFieldLabels: Record<PortfolioKey, string> = {
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
  growth_equity: "Growth equity",
};

const formatCurrency = (value: number) => currencyFormatter.format(value);
const formatCurrencySigned = (value: number) =>
  signedCurrencyFormatter.format(value);
const shortCurrency = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (abs >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(value);
};
const formatPercent = (value: number) => percentFormatter.format(value);

const getTopImpacts = (resultItems: ReturnType<typeof computeShock>["items"]) =>
  resultItems
    .filter((item) => item.type === "asset" && item.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 5);

const getScenarioLabel = (key: PortfolioKey) =>
  advancedFieldLabels[key] ?? key;

function App() {
  const [formState, setFormState] = useState<PortfolioFormState>(
    createInitialFormState(),
  );
  const [scenarioId, setScenarioId] =
    useState<ScenarioId>(DEFAULT_SCENARIO_ID);
  const [options, setOptions] = useState<Options>(() =>
    buildInitialOptions(scenarioTemplateMap[DEFAULT_SCENARIO_ID]),
  );
  const hasRestoredRef = useRef(false);
  const skipScenarioSyncRef = useRef(false);

  const scenarioTemplate = scenarioTemplateMap[scenarioId];

  useEffect(() => {
    if (!isBrowser || hasRestoredRef.current) {
      return;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as PersistedState;
      if (!parsed || typeof parsed !== "object") {
        return;
      }

      const candidateScenarioId =
        typeof parsed.scenarioId === "string" &&
        parsed.scenarioId in scenarioTemplateMap
          ? (parsed.scenarioId as ScenarioId)
          : DEFAULT_SCENARIO_ID;

      const templateForOptions =
        scenarioTemplateMap[candidateScenarioId] ?? scenarioTemplate;

      if (parsed.formState) {
        setFormState(sanitizeFormState(parsed.formState));
      }

      if (parsed.options) {
        setOptions(sanitizeOptions(parsed.options, templateForOptions));
      }

      if (candidateScenarioId !== scenarioId) {
        skipScenarioSyncRef.current = true;
        setScenarioId(candidateScenarioId);
      }
    } catch (error) {
      console.warn("CrashMirror: unable to restore state", error);
    } finally {
      hasRestoredRef.current = true;
    }
  }, [scenarioId, scenarioTemplate]);

  useEffect(() => {
    setOptions((prev) => {
      if (skipScenarioSyncRef.current) {
        skipScenarioSyncRef.current = false;
        return prev;
      }
      const initial = buildInitialOptions(scenarioTemplate);
      const preserveReal =
        prev.useRealReturns !== baseOptions.useRealReturns;
      return {
        ...prev,
        ...initial,
        useRealReturns: preserveReal
          ? prev.useRealReturns
          : initial.useRealReturns,
      };
    });
  }, [scenarioId, scenarioTemplate]);

  useEffect(() => {
    if (!isBrowser || !hasRestoredRef.current) {
      return;
    }

    try {
      const payload: PersistedState = {
        version: PERSIST_VERSION,
        scenarioId,
        options,
        formState,
      };
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(payload),
      );
    } catch (error) {
      console.warn("CrashMirror: unable to persist state", error);
    }
  }, [formState, options, scenarioId]);

  const effectivePortfolio = useMemo(
    () => getEffectivePortfolioAmounts(formState),
    [formState],
  );

  const shockResult = useMemo(
    () => computeShock(effectivePortfolio, scenarioTemplate, options),
    [effectivePortfolio, options, scenarioTemplate],
  );

  const topImpacts = useMemo(
    () => getTopImpacts(shockResult.items),
    [shockResult.items],
  );

  const narrative = useMemo(
    () => scenarioNarratives[scenarioTemplate.notesKey] ?? [],
    [scenarioTemplate.notesKey],
  );

  const aggregatedCategories = useMemo(() => {
    const afterMap = new Map<PortfolioKey, number>();
    for (const item of shockResult.items) {
      afterMap.set(item.key, item.after);
    }

    return CATEGORY_DEFINITIONS.map((definition) => {
      const before = definition.keys.reduce(
        (acc, key) => acc + (effectivePortfolio[key as PortfolioKey] ?? 0),
        0,
      );
      const after = definition.keys.reduce(
        (acc, key) => acc + (afterMap.get(key as PortfolioKey) ?? 0),
        0,
      );
      const delta = after - before;
      return {
        ...definition,
        before,
        after,
        delta,
      };
    }).filter(
      (category) =>
        Math.abs(category.before) > 1e-6 || Math.abs(category.after) > 1e-6,
    );
  }, [effectivePortfolio, shockResult.items]);

  const compositionChartData = useMemo(() => {
    if (aggregatedCategories.length === 0) {
      return [];
    }

    const beforeRow: Record<string, string | number> = { state: "Now" };
    const afterRow: Record<string, string | number> = {
      state: options.useRealReturns ? "After (real)" : "After",
    };

    for (const category of aggregatedCategories) {
      beforeRow[category.key] = category.before;
      afterRow[category.key] = category.after;
    }

    return [beforeRow, afterRow];
  }, [aggregatedCategories, options.useRealReturns]);

  const compositionCategories = useMemo(
    () =>
      aggregatedCategories.map((category) => ({
        key: category.key,
        label: category.label,
        color: category.color,
      })),
    [aggregatedCategories],
  );

  const WATERFALL_LIMIT = 6;

  const waterfallData = useMemo(() => {
    const sorted = aggregatedCategories
      .filter((category) => Math.abs(category.delta) > 1e-6)
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    if (sorted.length === 0) {
      return [];
    }

    const primary = sorted.slice(0, WATERFALL_LIMIT).map((category) => ({
      key: category.key,
      label: category.label,
      delta: category.delta,
    }));

    if (sorted.length > WATERFALL_LIMIT) {
      const remainderDelta = sorted
        .slice(WATERFALL_LIMIT)
        .reduce((acc, category) => acc + category.delta, 0);
      if (Math.abs(remainderDelta) > 1e-6) {
        primary.push({
          key: "other_contributions",
          label: "Other buckets",
          delta: remainderDelta,
        });
      }
    }

    return primary;
  }, [aggregatedCategories]);

  const portfolioTotals = useMemo(() => {
    let cash = 0;
    let nonCash = 0;
    let liabilities = 0;

    for (const key of Object.keys(effectivePortfolio) as PortfolioKey[]) {
      const value = effectivePortfolio[key] ?? 0;
      if (!value) {
        continue;
      }

      if (isLiabilityKey(key)) {
        liabilities += value;
      } else if (key === "cash_insured" || key === "cash_other") {
        cash += value;
      } else {
        nonCash += value;
      }
    }

    return { cash, nonCash, liabilities };
  }, [effectivePortfolio]);

  const hasAnyInput =
    portfolioTotals.cash > 0 ||
    portfolioTotals.nonCash > 0 ||
    portfolioTotals.liabilities > 0;

  const isZeroPortfolio =
    hasAnyInput &&
    portfolioTotals.nonCash === 0 &&
    portfolioTotals.liabilities === 0;

  const topDriversEmptyMessage =
    (!hasAnyInput && emptyStates.no_inputs?.body) ||
    (isZeroPortfolio && emptyStates.zero_portfolio?.body) ||
    "Add positions to see contributions.";

  const realReturnsHint = emptyStates.real_returns_disabled;

  const handleSimpleChange =
    (key: SimplePortfolioKey) => (event: ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      const value =
        raw === "" ? 0 : Number.parseFloat(raw.replace(/,/g, ""));
      if (Number.isNaN(value)) {
        return;
      }

      setFormState((prev) => ({
        ...prev,
        simple: {
          ...prev.simple,
          [key]: value,
        },
      }));
    };

  const handleAdvancedChange =
    (key: PortfolioKey) => (event: ChangeEvent<HTMLInputElement>) => {
      const raw = event.target.value;
      const value =
        raw === "" ? undefined : Number.parseFloat(raw.replace(/,/g, ""));

      if (value !== undefined && Number.isNaN(value)) {
        return;
      }

      setFormState((prev) => {
        const nextAdvanced = { ...prev.advanced };
        if (value === undefined) {
          delete nextAdvanced[key];
        } else {
          nextAdvanced[key] = value;
        }

        return {
          ...prev,
          advanced: nextAdvanced,
        };
      });
    };

  const handleScenarioChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setScenarioId(event.target.value as ScenarioId);
  };

  const handleHorizonChange =
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value as Options["horizon"];
      setOptions((prev) => ({
        ...prev,
        horizon: value,
      }));
    };

  const handleLocationRiskChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const value = Number.parseFloat(event.target.value);
    if (Number.isNaN(value)) {
      return;
    }

    setOptions((prev) => ({
      ...prev,
      locationRisk: value,
    }));
  };

  const handleGoldToggle = (event: ChangeEvent<HTMLInputElement>) => {
    setOptions((prev) => ({
      ...prev,
      includeGoldRevaluation1934: event.target.checked,
    }));
  };

  const handleRealToggle = (event: ChangeEvent<HTMLInputElement>) => {
    setOptions((prev) => ({
      ...prev,
      useRealReturns: event.target.checked,
    }));
  };

  const netWorthBefore = shockResult.totals.netWorthBefore;
  const netWorthAfter = shockResult.totals.netWorthAfter;
  const netWorthDelta = shockResult.totals.netWorthDelta;
  const netWorthDeltaPct = shockResult.totals.netWorthDeltaPct;
  const purchasingPowerAdjustment =
    shockResult.totals.purchasingPowerAdjustment;

  const netWorthAfterLabel = options.useRealReturns
    ? "Net worth (after — real)"
    : "Net worth (after)";
  const changeLabel = options.useRealReturns ? "Change (real)" : "Change";

  return (
    <div className="app">
      <header className="header">
        <h1>CrashMirror prototype</h1>
        <p>
          Enter a rough portfolio, choose a crash template, and preview
          the impact. This is a functional scaffold for the shock
          engine—visual polish will follow.
        </p>
      </header>

      <section className="panel">
        <h2>Portfolio inputs</h2>
        <div className="grid">
          {SIMPLE_PORTFOLIO_KEYS.map((key) => (
            <label key={key} className="field">
              <span className="field-label">
                <span>
                  {simpleFieldLabels[key]}
                  {isLiabilityKey(key as PortfolioKey) ? " (liability)" : ""}
                </span>
                {simpleFieldDescriptions[key] && (
                  <Tooltip
                    label={<span className="tooltip-icon">i</span>}
                    content={simpleFieldDescriptions[key] as string}
                  />
                )}
              </span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                step="1000"
                value={formState.simple[key]}
                onChange={handleSimpleChange(key)}
              />
            </label>
          ))}
        </div>

        <details className="advanced">
          <summary>Advanced splits</summary>
          <div className="grid">
            {ADVANCED_ONLY_KEYS.map((key) => (
              <label key={key} className="field">
                <span className="field-label">
                  <span>{getScenarioLabel(key)}</span>
                  {advancedFieldDescriptions[key] && (
                    <Tooltip
                      label={<span className="tooltip-icon">i</span>}
                      content={advancedFieldDescriptions[key] as string}
                    />
                  )}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="1000"
                  value={formState.advanced[key] ?? ""}
                  onChange={handleAdvancedChange(key)}
                />
              </label>
            ))}
          </div>
          <div className="advanced-options">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={options.useRealReturns}
                onChange={handleRealToggle}
              />
              Show results in real terms (adjust for inflation/deflation)
            </label>
          </div>
          {emptyStates.advanced_without_totals && (
            <p className="helper-text">
              {emptyStates.advanced_without_totals.body}
            </p>
          )}
          {!options.useRealReturns && realReturnsHint && (
            <p className="helper-text">{realReturnsHint.body}</p>
          )}
        </details>
      </section>

      <section className="panel">
        <h2>Scenario</h2>
        <div className="scenario-badge">
          <span>{scenarioTemplate.name}</span>
          <span>| {horizonLabels[options.horizon]}</span>
          <span>| {options.useRealReturns ? "Real" : "Nominal"}</span>
        </div>
        <div className="scenario-grid">
          <div className="control-row">
            <label className="control-label" htmlFor="scenario-select">
              Template
            </label>
            <select
              id="scenario-select"
              value={scenarioId}
              onChange={handleScenarioChange}
            >
              {scenarioTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div className="control-row">
            <span className="control-label">Horizon</span>
            <div className="radio-group">
              {HORIZON_OPTIONS.map((mode) => (
                <label key={mode} className="radio-option">
                  <input
                    type="radio"
                    name="horizon"
                    value={mode}
                    checked={options.horizon === mode}
                    onChange={handleHorizonChange}
                  />
                  {mode === "year1" && "Year 1"}
                  {mode === "cycle" && "Cycle"}
                  {mode === "trough" && "Peak -> Trough"}
                </label>
              ))}
            </div>
          </div>

          <div className="control-row slider-control">
            <label className="control-label" htmlFor="location-risk">
              Location risk
            </label>
            <input
              id="location-risk"
              type="range"
              min={LOCATION_RISK_MIN}
              max={LOCATION_RISK_MAX}
              step={LOCATION_RISK_STEP}
              value={options.locationRisk}
              onChange={handleLocationRiskChange}
            />
            <span className="range-value">
              {(options.locationRisk * 100).toFixed(0)}% extra haircut
            </span>
          </div>

          {scenarioId === "A_1929" && (
            <label className="checkbox">
              <input
                type="checkbox"
                checked={options.includeGoldRevaluation1934}
                onChange={handleGoldToggle}
              />
              Include 1934 gold revaluation (+68%)
            </label>
          )}
        </div>

        <p className="muted small-note local-note">
          Saved locally in this browser only. Nothing leaves this page.
        </p>
      </section>

      <section className="panel results">
        <h2>Shock preview</h2>
        {!hasAnyInput && emptyStates.no_inputs && (
          <p className="empty-state">
            <strong>{emptyStates.no_inputs.title}:</strong>{" "}
            {emptyStates.no_inputs.body}
          </p>
        )}
        <div className="results-summary">
          <div>
            <span className="result-label">Net worth (now)</span>
            <strong>{formatCurrency(netWorthBefore)}</strong>
          </div>
          <div>
            <span className="result-label">{netWorthAfterLabel}</span>
            <strong>{formatCurrency(netWorthAfter)}</strong>
          </div>
          <div>
            <span className="result-label">{changeLabel}</span>
            <strong>
              {formatCurrency(netWorthDelta)} (
              {formatPercent(netWorthDeltaPct)})
            </strong>
          </div>
        </div>
        {options.useRealReturns && (
          <p className="muted small-note">
            Purchasing power shift: {formatPercent(purchasingPowerAdjustment)} (
            {horizonLabels[options.horizon]})
          </p>
        )}

        <div className="chart-section">
          <div className="chart-card">
            <h3>Portfolio mix</h3>
            {compositionChartData.length > 0 ? (
              <CompositionChart
                data={compositionChartData}
                categories={compositionCategories}
                formatCurrency={shortCurrency}
              />
            ) : (
              <p className="muted chart-empty">
                Add assets to see the mix shift.
              </p>
            )}
          </div>
          <div className="chart-card">
            <h3>Contribution waterfall</h3>
            {waterfallData.length > 0 ? (
              <WaterfallChart
                data={waterfallData}
                formatCurrency={formatCurrencySigned}
              />
            ) : (
              <p className="muted chart-empty">
                Add positions to trace the net change.
              </p>
            )}
          </div>
        </div>

        <div className="impacts">
          <h3>Top drivers</h3>
          {topImpacts.length === 0 ? (
            <p className="muted">{topDriversEmptyMessage}</p>
          ) : (
            <ul>
              {topImpacts.map((impact) => (
                <li key={impact.key}>
                  <span className="field-label">
                    <span>{getScenarioLabel(impact.key)}</span>
                    {(advancedFieldDescriptions[impact.key as AdvancedPortfolioKey] ||
                      advancedKeyOrigins[impact.key]) && (
                      <Tooltip
                        label={<span className="tooltip-icon">i</span>}
                        content={
                          advancedFieldDescriptions[impact.key as AdvancedPortfolioKey] ??
                          advancedKeyOrigins[impact.key]
                        }
                      />
                    )}
                  </span>
                  <span>
                    {formatCurrency(impact.delta)} (
                    {formatPercent(impact.shock)})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="scenario-notes">
          <h3>Why it changed</h3>
          {narrative.length === 0 ? (
            <p className="muted">
              Scenario copy coming soon - the notes file is empty for this template.
            </p>
          ) : (
            <ul>
              {narrative.map((bullet, idx) => (
                <li key={idx}>{bullet}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="content-callouts">
          <details>
            <summary>Key assumptions</summary>
            <ul>
              {assumptionsList.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </details>
          <details>
            <summary>Source anchors</summary>
            <ul>
              {sourcesList.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </details>
        </div>
      </section>
    </div>
  );
}

export default App;
