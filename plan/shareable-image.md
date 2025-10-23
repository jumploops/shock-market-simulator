# Shareable Composition Snapshot

## Goals
- Let users export a local-only image that compares the portfolio mix before and after a scenario.
- Avoid exposing absolute dollar amounts while still communicating mix shift and total volume change.

## Context
- Aggregated category data (before/after) is already constructed inside `Dashboard.tsx`.
- Category colors and labels live in `CATEGORY_DEFINITIONS`.
- No existing capture/export flow; charts are rendered with Recharts inside the dashboard.

## Approach
1. **Prepare sanitized data** – normalize category weights for the “Now” and “After” states and derive a total-volume multiplier that can be communicated without dollar figures.
2. **Render snapshot to canvas** – build a utility that draws twin pie charts plus supporting labels onto an offscreen `<canvas>`, using the existing category palette.
3. **Add download trigger** – surface a button in the results panel that runs the renderer, converts the canvas into a PNG data URL, and prompts a local download.

## Open Questions / Follow-ups
- Confirm how the “total volume” should be phrased (e.g., `After: 1.12×` vs. percentage change) to stay number-lite but still informative.
- Explore future reuse for other shareable assets (e.g., adding scenario metadata, waterfall summary, etc.).

## Validation
- Manually run the export with a few sample portfolios to ensure the image renders, respects color mapping, and hides raw dollar amounts.
