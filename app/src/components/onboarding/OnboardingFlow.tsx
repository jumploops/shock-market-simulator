import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import {
  SIMPLE_FIELD_LABELS,
  SIMPLE_FIELD_DESCRIPTIONS,
  ADVANCED_FIELD_DESCRIPTIONS,
  getScenarioLabel,
} from "../../constants/portfolioFields";
import { useAppState } from "../../state/AppStateContext";
import { usePortfolioFormHandlers } from "../../hooks/usePortfolioFormHandlers";
import type {
  AdvancedPortfolioKey,
  PortfolioFormState,
  PortfolioKey,
  SimplePortfolioKey,
} from "../../types";
import { isLiabilityKey } from "../../engine/portfolio";

type StepId =
  | "intro"
  | "cash"
  | "fixed_income"
  | "equities"
  | "alternatives"
  | "review";

type StepConfig = {
  id: StepId;
  title?: string;
  description?: string;
  simpleFields?: SimplePortfolioKey[];
  advancedFields?: AdvancedPortfolioKey[];
  advancedHint?: string;
};

const STEP_SEQUENCE: StepConfig[] = [
  { id: "intro" },
  {
    id: "cash",
    title: "Capture your cash",
    description: "Start with the cash you can reach quickly—insured balances and everything else.",
    simpleFields: ["cash_insured", "cash_other"],
  },
  {
    id: "fixed_income",
    title: "Add your bond exposure",
    description:
      "Enter your bond totals. If you track the mix, expand advanced splits to pin them down.",
    simpleFields: ["bonds"],
    advancedFields: ["tbills", "treasuries_10y", "corporates_ig", "corporates_hy"],
    advancedHint: "Specify the slices if you want to model different bond behaviors.",
  },
  {
    id: "equities",
    title: "Detail your equities",
    description:
      "Capture your stock holdings. You can separate small caps, international, or growth heavy positions.",
    simpleFields: ["stocks"],
    advancedFields: ["us_large", "us_small", "international", "growth_equity"],
    advancedHint: "Break out where your equity exposure lives—small caps, global, or high-growth bets.",
  },
  {
    id: "alternatives",
    title: "Round out the rest",
    description:
      "Add gold, property, liabilities, and any other positions that matter to your net worth.",
    simpleFields: ["gold", "real_estate_value", "mortgage", "other", "margin_debt"],
  },
  {
    id: "review",
    title: "Review & confirm",
    description: "Double-check the snapshot. You can tweak anything later from the main dashboard.",
  },
];

const NON_ZERO_THRESHOLD = 1e-2;

type StepNavigationProps = {
  stepIndex: number;
  totalSteps: number;
  onNext?: () => void;
  onBack?: () => void;
  onSkip?: () => void;
  primaryLabel?: string;
  secondaryLabel?: string;
};

