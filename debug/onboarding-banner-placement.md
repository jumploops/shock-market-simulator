# Onboarding Banner Placement Investigation

## Current Behavior
- The green security banner renders inside the `.onboarding` container but CSS shows the container is `display: flex; flex-direction: column; justify-content: center; align-items: center;`.
- Because `.onboarding` uses `justify-content: center` in combination with `min-height: 100vh`, the entire flex column (banner + onboarding content) gets vertically centered. On large screens this makes the banner drift towards the top-right/center depending on available space, rather than appearing immediately above the panel boundary.
- The banner itself uses `margin: 0 auto; width: fit-content;`, so it shrinks to text width but still participates in flex centering.

## Hypotheses
1. **Flex centering conflict**: The parent `.onboarding` flex container centers all children vertically. Even if the banner is first, the whole stack is middle-aligned within the viewport, making the banner appear separated from the panel edge.
2. **Spacing expectations**: Users expect a banner hugging the panel (e.g., position: absolute relative to wrapper, or negative margin). Current layout adds a fixed gap (`gap: 1.25rem`) above the wrapper, further distancing the banner.
3. **Width perception**: Because `.onboarding-wrapper` has a max width and the banner uses `width: fit-content`, the banner may overhang visually when the wrapper is narrow or the viewport wide.

## Potential Fixes
- Convert `.onboarding` to `align-items: center;` but remove `justify-content: center`, letting content sit near the top with padding. Alternatively, wrap both banner and panel inside `.onboarding-wrapper` so they share the same width and positioning.
- Nest banner inside `.onboarding-wrapper` above the panel list to ensure consistent alignment and spacing control via the wrapper’s grid gap.
- Apply `width: 100%` minus padding to the banner (or use `align-self: stretch`) so it matches the wrapper width and feels attached to the component.

## Next Steps
1. Move the banner inside `.onboarding-wrapper`, positioned before step content but within the wrapper grid so it spans full width.
2. Adjust `.onboarding` layout to rely on top padding rather than vertical centering, e.g., remove `justify-content` or set `min-height: auto` so the stack flows naturally.
3. Revisit banner styling once placement is fixed, ensuring the “alert” look still fits the neo-brutalist aesthetic.

