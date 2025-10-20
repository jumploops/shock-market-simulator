# Mobile Layout Deep Dive

Date: 2025-02-14

## Goal
Understand why the Portfolio Inputs / Scenario panels still collide with the right edge on small screens, and why Shock Preview appears visually narrower than the other blocks. We reviewed the component hierarchy, CSS cascade, and responsive breakpoints to map out the root causes before attempting another fix.

## Component hierarchy refresher
- `App.tsx`
  - `.app` wrapper `div` (grid)
    - `<header class="header">`
    - `<div class="layout">`
      - `<div class="sidebar">`
        - Portfolio `<section class="panel">`
        - Scenario `<section class="panel scenario-panel--sidebar">`
      - `<div class="main-content">`
        - Scenario duplicate `<section class="panel scenario-panel--main">`
        - Shock Preview `<section class="panel results">`
        - Downstream cards (`.chart-card`, `.impacts`, callouts, etc.)
    - Footer lives outside `.app`

Key observation: the panels themselves are full-width inside their parent column; no extra wrapper is constraining the width on narrow screens.

## CSS layout summary
- `.app`
  - Grid with single column; padding set via `--page-padding-inline` (1.75–2.75 rem desktop) with an extra `+ var(--panel-shadow-x)` on the right to protect the drop shadow.
- `.layout`
  - Desktop: `grid-template-columns: minmax(260px,340px) minmax(0,1fr)`.
  - ≤1024 px: switches to single column but keeps the same padding as `.app` (no additional inset).
- `.sidebar`
  - Desktop sticky; on ≤1024 px we disable stickiness but retain the same internal grid.
- `.panel`
  - `box-shadow: var(--panel-shadow-x) var(--panel-shadow-y)`; defaults to `4px 4px`. That shadow is asymmetric (positive X only) so it extends to the right.
- `.chart-card` and other neo elements reuse the same shadow tokens.

## What still looks wrong on phones
1. **Perceived collision on the right edge**
   - At 360 px viewport, calculated padding on `.app` is ~1.5 rem (≈24 px). The panel shadow adds 3–4 px beyond the padded area. Because the shadow is only applied with positive X/Y offsets, it visually “touches” the screen even though the panel’s border is still inset.
   - Inputs in `.grid` stretch to 100% width, so their internal padding doesn’t absorb the shadow.
2. **Shock Preview visual imbalance**
   - Once the sidebar collapses above it, `.results` sits below the scenario block. Its chart section contains a two-column grid breakpoint at 960 px; below that the cards stack, but the drop shadow + dashed divider callouts create differing horizontal rhythms versus the solid panels.
   - Waterfall chart has a fixed 640 px viewBox; on narrow screens the SVG scales but the right-side text still pushes close to the edge, accentuating the “narrow” feel.
3. **Header/footer alignment**
   - Footer inherits the same inline padding, but because we add the shadow offset only on the right, the footer text appears slightly off-center at very small widths.

## Hypotheses / root causes
1. **Asymmetric shadow**: Our neo-brutalist shadow always extends towards positive X. On small viewports, the eye interprets the shadow as the panel boundary. Without matching negative offsets or extra right padding, it reads as flush.
2. **Global padding scale**: `clamp(1.25rem, 5vw, 1.75rem)` bottoms out around 20 px. Combined with the 3–4 px shadow, there’s <24 px total negative space. Many mobile design guidelines recommend ≥24 px gutters after shadows, so we need either smaller shadow or larger padding below ~480 px.
3. **Duplicated scenario section**: Even when the sidebar collapses, we still render the sidebar version above the Shock Preview. That duplicative structure adds vertical weight and may mislead us during QA (the second scenario block is the one inside `.main-content`). Consolidating to a single instance would simplify spacing tweaks.
4. **Chart cards**: Because we apply the same shadow to inner cards, tightening the outer panel padding doesn’t visually offset their edges; they effectively add another shadow within a shadow, amplifying the right-edge crowding.

## Next-step ideas (no code yet)
- Increase mobile inline padding or introduce symmetric shadow (e.g., `box-shadow: 0 3px` or `box-shadow: -2px 3px`) so the visual boundary stays inset.
- Consider wrapping panels in a flex container with `gap` and a pseudo-element background to emulate shadow without extending past the gutter.
- Collapse the sidebar scenario block below a certain width to avoid duplicate controls and reclaim vertical breathing room.
- Audit chart components for `max-width` or auto margins to ensure they inherit panel padding instead of stretching to panel edges.

Once we pick a direction, we can update the existing `responsive-polish` plan with the specific implementation tasks.