type FieldProps = {
  label: string;
  description?: string;
  value: number;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

type DataStepProps = {
  config: StepConfig;
  formState: PortfolioFormState;
  handleSimpleChange: ReturnType<typeof usePortfolioFormHandlers>["handleSimpleChange"];
  handleAdvancedChange: ReturnType<typeof usePortfolioFormHandlers>["handleAdvancedChange"];
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  stepIndex: number;
  totalSteps: number;
};

type ReviewStepProps = {
  formState: PortfolioFormState;
  onBack: () => void;
  onFinish: () => void;
  onSkip: () => void;
  stepIndex: number;
  totalSteps: number;
};

type ReviewRow = {
  label: string;
  value: number;
  category: "simple" | "advanced";
  key: string;
  isLiability: boolean;
};

const IntroStep = ({ onBegin }: { onBegin: () => void }) => (
  <div className="panel onboarding-panel onboarding-panel--intro">
    <img className="onboarding-logo" src="/logo.png" alt="Shock Market logo" />
    <h1>Shock Market Simulator</h1>
    <div className="onboarding-intro-copy">
      <p>
        Tell us what you hold and we&apos;ll show how a 1929-scale shock reshapes it.
      </p>
      <ul className="onboarding-intro-list">
        <li>1929 crash, dot-com bust, and custom shocks ready to compare.</li>
        <li>Real vs. nominal toggles, location risk sliders, and advanced splits.</li>
        <li>No accounts, no uploads—data lives locally with you.</li>
      </ul>
    </div>
    <div className="onboarding-actions">
      <button type="button" className="primary" onClick={onBegin}>
        Get started
      </button>
    </div>
  </div>
);

const NumberField = ({ label, description, value, onChange }: FieldProps) => (
  <label className="onboarding-field">
    <span className="field-label">{label}</span>
    {description && <span className="field-help">{description}</span>}
    <input
      type="number"
      inputMode="decimal"
      min={0}
      step="1000"
      value={value === 0 ? "" : value}
      onChange={onChange}
    />
  </label>
);

const StepNavigation = ({
  stepIndex,
  totalSteps,
  onNext,
  onBack,
  onSkip,
  primaryLabel = "Next",
  secondaryLabel = "Back",
}: StepNavigationProps) => (
  <footer className="onboarding-nav">
    {stepIndex > 0 && (
      <span className="onboarding-progress">
        Step {Math.max(stepIndex, 1)} of {totalSteps - 1}
      </span>
    )}
    <div className="onboarding-buttons">
      {onSkip && (
        <button type="button" className="ghost" onClick={onSkip}>
          Skip
        </button>
      )}
      <div className="onboarding-buttons-primary">
        {onBack && (
          <button type="button" className="ghost" onClick={onBack}>
            {secondaryLabel}
          </button>
        )}
        {onNext && (
          <button type="button" className="primary" onClick={onNext}>
            {primaryLabel}
          </button>
        )}
      </div>
    </div>
  </footer>
);

const DataStep = ({
  config,
  formState,
  handleSimpleChange,
  handleAdvancedChange,
  onNext,
  onBack,
  onSkip,
  stepIndex,
  totalSteps,
}: DataStepProps) => {
  const { simpleFields = [], advancedFields = [] } = config;
  const [showAdvanced, setShowAdvanced] = useState(
    advancedFields.some((key) => formState.advanced[key] !== undefined),
  );

  return (
    <div className="panel onboarding-panel">
      {config.title && <h2>{config.title}</h2>}
      {config.description && <p className="onboarding-subhead">{config.description}</p>}

      {simpleFields.length > 0 && (
        <div className="onboarding-grid">
          {simpleFields.map((key) => (
            <NumberField
              key={key}
              label={SIMPLE_FIELD_LABELS[key]}
              description={SIMPLE_FIELD_DESCRIPTIONS[key]}
              value={formState.simple[key] ?? 0}
              onChange={handleSimpleChange(key)}
            />
          ))}
        </div>
      )}

      {advancedFields.length > 0 && (
        <>
          <div className="onboarding-advanced-toggle">
            <button type="button" onClick={() => setShowAdvanced((prev) => !prev)}>
              {showAdvanced ? "Hide advanced splits" : "Show advanced splits"}
            </button>
            {showAdvanced && config.advancedHint && (
              <p className="onboarding-hint">{config.advancedHint}</p>
            )}
          </div>
          {showAdvanced && (
            <div className="onboarding-grid onboarding-grid--advanced">
              {advancedFields.map((key) => (
                <NumberField
                  key={key}
                  label={getScenarioLabel(key)}
                  description={ADVANCED_FIELD_DESCRIPTIONS[key]}
                  value={formState.advanced[key] ?? 0}
                  onChange={handleAdvancedChange(key)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <StepNavigation
        stepIndex={stepIndex}
        totalSteps={totalSteps}
        onNext={onNext}
        onBack={onBack}
        onSkip={onSkip}
      />
    </div>
  );
};

const ReviewStep = ({
  formState,
  onBack,
  onFinish,
  onSkip,
  stepIndex,
  totalSteps,
}: ReviewStepProps) => {
  const rows = useMemo<ReviewRow[]>(() => {
    const items: ReviewRow[] = [];

    for (const [key, value] of Object.entries(formState.simple)) {
      if (!value || Math.abs(value) < NON_ZERO_THRESHOLD) {
        continue;
      }
      items.push({
        label: SIMPLE_FIELD_LABELS[key as SimplePortfolioKey],
        value,
        category: "simple",
        key,
        isLiability: isLiabilityKey(key as PortfolioKey),
      });
    }

    for (const [key, value] of Object.entries(formState.advanced)) {
      if (value === undefined || Math.abs(value) < NON_ZERO_THRESHOLD) {
        continue;
      }
      items.push({
        label: getScenarioLabel(key as PortfolioKey),
        value,
        category: "advanced",
        key,
        isLiability: isLiabilityKey(key as PortfolioKey),
      });
    }

    return items.sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  }, [formState]);

  const totalAssets = useMemo(() =>
    rows
      .filter((entry) => !entry.isLiability)
      .reduce((sum, entry) => sum + entry.value, 0),
  [rows]);

  return (
    <div className="panel onboarding-panel">
      <h2>Review & confirm</h2>
      <p className="onboarding-subhead">
        Double-check the snapshot. You can tweak anything later from the main dashboard.
      </p>

      <p className="onboarding-total">Total assets: ${totalAssets.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>

      {rows.length === 0 ? (
        <p className="onboarding-empty">No positions yet—feel free to add them later.</p>
      ) : (
        <table className="onboarding-summary">
          <tbody>
            {rows.map((entry) => (
              <tr key={`${entry.category}-${entry.key}`}>
                <th>{entry.label}</th>
                <td>${entry.value.toLocaleString("en-US", { maximumFractionDigits: 0 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="onboarding-reminder">
        Everything you enter stays in this browser—nothing is sent to any server.
      </p>

      <StepNavigation
        stepIndex={stepIndex}
        totalSteps={totalSteps}
        onBack={onBack}
        onNext={onFinish}
        onSkip={onSkip}
        primaryLabel="Finish"
      />
    </div>
  );
};

const OnboardingFlow = () => {
  const {
    formState,
    setFormState,
    resetPortfolio,
    completeOnboarding,
  } = useAppState();

  const { handleSimpleChange, handleAdvancedChange, handleResetPortfolio } =
    usePortfolioFormHandlers(setFormState, resetPortfolio);

  const [stepIndex, setStepIndex] = useState(0);
  const totalSteps = STEP_SEQUENCE.length;

  const goTo = (index: number) => {
    setStepIndex(Math.max(0, Math.min(index, totalSteps - 1)));
  };

  const goNext = () => goTo(stepIndex + 1);
  const goBack = () => goTo(stepIndex - 1);
  const skipOnboarding = () => completeOnboarding();

  const currentConfig = STEP_SEQUENCE[stepIndex];

  return (
    <div className="onboarding-page">
      <div className="onboarding">
        <div className="onboarding-wrapper">
          <div className="onboarding-banner">
            <span role="img" aria-label="lock">🔒</span>
            <span>All inputs stay on this device—nothing is uploaded or tracked.</span>
          </div>

          {currentConfig.id === "intro" && (
            <IntroStep onBegin={goNext} />
          )}

          {currentConfig.id !== "intro" && currentConfig.id !== "review" && (
            <DataStep
              config={currentConfig}
              formState={formState}
              handleSimpleChange={handleSimpleChange}
              handleAdvancedChange={handleAdvancedChange}
              onNext={goNext}
              onBack={goBack}
              onSkip={goNext}
              stepIndex={stepIndex}
              totalSteps={totalSteps}
            />
          )}

          {currentConfig.id === "review" && (
            <ReviewStep
              formState={formState}
              onBack={goBack}
              onFinish={completeOnboarding}
              onSkip={skipOnboarding}
              stepIndex={stepIndex}
              totalSteps={totalSteps}
            />
          )}

          {currentConfig.id !== "review" && (
            <button
              type="button"
              className="onboarding-skip-link"
              onClick={skipOnboarding}
            >
              Skip onboarding
            </button>
          )}

          {currentConfig.id !== "intro" && (
            <button
              type="button"
              className="onboarding-reset"
              onClick={() => handleResetPortfolio()}
            >
              Reset all inputs
            </button>
          )}
        </div>
      </div>
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
    </div>
  );
};

export default OnboardingFlow;
