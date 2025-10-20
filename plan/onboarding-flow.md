# Onboarding Flow Plan

## Current State
- The entire portfolio workflow, scenario controls, results, and persistence live inside `app/src/App.tsx (~1,050 LOC)` with coarse-grained sections rendered inline.
- Form state is modeled as `PortfolioFormState` (`simple` + `advanced` maps) and stored in component state, persisted to `localStorage` under `crashmirror_state_v1`.
- Advanced breakdowns auto-map simple buckets through `scenarioMappingRules`. Advanced inputs are optional and override the simple distribution when populated.
- Local storage persistence currently restores `formState`, `options`, and `scenarioId` on mount and writes back after any change; there is no notion of onboarding completion.
- UI renders immediately into the dashboard; headers already include intro copy, but there is no guided flow.

## Goals & Constraints
- Gate the dashboard behind a first-run onboarding wizard that guides users through entering basic allocations and optional advanced splits.
- Preserve the existing dashboard experience (and saved data) for returning users; onboarding should only appear when no completed onboarding flag exists.
- Keep architecture maintainable: modularize the oversized `App.tsx`, avoid duplicating business logic, and reuse existing utilities (`createInitialFormState`, `getEffectivePortfolioAmounts`, etc.).
- Simple is robust: prefer straightforward React state + context over complex routing or global stores; no new heavy dependencies.
- Ensure advanced splits are easy but optional—onboarding should not force techy inputs yet allow refinement when desired.

## Decisions & Updates
- Implement **Option A** with an `AppStateProvider` + context to centralize simulator state.
- Ship the onboarding as a **linear wizard** initially; add conditional branching later if needed.
- Keep the default scenario pinned to the existing 1929 analog (`DEFAULT_SCENARIO_ID`) once the dashboard loads.
- Add a **“Reopen onboarding”** control in the Portfolio panel footer so users can restart the guided setup.
- Plan for a **portfolio pie-chart confirmation step** after the review screen in a subsequent iteration; omit it from the initial build but leave the sequence flexible.
- Linear wizard implemented with steps covering cash, fixed income, equities, alternatives, and a review summary. Each step allows skipping forward, with a global skip-to-dashboard control.

## Key Observations
- `App.tsx` couples persistence, layout, form controls, scenario logic, and results rendering. Refactoring into smaller components (e.g., `Dashboard`, `PortfolioPanel`, `ScenarioPanel`, `ResultsPanel`) will make it easier to inject an onboarding gate.
- Persistence versioning already exists (`PERSIST_VERSION`), so adding a new field (e.g., `onboardingComplete`) can be managed by bumping the version or defaulting to `false` when absent.
- `createInitialFormState` seeds all simple fields with `0` and advanced fields empty; onboarding can build on top of this, progressively filling the structure before the dashboard mounts.
- Advanced mapping logic expects numeric values (default `0`), so we can continue to store zero for skipped questions; the dashboard already hides empty buckets by showing blank inputs.

## Proposed Architecture
1. **State Provider Extraction**
   - Introduce a lightweight `AppStateProvider` (or similar hook) that owns the canonical state: `formState`, `options`, `scenarioId`, `onboardingComplete`, plus persistence side-effects.
   - Expose setters and derived helpers via React context or custom hooks (`useAppState`). This keeps persistence logic in one place and allows both onboarding and dashboard to interact with the same state.
2. **View Layer Split**
   - Replace the monolithic `App` render with a gate:
     ```tsx
     return (
       <AppStateProvider>
         {onboardingComplete ? <Dashboard /> : <OnboardingFlow />}
       </AppStateProvider>
     );
     ```
   - `Dashboard` composes existing panels (Portfolio, Scenario, Results, Footer) and can reuse almost all current JSX after extraction.
3. **Onboarding Flow Module**
   - Create `OnboardingFlow` component that steps through a finite array of screens.
   - Each step prompts for a focused set of inputs, writing into the shared `formState` via context setters.
   - Offer “Skip” to leave a field untouched (remains at default `0`). Provide inline guidance/tooltips reusing existing copy constants.
   - Final step confirms and sets `onboardingComplete` in state (and thus persistence), transitioning to the dashboard.

## Onboarding UX Outline
1. **Intro Screen**
   - Brief description of simulator, list scenarios (1929, Dot-com, hypothetical), and strong local-only disclaimer (reuse existing banner messaging).
   - CTA: “Get started” (or “Begin setup”).
2. **Cash & Safe Assets**
   - Inputs: insured cash, other cash, optional short-term (tie to advanced `tbills` if user wants to specify?) Keep simple first.
3. **Fixed Income**
   - Collect total bonds; optionally expand to advanced splits (T-bills, 10Y, IG, HY) via inline toggle. Highlight that unfilled splits default to equal weighting.
