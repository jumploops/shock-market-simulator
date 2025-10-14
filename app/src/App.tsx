import { ChangeEvent, useEffect, useMemo, useState } from "react";
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
  buildInitialOptions,
  scenarioTemplateMap,
  scenarioTemplates,
} from "./data/scenarioTemplates";
import type { ScenarioId } from "./data/scenarioTemplates";
import {
  LOCATION_RISK_MAX,
  LOCATION_RISK_MIN,
  LOCATION_RISK_STEP,
} from "./data/constants";
import type {
  Options,
  PortfolioFormState,
  PortfolioKey,
  SimplePortfolioKey,
} from "./types";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "auto",
});

const horizonOptions: Options["horizon"][] = ["year1", "cycle", "trough"];

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

  const scenarioTemplate = scenarioTemplateMap[scenarioId];

  useEffect(() => {
    setOptions((prev) => {
      const initial = buildInitialOptions(scenarioTemplate);
      return {
        ...prev,
        ...initial,
        useRealReturns: prev.useRealReturns,
      };
    });
  }, [scenarioId, scenarioTemplate]);

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

  const netWorthBefore = shockResult.totals.netWorthBefore;
  const netWorthAfter = shockResult.totals.netWorthAfter;
  const netWorthDelta = shockResult.totals.netWorthDelta;
  const netWorthDeltaPct = shockResult.totals.netWorthDeltaPct;

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
        <h2>Scenario</h2>
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
            {horizonOptions.map((mode) => (
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
                {mode === "trough" && "Peak → Trough"}
              </label>
            ))}
          </div>
        </div>

        <div className="control-row">
          <label className="control-label" htmlFor="location-risk">
            Location risk (real estate)
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
      </section>

      <section className="panel">
        <h2>Portfolio inputs</h2>
        <div className="grid">
          {SIMPLE_PORTFOLIO_KEYS.map((key) => (
            <label key={key} className="field">
              <span>
                {simpleFieldLabels[key]}
                {isLiabilityKey(key as PortfolioKey) ? " (liability)" : ""}
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
                <span>{getScenarioLabel(key)}</span>
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
        </details>
      </section>

      <section className="panel results">
        <h2>Shock preview</h2>
        <div className="results-summary">
          <div>
            <span className="result-label">Net worth (now)</span>
            <strong>{formatCurrency(netWorthBefore)}</strong>
          </div>
          <div>
            <span className="result-label">Net worth (after)</span>
            <strong>{formatCurrency(netWorthAfter)}</strong>
          </div>
          <div>
            <span className="result-label">Change</span>
            <strong>
              {formatCurrency(netWorthDelta)} (
              {formatPercent(netWorthDeltaPct)})
            </strong>
          </div>
        </div>

        <div className="impacts">
          <h3>Top drivers</h3>
          {topImpacts.length === 0 ? (
            <p className="muted">Add positions to see contributions.</p>
          ) : (
            <ul>
              {topImpacts.map((impact) => (
                <li key={impact.key}>
                  <span>{getScenarioLabel(impact.key)}</span>
                  <span>
                    {formatCurrency(impact.delta)} (
                    {formatPercent(impact.shock)})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

export default App;
