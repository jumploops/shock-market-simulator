import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  createInitialFormState,
  SIMPLE_PORTFOLIO_KEYS,
} from "../engine/portfolio";
import {
  DEFAULT_SCENARIO_ID,
  baseOptions,
  buildInitialOptions,
  scenarioTemplateMap,
  type ScenarioId,
} from "../data/scenarioTemplates";
import {
  LOCATION_RISK_MAX,
  LOCATION_RISK_MIN,
} from "../data/constants";
import type {
  AdvancedPortfolioKey,
  Options,
  PortfolioFormState,
  ScenarioTemplate,
} from "../types";

type PersistedState = {
  version: number;
  scenarioId?: string;
  options?: Partial<Options>;
  formState?: Partial<PortfolioFormState>;
  onboardingComplete?: boolean;
};

const STORAGE_KEY = "crashmirror_state_v1";
const PERSIST_VERSION = 2;
const HORIZON_OPTIONS: Options["horizon"][] = ["year1", "cycle", "trough"];
const isBrowser = typeof window !== "undefined";

type AppStateContextValue = {
  formState: PortfolioFormState;
  setFormState: React.Dispatch<React.SetStateAction<PortfolioFormState>>;
  resetPortfolio: () => void;
  scenarioId: ScenarioId;
  setScenarioId: React.Dispatch<React.SetStateAction<ScenarioId>>;
  scenarioTemplate: ScenarioTemplate;
  options: Options;
  setOptions: React.Dispatch<React.SetStateAction<Options>>;
  onboardingComplete: boolean;
  completeOnboarding: () => void;
  reopenOnboarding: () => void;
  resetAllState: () => void;
  isHydrated: boolean;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

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
  typeof value === "string" && HORIZON_OPTIONS.includes(value as Options["horizon"]);

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

const hasAnyPortfolioValues = (state: PortfolioFormState): boolean => {
  for (const key of SIMPLE_PORTFOLIO_KEYS) {
    if (state.simple[key]) {
      return true;
    }
  }
  return Object.values(state.advanced).some(
    (value) => value !== undefined && value !== 0,
  );
};

export const AppStateProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [formState, setFormState] = useState<PortfolioFormState>(
    createInitialFormState(),
  );
  const [scenarioId, setScenarioId] =
    useState<ScenarioId>(DEFAULT_SCENARIO_ID);
  const [options, setOptions] = useState<Options>(() =>
    buildInitialOptions(scenarioTemplateMap[DEFAULT_SCENARIO_ID]),
  );
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [isHydrated, setIsHydrated] = useState(!isBrowser);
  const hasRestoredRef = useRef(false);
  const skipScenarioSyncRef = useRef(false);

  const scenarioTemplate = useMemo(
    () => scenarioTemplateMap[scenarioId],
    [scenarioId],
  );

  useEffect(() => {
    if (!isBrowser || hasRestoredRef.current) {
      setIsHydrated(true);
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
        scenarioTemplateMap[candidateScenarioId] ??
        scenarioTemplateMap[DEFAULT_SCENARIO_ID];

      if (parsed.formState) {
        const sanitizedForm = sanitizeFormState(parsed.formState);
        setFormState(sanitizedForm);
        if (parsed.onboardingComplete === undefined) {
          if (hasAnyPortfolioValues(sanitizedForm)) {
            setOnboardingComplete(true);
          }
        }
      }

      if (parsed.options) {
        setOptions(sanitizeOptions(parsed.options, templateForOptions));
      }

      if (typeof parsed.onboardingComplete === "boolean") {
        setOnboardingComplete(parsed.onboardingComplete);
      }

      if (candidateScenarioId !== DEFAULT_SCENARIO_ID) {
        skipScenarioSyncRef.current = true;
        setScenarioId(candidateScenarioId);
      }
    } catch (error) {
      console.warn("CrashMirror: unable to restore state", error);
    } finally {
      hasRestoredRef.current = true;
      setIsHydrated(true);
    }
  }, []);

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
  }, [scenarioTemplate]);

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
        onboardingComplete,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn("CrashMirror: unable to persist state", error);
    }
  }, [formState, onboardingComplete, options, scenarioId]);

  const resetPortfolio = useCallback(() => {
    setFormState(createInitialFormState());
  }, []);

  const completeOnboarding = useCallback(() => {
    setOnboardingComplete(true);
  }, []);

  const reopenOnboarding = useCallback(() => {
    setOnboardingComplete(false);
  }, []);

  const resetAllState = useCallback(() => {
    resetPortfolio();
    setScenarioId(DEFAULT_SCENARIO_ID);
    setOptions(buildInitialOptions(scenarioTemplateMap[DEFAULT_SCENARIO_ID]));
    setOnboardingComplete(false);
    if (isBrowser) {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.warn("CrashMirror: unable to clear storage", error);
      }
    }
  }, [resetPortfolio]);

  const value = useMemo<AppStateContextValue>(
    () => ({
      formState,
      setFormState,
      resetPortfolio,
      scenarioId,
      setScenarioId,
      scenarioTemplate,
      options,
      setOptions,
      onboardingComplete,
      completeOnboarding,
      reopenOnboarding,
      resetAllState,
      isHydrated,
    }),
    [
      formState,
      isHydrated,
      onboardingComplete,
      options,
      scenarioId,
      scenarioTemplate,
      resetPortfolio,
      completeOnboarding,
      reopenOnboarding,
      resetAllState,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = (): AppStateContextValue => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
};