4. **Equities**
   - Ask for total stocks; allow optional breakdown (US large, US small, international, growth/tech). Provide context on Growth (tech) equity label.
5. **Alternatives & Liabilities**
   - Real estate value & mortgage; gold; “Other assets”; margin debt.
6. **Review & Finish**
   - Show summary of captured amounts (simple table) with option to edit previous steps or confirm.
   - On confirm, set `onboardingComplete = true` and navigate to the dashboard.
   - Future enhancement: offer a “Preview as pie chart” confirmation before finishing to help users validate allocations visually.

## Data & Persistence Plan
- Extend `PersistedState` with `onboardingComplete?: boolean` and bump `PERSIST_VERSION` to `2`.
- When hydrating, treat missing flag as `false` **but** if existing `formState` has any non-zero values, we can consider auto-setting the flag to `true` to avoid forcing existing users through onboarding.
- Persist onboarding completion whenever user finishes (and optionally when they click a “Skip onboarding / go straight to dashboard” escape hatch).
- Provide a `Reset all` action somewhere (maybe under portfolio reset) that clears storage including the onboarding flag.

## Implementation Steps
1. **Prep & Refactor**
   - Extract reusable UI sections from `App.tsx` into new components under `src/components/dashboard/` (e.g., `PortfolioPanel`, `ScenarioPanel`, `ResultsPanel`, `Header`, `Footer`).
   - Move persistence + state logic into a new hook/context (`useAppState`). Ensure current dashboard works unchanged post-refactor.
2. **Persistence Upgrade**
   - Introduce `onboardingComplete` flag with sensible migration (auto-true when legacy data exists).
   - Provide setter methods (`completeOnboarding`, `resetAllState`).
3. **Onboarding Flow**
   - Build `OnboardingFlow` component with:
     - Step definitions array (id, title, description, fields).
     - Navigation controls (Back, Next, Skip, Finish).
     - Reuse existing input styling (shared CSS utilities) or add minimal new styles scoped to onboarding.
   - Hook into shared setters to update `formState` as user progresses.
   - On “Finish”, call `completeOnboarding`.
4. **Gate Wiring**
   - Update `App` root to render onboarding or dashboard based on flag.
   - Ensure loading state while persistence restores (maybe show spinner or placeholder to avoid flash).
5. **Advanced Splits Handling**
   - For steps that need advanced values, offer optional toggle (e.g., “Specify breakdown”). When toggled:
     - Show inputs tied directly to `formState.advanced`.
     - Provide short helper copy referencing existing tooltips.
   - Ensure totals remain consistent (advanced values act as overrides, users can leave them blank).
6. **Dashboard Hooks**
   - Add the “Reopen onboarding” button in the Portfolio panel footer; when clicked, clear the onboarding-complete flag and route the user back into the wizard (optionally also reset form state or prompt before clearing data).
7. **Polish & Accessibility**
   - Keyboard-friendly navigation, focus management between steps, validation (only allow numeric input, allow blank = skip).
   - Add “Skip onboarding” link for experienced users (sets flag true but leaves portfolio blank).
8. **Testing & QA**
   - Manual QA for first-run, returning visit, partial completion, reset flow.
   - Verify localStorage payload, ensure dashboard still functions, and charts respond to onboarding-entered data.

## Options & Considerations
- **Architecture Choice**
  - *Option A (Context)*: Single `AppStateProvider` + context hook. Pros: simple, keeps state centralized. Cons: new provider layer.
  - *Option B (Lifted State in App)*: Maintain state in `App`, pass props to `OnboardingFlow`/`Dashboard`. Simpler but leads to prop drilling. **Recommendation:** Option A for cleanliness.
- **Step Navigation**
  - Committed to a linear wizard for the first release; revisit conditional paths later (e.g., only show advanced breakdown prompt if totals exceed thresholds).
- **Review Screen**
  - Launch with the textual summary and plan a follow-on pie-chart confirmation step (and possibly a shock preview) once the core wizard is stable.
- **Styling**
  - Leverage existing CSS tokens (`--page-padding-*`, `panel` styles). Onboarding can reuse panel aesthetic to stay on-brand; consider full-viewport container to focus user.
- **Re-entry**
  - Provide a “Reopen onboarding” button in the Portfolio panel footer that resets `onboardingComplete` and steps back into the flow for reconfiguration.

## Open Questions
- Do we limit inputs to whole dollars / thousands? For now mirror existing behavior (step `1000` but allow custom values).
- How granular should validation be (e.g., enforce non-negative)? Inputs already accept non-negative due to `min={0}`; onboarding can reuse same constraint.
- Should totals be normalized (percent) instead of dollar amounts? Out of scope; keep dollar inputs consistent with current engine expectations.

With this plan we can iterate in manageable chunks: refactor state management, introduce onboarding gating, and layer in the stepper while keeping the simulator core untouched.
