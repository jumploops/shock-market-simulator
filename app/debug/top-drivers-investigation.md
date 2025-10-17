# Top drivers investigation (2025-02-14)

## Observed behaviour

- Even with the advanced fields (`T-Bills`, `10Y Treasuries`, `IG corporates`) set to `0`, the **Top drivers** list still surfaces those rows with non‑zero dollar impacts.
- The panel also shows unexpected dollar amounts (e.g. `Other assets: $22K`) that do not match any explicit entry in the form.

## How the current implementation works

1. **Simple buckets are fanned out**  
   The shock engine works with the advanced keys (`tbills`, `treasuries_10y`, etc.). `getEffectivePortfolioAmounts` distributes every *simple* bucket proportionally across the mapped advanced keys when the user leaves the advanced inputs blank.  
   → Reference: `app/src/engine/portfolio.ts:82`.

2. **Shock items are reported per advanced key**  
   `computeShock` returns an item per advanced key that carries the before/after values (`app/src/engine/shockEngine.ts:49`). `Top drivers` simply sorts those items by absolute delta (`app/src/App.tsx:136`).

3. **So “0” in the advanced form still inherits the simple bucket**  
   Typing `0` into the advanced inputs overwrites only that specific key, but if the *simple* `Bonds` field is non‑zero it is still split across the remaining advanced keys. Visually it looks like “we entered 0”, but the underlying simple value keeps feeding the shock calculation.  
   Example: `Bonds (simple) = 30,000` ⇒ `tbills`, `treasuries_10y`, `corporates_ig` each receive `10,000` unless all three advanced overrides are also entered.

4. **Persisted state can resurrect earlier values**  
   Since we now keep the form in `localStorage`, any previous value for `other` (or advanced overrides) will come back even after a refresh unless it is cleared. The sanitizer converts stored strings into numbers (`app/src/App.tsx:125`) so an old `22000` resurfaces as a genuine portfolio holding.

## Hypotheses / root causes

| ID | Hypothesis | Evidence |
|----|------------|----------|
| H1 | The Top drivers list is genuinely reflecting the simple buckets fanned out to advanced keys. | Matches the fan-out logic and explains repeated appearances of `T-Bills` & friends even after entering `0` in the advanced form. |
| H2 | Persisted portfolio values (e.g. `other = 22000`) became sticky between sessions. | The new persistence layer restores prior entries and only deletes a key if the user clears the input (blank), not when switching scenarios. |
| H3 | Users expect Top drivers to collapse back to the simple buckets, so the current display is misleading rather than mathematically wrong. | Feedback that “we entered 0” suggests an expectation gap rather than a pure calculation bug. |

## Suggested next steps

1. **Clarify aggregation in the UI**  
   - Option A: group the `shockResult.items` by their originating simple bucket before rendering Top drivers (e.g. show “Bonds” with a combined delta).  
   - Option B: surface explicit badges (“split from Bonds input”) when showing advanced breakdowns.

2. **Expose the underlying numbers**  
   Add a debug drawer or tooltip that shows the actual portfolio values used in the calculation so users can verify what was persisted.

3. **Persistence UX tweaks**  
   - Provide a “Clear inputs” action to zero out both simple and advanced maps.  
   - When a simple bucket is `0`, explicitly wipe its mapped advanced keys so they never linger.

4. **Follow-up validation**  
   Re-test after any of the above changes with the following acceptance checks:
   - Simple bonds only ⇒ Top drivers should either show one “Bonds” row or clearly explain the split.  
   - Advanced overrides populated ⇒ ensure only the explicitly populated keys appear.  
   - After clearing data and refreshing, Top drivers should reflect an empty portfolio.

### Tooltip implementation notes (2025-02-14)

- New `Tooltip` component lives at `app/src/components/Tooltip.tsx`; it wraps an icon and renders contextual copy on hover/focus.
- `simpleFieldDescriptions`, `advancedFieldDescriptions`, and `advancedKeyOrigins` in `app/src/App.tsx` drive the helper text so future adjustments only require updating those dictionaries.
- Styles for the helper live in `App.css` under `.tooltip`, `.tooltip-icon`, and `.tooltip-content`.
