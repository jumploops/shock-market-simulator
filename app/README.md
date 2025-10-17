# App Dev Notes

This directory houses the React/Vite front-end for the Shock Market Simulator. The goal is to keep implementation details, design conventions, and dev workflows in one place so future updates stay coherent.

## Quick start

```bash
pnpm install      # run once
pnpm run dev      # start Vite dev server (http://localhost:5173)

pnpm run build    # type-check + production build
pnpm run test     # Vitest unit suite (Node environment)
```

## Directory tour

```text
src/
  App.tsx              # layout, state orchestration, UI composition
  App.css              # neo-brutalist styling rules
  data/
    scenarioTemplates.ts  # scenario JSON + mapping rules + defaults
    constants.ts          # horizon/location constants
  engine/
    portfolio.ts          # simple→advanced fan-out, form state helpers
    shockEngine.ts        # core shock calculations + real terms math
  components/
    CompositionChart.tsx  # Recharts stacked bar wrapper
    WaterfallChart.tsx    # Custom SVG waterfall
    Tooltip.tsx           # Shared tooltip component
content/                # Markdown copy used in-app (assumptions, empty states)
debug/                  # Dev notes (top drivers, etc.)
```

## Design choices

- **Neo-brutalist vibe**: offset shadows, heavy borders, uppercase headings. Main panels use a sticky sidebar + spacious results column. All shadows/borders are intentionally restrained (3–4px) to avoid visual clutter.
- **Scenario duplication**: there are two scenario panels. The sidebar version supports sticky controls, while the main-content copy sits above “Shock preview” on wide screens. Both feed the same state hook.
- **Deterministic math**: scenarios live in `data/scenarioTemplates.ts` and are pure JSON objects. `shockEngine.ts` transforms those into per-key deltas, while `portfolio.ts` distributes user inputs across advanced asset keys.
- **Persistence**: everything entered is saved to `localStorage` (`crashmirror_state_v1`). On first load we deserialize, sanitize, and hydrate the form. The lock banner at the top is the UX reminder that nothing leaves the browser.
- **Tooltips + copy**: human-friendly explanations are kept in `content/`. The Tooltip component consumes description dictionaries in `App.tsx`, keeping the copy and logic separated.

## Adding/adjusting scenarios

1. Update `data/scenarioTemplates.ts` with the new template and the simple→advanced mapping if needed. Keep horizon defaults and options explicit.
2. Refresh copy in `content/scenarios_copy.json` and cite sources in `content/sources.md`.
3. If the scenario introduces new asset keys, extend `PortfolioAdvanced` in `types.ts`, update chart category definitions in `App.tsx`, and add descriptions for tooltips.
4. Run `pnpm exec tsc --noEmit` to catch type breakages, then `pnpm run test`.

## Styling guidelines

- Use `App.css` for global layout adjustments; prefer scoped classes (e.g., `.scenario-panel--main`).
- Keep offset shadows ≤4px to maintain consistency.
- When adding new UI blocks, accompany them with tooltip copy to explain calculations if the mapping isn’t obvious.

## Testing

- `pnpm run test` runs Vitest in Node mode. Tests currently exercise the data fan-out and shock calculations (`src/engine/__tests__/portfolio.test.ts`).
- Feel free to add component-level tests via Vitest + React Testing Library if/when the UI grows more complex.

## Linting / formatting

- ESLint config lives in `eslint.config.js`; it ships with the Vite template defaults. No format enforcement is currently wired in; add Prettier/biome if the project grows.

## Gotchas

- Because both scenario panels render, radio inputs must have unique `name` attributes (`horizon-sidebar` vs `horizon-main`) to stay in sync.
- Clearing advanced inputs: empty strings remove the override key, falling back to the simple-bucket distribution. Make sure auto-save logic doesn’t reintroduce stale values.
- Recharts expects `ResponsiveContainer`; remember to keep the charts wrapped or dev builds will warn.

Questions or tweaks? Drop notes in `debug/` or extend this README.
