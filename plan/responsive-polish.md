# Responsive Polish Plan

## What we reviewed
- `app/src/App.tsx` for the layout structure (header → `.layout` grid with `.sidebar` + `.main-content`, panels, charts).
- `app/src/App.css` plus `app/src/index.css` for the current spacing rules, breakpoints, and component styling.
- Chart components (`app/src/components/CompositionChart.tsx`, `app/src/components/WaterfallChart.tsx`) to understand embedded width behaviours.

## Current pain points
- On narrow screens the `.app` container keeps generous desktop padding, so the right-hand box shadows from `.panel` elements collide with the viewport edge while the left side looks balanced. The sticky sidebar also locks the first two panels to desktop-style spacing on mobile.
- `.panel` cards always render at desktop scale (padding, border, shadow). Without a mobile override they dominate the small viewport.
- `Shock preview` shares the same grid column as the scenario panel but its internal layout (charts and summary) is vertically compressed on small screens. The waterfall chart uses a fixed 640 px virtual width, causing the panel to feel tighter than the others.
- Header meta row and footer rely on desktop gaps; on phones those elements can crowd the viewport edges.

## Findings from 2025-02-14 mobile QA
- On a 360 px viewport the container leaves ~22 px of right padding, but the neo-brutalist drop shadow (`box-shadow: 4px 4px`) extends beyond the padding only on the right side, making panels visually flush against the screen. Left padding reads fine because there is no shadow offset.
- The stacked layout still renders the sidebar panels first, but both Portfolio Inputs and Scenario panels occupy the full width; the perception of a “narrow” scenario block stems from the shadow overlap plus the internal `grid` introducing extra inset spacing. We need either more global padding or an asymmetric shadow solution on narrow widths.
- The drop shadow offset is also reused on chart cards and callouts, so any mobile adjustment should be tokenised to keep the brutalist feel consistent across panel types.

## Proposed approach
1. **Container & spacing tokens**
   - Introduce CSS custom properties (e.g. `--page-padding`, `--panel-padding`, `--panel-shadow`) with responsive overrides so the entire shell scales gracefully from mobile through desktop.
   - Update `.app`, `.header`, and `.footer` to consume these tokens, ensuring symmetric padding on both sides and preventing box shadows from hitting the viewport edge.
2. **Responsive panel refinements**
   - Tweak `.panel` padding, border radius, and shadow strength at sub-768 px widths; consider `box-shadow: 2px 2px` and slightly tighter padding.
   - Remove sticky positioning from `.sidebar` on tablets/phones and allow panels to stack with consistent gaps.
3. **Shock preview balance**
   - Let `.main-content` adopt a single-column flow sooner and give `.results` panel a saturation rule (e.g. `align-self: stretch`, `display: flex; flex-direction: column`) so charts grow naturally.
   - Adjust `.chart-section` to switch to a single column earlier (`max-width: 1024px`) and add `min-height`/padding parity so it visually matches the portfolio/scenario panels.
   - Make `WaterfallChart` width responsive by deriving the SVG width from container `clientWidth` (via `ResizeObserver`) or by setting the `svg` to 100% width with preserved aspect ratio and dynamic label/value positioning.
4. **Header/meta adjustments**
   - For screens < 600 px, stack the header CTA and local banner vertically with full-width buttons; ensure the GitHub link respects the new padding.
5. **Testing checklist**
   - Manual QA on 360 px, 768 px, and ≥1280 px widths (Chrome dev tools) to confirm no horizontal scroll and balanced component sizing.
   - Verify charts render legibly after the responsiveness tweaks (especially the waterfall labels).
   - Re-run `pnpm run build` to ensure TypeScript still passes.

## Open questions
- If the waterfall chart still feels cramped after the responsive tweaks, should we collapse legend/details behind a toggle on mobile?
- Do we want the scenario controls to remain duplicated (sidebar + main) on mobile, or should we collapse to a single instance once the sticky sidebar is gone?
