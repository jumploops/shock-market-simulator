import { useCallback, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import {
  ADVANCED_ONLY_KEYS,
  SIMPLE_PORTFOLIO_KEYS,
  getEffectivePortfolioAmounts,
  isLiabilityKey,
} from "../../engine/portfolio";
import { computeShock } from "../../engine/shockEngine";
import { scenarioTemplates } from "../../data/scenarioTemplates";
import type { ScenarioId } from "../../data/scenarioTemplates";
import {
  LOCATION_RISK_MAX,
  LOCATION_RISK_MIN,
  LOCATION_RISK_STEP,
} from "../../data/constants";
import { scenarioNarratives } from "../../data/scenarioCopy";
import CompositionChart from "../CompositionChart";
import type { CompositionRow } from "../CompositionChart";
import WaterfallChart from "../WaterfallChart";
import type { WaterfallDatum } from "../WaterfallChart";
import Tooltip from "../Tooltip";
import assumptionsContent from "../../../content/assumptions.md?raw";
import sourcesContent from "../../../content/sources.md?raw";
import emptyStatesContent from "../../../content/empty_states.md?raw";
import { usePortfolioFormHandlers } from "../../hooks/usePortfolioFormHandlers";
import {
  CATEGORY_DEFINITIONS,
  SIMPLE_FIELD_LABELS as simpleFieldLabels,
  SIMPLE_FIELD_DESCRIPTIONS as simpleFieldDescriptions,
  ADVANCED_FIELD_DESCRIPTIONS as advancedFieldDescriptions,
  ADVANCED_KEY_ORIGINS as advancedKeyOrigins,
  getScenarioLabel,
} from "../../constants/portfolioFields";
import type {
  AdvancedPortfolioKey,
  HorizonMode,
  Options,
  PortfolioFormState,
  PortfolioKey,
  ScenarioTemplate,
  SimplePortfolioKey,
} from "../../types";
import { useAppState } from "../../state/AppStateContext";
import { createCompositionSnapshot } from "../../utils/renderCompositionSnapshot";

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

type EmptyStatesMap = Record<string, EmptyStateEntry>;

const assumptionsList = extractBullets(assumptionsContent);
const sourcesList = extractBullets(sourcesContent);
const emptyStates = parseEmptyStates(emptyStatesContent);

const HORIZON_OPTIONS: HorizonMode[] = ["year1", "cycle", "trough"];


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

const locationRiskLabel = (value: number): string => {
  const percent = Math.round(value * 100);
  let tag = "balanced market";
  if (percent <= 2) tag = "rural";
  else if (percent <= 12) tag = "suburban hub";
  else if (percent <= 25) tag = "commercial i.e. Chicago";
  else tag = "NYC, SF, etc.";
  return `${percent}% extra reduction (${tag})`;
};

const getTopImpacts = (resultItems: ReturnType<typeof computeShock>["items"]) =>
  resultItems
    .filter((item) => item.type === "asset" && item.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 5);

const Dashboard = () => {
  const {
    formState,
    setFormState,
    resetPortfolio,
    scenarioId,
    setScenarioId,
    scenarioTemplate,
    options,
    setOptions,
    reopenOnboarding,
  } = useAppState();

  const {
    handleSimpleChange,
    handleAdvancedChange,
    handleResetPortfolio,
  } = usePortfolioFormHandlers(setFormState, resetPortfolio);

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

  const compositionChartData = useMemo<CompositionRow[]>(() => {
    if (aggregatedCategories.length === 0) {
      return [];
    }

    const beforeRow: CompositionRow = { state: "Now" };
    const afterRow: CompositionRow = {
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

    const primary: WaterfallDatum[] = sorted
      .slice(0, WATERFALL_LIMIT)
      .map((category) => ({
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
    <>
      <div className="app">
        <DashboardHeader />

        <div className="layout">
          <PortfolioInputsPanel
            formState={formState}
            simpleFieldLabels={simpleFieldLabels}
            simpleFieldDescriptions={simpleFieldDescriptions}
            onSimpleChange={handleSimpleChange}
            advancedKeys={ADVANCED_ONLY_KEYS}
            advancedFieldDescriptions={advancedFieldDescriptions}
            onAdvancedChange={handleAdvancedChange}
            options={options}
            onRealToggle={handleRealToggle}
            emptyStates={emptyStates}
            realReturnsHint={realReturnsHint}
            onReset={handleResetPortfolio}
            getScenarioLabel={getScenarioLabel}
            onReopen={reopenOnboarding}
          />

          <div className="main-content">
            <ScenarioPanel
              scenarioId={scenarioId}
              scenarioTemplates={scenarioTemplates}
              onScenarioChange={handleScenarioChange}
              options={options}
              onHorizonChange={handleHorizonChange}
              onLocationRiskChange={handleLocationRiskChange}
              onGoldToggle={handleGoldToggle}
              locationRiskLabel={locationRiskLabel}
              showGoldToggle={scenarioId === "A_1929"}
              horizonOptions={HORIZON_OPTIONS}
            />

            <ResultsPanel
              hasAnyInput={hasAnyInput}
              emptyStates={emptyStates}
              scenarioName={scenarioTemplate.name}
              netWorthBefore={netWorthBefore}
              netWorthAfter={netWorthAfter}
              netWorthAfterLabel={netWorthAfterLabel}
              netWorthDelta={netWorthDelta}
              netWorthDeltaPct={netWorthDeltaPct}
              changeLabel={changeLabel}
              options={options}
              purchasingPowerAdjustment={purchasingPowerAdjustment}
              compositionChartData={compositionChartData}
              compositionCategories={compositionCategories}
              waterfallData={waterfallData}
              formatCurrency={formatCurrency}
              formatCurrencySigned={formatCurrencySigned}
              formatPercent={formatPercent}
              shortCurrency={shortCurrency}
              topImpacts={topImpacts}
              topDriversEmptyMessage={topDriversEmptyMessage}
              advancedFieldDescriptions={advancedFieldDescriptions}
              advancedKeyOrigins={advancedKeyOrigins}
              getScenarioLabel={getScenarioLabel}
              narrative={narrative}
              assumptionsList={assumptionsList}
              sourcesList={sourcesList}
              horizonLabels={horizonLabels}
            />
          </div>
        </div>
      </div>
      <DashboardFooter />
    </>
  );
};

const DashboardHeader = () => (
  <header className="header">
    <div className="header-title">
      <img src="/logo.png" alt="Shock Market logo" />
      <h1>Shock Market Simulator</h1>
    </div>
    <p>
      Model a 1929-style crash—or the next big shock—with clarity. Adjust
      your mix, toggle the scenario, and watch the impact unfold.
    </p>
    <div className="header-meta">
      <div className="local-banner">
        <span className="local-banner__icon">🔒</span>
        <span>
          Everything you enter stays in this browser. No uploads. No tracking.
          Just local math.
        </span>
      </div>
      <div className="header-link">
        <a
          href="https://github.com/jumploops/shock-market-simulator"
          target="_blank"
          rel="noreferrer"
        >
          View on GitHub ↗
        </a>
      </div>
    </div>
  </header>
);

type PortfolioInputsPanelProps = {
  formState: PortfolioFormState;
  simpleFieldLabels: Record<SimplePortfolioKey, string>;
  simpleFieldDescriptions: Partial<Record<SimplePortfolioKey, string>>;
  onSimpleChange: (key: SimplePortfolioKey) => (event: ChangeEvent<HTMLInputElement>) => void;
  advancedKeys: PortfolioKey[];
  advancedFieldDescriptions: Partial<Record<AdvancedPortfolioKey, string>>;
  onAdvancedChange: (key: PortfolioKey) => (event: ChangeEvent<HTMLInputElement>) => void;
  options: Options;
  onRealToggle: (event: ChangeEvent<HTMLInputElement>) => void;
  emptyStates: EmptyStatesMap;
  realReturnsHint?: EmptyStateEntry;
  onReset: () => void;
  getScenarioLabel: (key: PortfolioKey) => string;
  onReopen: () => void;
};

const PortfolioInputsPanel = ({
  formState,
  simpleFieldLabels,
  simpleFieldDescriptions,
  onSimpleChange,
  advancedKeys,
  advancedFieldDescriptions,
  onAdvancedChange,
  options,
  onRealToggle,
  emptyStates,
  realReturnsHint,
  onReset,
  getScenarioLabel,
  onReopen,
}: PortfolioInputsPanelProps) => (
  <div className="sidebar">
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
              value={
                formState.simple[key] === 0
                  ? ""
                  : formState.simple[key]
              }
              onChange={onSimpleChange(key)}
            />
          </label>
        ))}
      </div>

      <details className="advanced">
        <summary>Advanced splits</summary>
        <div className="grid">
          {advancedKeys.map((key) => (
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
                onChange={onAdvancedChange(key)}
              />
            </label>
          ))}
        </div>
        <div className="advanced-options">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={options.useRealReturns}
              onChange={onRealToggle}
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
      <div className="inputs-footer">
        <button
          type="button"
          className="reset-button"
          onClick={onReset}
        >
          Reset portfolio inputs
        </button>
        <button
          type="button"
          className="reopen-button"
          onClick={onReopen}
        >
          Reopen onboarding
        </button>
      </div>
    </section>
  </div>
);

type ScenarioPanelProps = {
  scenarioId: ScenarioId;
  scenarioTemplates: ScenarioTemplate[];
  onScenarioChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: Options;
  onHorizonChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onLocationRiskChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onGoldToggle: (event: ChangeEvent<HTMLInputElement>) => void;
  locationRiskLabel: (value: number) => string;
  showGoldToggle: boolean;
  horizonOptions: HorizonMode[];
};

const ScenarioPanel = ({
  scenarioId,
  scenarioTemplates,
  onScenarioChange,
  options,
  onHorizonChange,
  onLocationRiskChange,
  onGoldToggle,
  locationRiskLabel,
  showGoldToggle,
  horizonOptions,
}: ScenarioPanelProps) => (
  <section className="panel scenario-panel">
    <h2>Scenario</h2>
    <div className="scenario-header">
      <select
        className="scenario-select"
        value={scenarioId}
        onChange={onScenarioChange}
      >
        {scenarioTemplates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.name}
          </option>
        ))}
      </select>
    </div>
    <div className="scenario-grid">
      <div className="control-row">
        <span className="control-label field-label">
          <span>Horizon</span>
          <Tooltip
            label={<span className="tooltip-icon">i</span>}
            content="Choose the measurement window: Year 1 covers only the first year of the scenario, Cycle applies the multi-year period (e.g., 1929–1932), and Peak → Trough uses the maximum drawdown from top to bottom."
          />
        </span>
        <div className="radio-group">
          {horizonOptions.map((mode) => (
            <label key={mode} className="radio-option">
              <input
                type="radio"
                name="horizon"
                value={mode}
                checked={options.horizon === mode}
                onChange={onHorizonChange}
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
          <span className="field-label">
            <span>Location risk</span>
            <Tooltip
              label={<span className="tooltip-icon">i</span>}
              content="Applies an additional percentage reduction to property values to emulate market volatility—think rural areas near 0%, suburban hubs around 10%, commercial i.e. Chicago near 20%, and high-flying coasts like San Francisco near 50%."
            />
          </span>
        </label>
        <input
          id="location-risk"
          type="range"
          min={LOCATION_RISK_MIN}
          max={LOCATION_RISK_MAX}
          step={LOCATION_RISK_STEP}
          value={options.locationRisk}
          onChange={onLocationRiskChange}
        />
        <span className="range-value">
          {locationRiskLabel(options.locationRisk)}
        </span>
      </div>

      {showGoldToggle && (
        <label className="checkbox">
          <input
            type="checkbox"
            checked={options.includeGoldRevaluation1934}
            onChange={onGoldToggle}
          />
          <span className="field-label">
            <span>Include 1934 gold revaluation (+68%)</span>
            <Tooltip
              label={<span className="tooltip-icon">i</span>}
              content="Replaces the flat interwar gold price path with the 1934 Gold Reserve Act jump to $35/oz (~+68%)."
            />
          </span>
        </label>
      )}
    </div>
  </section>
);

type ResultsPanelProps = {
  hasAnyInput: boolean;
  emptyStates: EmptyStatesMap;
  scenarioName: string;
  netWorthBefore: number;
  netWorthAfter: number;
  netWorthAfterLabel: string;
  netWorthDelta: number;
  netWorthDeltaPct: number;
  changeLabel: string;
  options: Options;
  purchasingPowerAdjustment: number;
  compositionChartData: CompositionRow[];
  compositionCategories: { key: string; label: string; color: string }[];
  waterfallData: WaterfallDatum[];
  formatCurrency: (value: number) => string;
  formatCurrencySigned: (value: number) => string;
  formatPercent: (value: number) => string;
  shortCurrency: (value: number) => string;
  topImpacts: ReturnType<typeof getTopImpacts>;
  topDriversEmptyMessage: string;
  advancedFieldDescriptions: Partial<Record<AdvancedPortfolioKey, string>>;
  advancedKeyOrigins: Partial<Record<PortfolioKey, string>>;
  getScenarioLabel: (key: PortfolioKey) => string;
  narrative: string[];
  assumptionsList: string[];
  sourcesList: string[];
  horizonLabels: Record<Options["horizon"], string>;
};

const ResultsPanel = ({
  hasAnyInput,
  emptyStates,
  scenarioName,
  netWorthBefore,
  netWorthAfter,
  netWorthAfterLabel,
  netWorthDelta,
  netWorthDeltaPct,
  changeLabel,
  options,
  purchasingPowerAdjustment,
  compositionChartData,
  compositionCategories,
  waterfallData,
  formatCurrency,
  formatCurrencySigned,
  formatPercent,
  shortCurrency,
  topImpacts,
  topDriversEmptyMessage,
  advancedFieldDescriptions,
  advancedKeyOrigins,
  getScenarioLabel,
  narrative,
  assumptionsList,
  sourcesList,
  horizonLabels,
}: ResultsPanelProps) => {
  const [isGeneratingSnapshot, setIsGeneratingSnapshot] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const { horizon, useRealReturns } = options;

  const snapshotData = useMemo(() => {
    if (compositionChartData.length < 2) {
      return null;
    }

    const [beforeRow, afterRow] = compositionChartData;

    const categories = compositionCategories.map((category) => {
      const beforeValueRaw = Number(beforeRow[category.key] ?? 0);
      const afterValueRaw = Number(afterRow[category.key] ?? 0);
      const beforeValue = Number.isFinite(beforeValueRaw)
        ? Math.max(beforeValueRaw, 0)
        : 0;
      const afterValue = Number.isFinite(afterValueRaw)
        ? Math.max(afterValueRaw, 0)
        : 0;

      return {
        key: category.key,
        label: category.label,
        color: category.color,
        before: beforeValue,
        after: afterValue,
      };
    });

    const totalBefore = categories.reduce((acc, category) => acc + category.before, 0);
    const totalAfter = categories.reduce((acc, category) => acc + category.after, 0);

    if (totalBefore <= 0 && totalAfter <= 0) {
      return null;
    }

    return { categories, totalBefore, totalAfter };
  }, [compositionCategories, compositionChartData]);

  const handleDownloadSnapshot = useCallback(async () => {
    if (!snapshotData) {
      return;
    }

    setExportError(null);
    setIsGeneratingSnapshot(true);

    try {
      const dataUrl = await createCompositionSnapshot({
        categories: snapshotData.categories,
        scenarioName,
        horizonLabel: horizonLabels[horizon] ?? horizon,
        realReturns: useRealReturns,
        totalBefore: snapshotData.totalBefore,
        totalAfter: snapshotData.totalAfter,
      });

      const link = document.createElement("a");
      const slug = slugify(scenarioName) || "scenario";
      const timestamp = new Date().toISOString().slice(0, 10);
      link.download = `${slug}-mix-${timestamp}.png`;
      link.href = dataUrl;
      link.rel = "noopener";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to create snapshot.";
      setExportError(message);
    } finally {
      setIsGeneratingSnapshot(false);
    }
  }, [horizonLabels, horizon, scenarioName, snapshotData, useRealReturns]);

  const snapshotDisabled = !snapshotData || isGeneratingSnapshot;

  return (
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
      {useRealReturns && (
        <p className="muted small-note">
          Purchasing power shift: {formatPercent(purchasingPowerAdjustment)} (
          {horizonLabels[horizon]})
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

      <div className="shareable-actions">
        <button
          type="button"
          className="snapshot-button"
          onClick={handleDownloadSnapshot}
          disabled={snapshotDisabled}
        >
          {isGeneratingSnapshot ? "Preparing snapshot..." : "Download mix snapshot"}
        </button>
        {!snapshotData && hasAnyInput && (
          <p className="muted shareable-note">
            Add assets with positive balances to enable the export.
          </p>
        )}
        {exportError && <p className="shareable-error">{exportError}</p>}
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
  );
};

const DashboardFooter = () => (
  <footer className="footer">
    <span>Built with </span>
    <a href="https://github.com/openai/codex" target="_blank" rel="noreferrer">
      Codex
    </a>
    <span> by </span>
    <a href="https://github.com/jumploops" target="_blank" rel="noreferrer">
      jumploops
    </a>
  </footer>
);

export default Dashboard;
