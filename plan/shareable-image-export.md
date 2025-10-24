# Shareable Image Export Feature

## Overview
Create a feature that allows users to generate and download a shareable image showing before/after pie charts of their portfolio composition. The image will display the change in asset ratios and total volume without revealing specific dollar amounts, making it suitable for social sharing.

## Current State Analysis

### Existing Visualization
- **CompositionChart.tsx** (lines 1-96): Uses Recharts BarChart component for stacked bar visualization
- Displays "Now" vs "After" states in stacked bars
- Categories: cash_insured, cash_other, bonds, stocks, gold, real_estate_value, other, margin_debt, etc.
- Color-coded by asset type (defined in CATEGORY_DEFINITIONS)
- Current format: Two stacked bars side-by-side

### Data Flow
1. **Dashboard.tsx** computes `aggregatedCategories` (lines 195-221)
   - Calculates before/after values for each category
   - Filters out categories with zero values
2. **compositionChartData** (lines 223-239): Transforms into chart format
3. **compositionCategories** (lines 241-249): Provides color/label mapping

### Available Libraries
- **Recharts 2.15.4** - Already installed for charts
- **React 19.1.1 / React DOM 19.1.1** - For rendering

## Requirements

### Functional Requirements
1. Generate pie charts showing portfolio composition (not stacked bars)
2. Two pie charts: "Before" and "After"
3. Show percentages/ratios only (no dollar amounts)
4. Display total volume change as a percentage
5. Maintain color scheme from existing visualization
6. Download as image file (PNG or JPEG)
7. Client-side generation only (no server upload)

### Visual Requirements
1. Clean, shareable design suitable for social media
2. Match existing brand aesthetic (brutalist design with #0c0d10 borders, shadows)
3. Include scenario name and selected options
4. Maintain accessibility (clear labels, good contrast)
5. Responsive sizing for different share platforms

## Implementation Plan

### Phase 1: Create Pie Chart Renderer Component

**File: `/app/src/components/ShareableImageRenderer.tsx`**

Create a new component that:
- Accepts the same data structure as CompositionChart
- Renders TWO pie charts side-by-side using Recharts PieChart
- Displays percentage labels instead of dollar amounts
- Shows net worth change as a percentage
- Includes scenario metadata (name, horizon, location risk)
- Uses a fixed canvas size optimized for social sharing (e.g., 1200x630 for OG images)

Key elements:
```typescript
interface ShareableImageRendererProps {
  data: CompositionRow[];
  categories: CompositionCategory[];
  scenarioName: string;
  horizonLabel: string;
  netWorthDeltaPct: number;
  options: Options;
}
```

Design considerations:
- Use Recharts PieChart with two Pie components
- Calculate percentages from absolute values
- Add custom labels showing category name + percentage
- Include a header with scenario details
- Add footer with branding/disclaimer
- Use brutalist styling matching app aesthetic

### Phase 2: Image Export Functionality

**File: `/app/src/utils/imageExport.ts`**

Create utility functions for exporting the rendered component as an image:

1. **html2canvas approach** (requires new dependency):
   - Install: `npm install html2canvas`
   - Render component to hidden DOM element
   - Convert to canvas using html2canvas
   - Export as PNG/JPEG blob
   - Trigger download

2. **Alternative: Canvas API approach** (no new dependencies):
   - Use Recharts' built-in SVG rendering
   - Convert SVG to canvas using Canvas API
   - Export as image blob

Recommended: **html2canvas** for better cross-browser support and easier rendering of complex layouts.

Functions to implement:
```typescript
// Render React component to image blob
async function renderComponentToImage(
  component: ReactElement,
  options?: { width: number; height: number; scale: number }
): Promise<Blob>

// Trigger browser download
function downloadImage(blob: Blob, filename: string): void

// Generate filename with metadata
function generateFilename(scenarioName: string): string
```

### Phase 3: Integration with Dashboard

**File: `/app/src/components/dashboard/Dashboard.tsx`**

Add export functionality to the ResultsPanel:

1. Add a "Share Image" button near the charts section
2. Button styling should match existing brutalist design (lines 337-359 for button reference)
3. On click:
   - Render ShareableImageRenderer with current data
   - Convert to image using imageExport utility
   - Download file with descriptive name (e.g., `shock-market-1929-crash-2025-10-22.png`)

Button placement options:
- **Option A**: Add to chart-section header (lines 658-676)
- **Option B**: Add as separate action button in ResultsPanel header
- **Option C**: Add inside each chart-card with context menu

Recommended: **Option A** - Add single button above chart-section that exports combined view.

### Phase 4: Styling and Polish

**File: `/app/src/App.css`**

Add styles for:
1. `.shareable-image-container` - Fixed-size container for rendering (hidden from view)
2. `.share-button` - Export button styling matching brutalist design
3. `.shareable-image-header` - Header section with scenario info
4. `.shareable-image-charts` - Two-column layout for pie charts
5. `.shareable-image-footer` - Footer with disclaimer/branding

Design specifications:
- Canvas size: 1200x630px (Facebook/Twitter OG standard)
- Background: #fdf9f0 (matches panel background)
- Border: 2px solid #0c0d10
- Shadow: 4px 4px 0 #0c0d10
- Font: System font stack (matches app)
- Pie chart size: ~400px diameter each
- Spacing: Use existing CSS variables where possible

### Phase 5: Testing and Edge Cases

Test scenarios:
1. **Empty portfolio**: Disable button or show message
2. **Single asset type**: Ensure pie chart renders correctly (100%)
3. **Many asset types**: Ensure labels don't overlap
4. **Negative net worth**: Handle display appropriately
5. **Long scenario names**: Truncate or wrap text
6. **Mobile devices**: Ensure download works on iOS/Android
7. **Browser compatibility**: Test on Chrome, Firefox, Safari, Edge

Error handling:
- Catch rendering errors and show user-friendly message
- Handle download failures gracefully
- Provide fallback if html2canvas fails

## Technical Decisions

### Pie Chart vs Current Bar Chart
**Decision**: Create separate PIE chart visualization for sharing
**Rationale**:
- Pie charts better show proportional relationships
- More visually engaging for social media
- Percentages more intuitive than stacked bars for quick comprehension
- Keep existing bar chart for detailed analysis

### Image Format
**Decision**: PNG format
**Rationale**:
- Lossless quality for charts/text
- Broad browser/platform support
- Reasonable file size for sharing
- Better than JPEG for graphics with text

### Image Generation Library
**Decision**: html2canvas
**Rationale**:
- Well-maintained, 20K+ stars on GitHub
- Works with React components
- No server-side rendering needed
- Good cross-browser support
- Alternative considered: dom-to-image (less maintained)

### Data Privacy
**Decision**: Show percentages only, hide absolute amounts
**Rationale**:
- Respects user privacy
- Makes sharing more comfortable
- Still conveys meaningful information about portfolio shifts
- Aligns with social sharing use case

## Implementation Checklist

### Dependencies
- [ ] Install html2canvas: `npm install html2canvas @types/html2canvas`

### New Files
- [ ] Create `/app/src/components/ShareableImageRenderer.tsx`
- [ ] Create `/app/src/utils/imageExport.ts`

### Modified Files
- [ ] Update `/app/src/components/dashboard/Dashboard.tsx`
  - Import new components/utils
  - Add share button to ResultsPanel
  - Wire up click handler
  - Pass necessary props
- [ ] Update `/app/src/App.css`
  - Add shareable image styles
  - Add share button styles
- [ ] Update `/app/package.json` (via npm install)

### Testing
- [ ] Test with various portfolio compositions
- [ ] Test edge cases (empty, single asset, many assets)
- [ ] Test on multiple browsers
- [ ] Test on mobile devices
- [ ] Verify downloaded image quality
- [ ] Verify filename generation
- [ ] Test with different scenarios and options

## Future Enhancements (Out of Scope)

1. **Customizable branding**: Allow users to add personal notes/branding
2. **Multiple export formats**: Add JPEG, SVG options
3. **Share directly to social**: Integration with Web Share API
4. **Copy to clipboard**: Alternative to download
5. **Image size options**: Small/Medium/Large presets
6. **Include waterfall chart**: Option to add contribution breakdown
7. **Animation/GIF**: Show transition from before to after
8. **Comparison mode**: Compare multiple scenarios side-by-side

## Open Questions

1. **Should we include absolute net worth delta or percentage only?**
   - Recommendation: Percentage only for privacy

2. **Should location risk and other advanced options be shown?**
   - Recommendation: Yes, show all scenario parameters for context

3. **Should the image include a timestamp?**
   - Recommendation: Yes, helps with versioning/context

4. **What should the button label be?**
   - Options: "Download Image", "Share Image", "Export Chart", "Download Share Image"
   - Recommendation: "Download Share Image" - clear and explicit

5. **Should we show the "real vs nominal" toggle state?**
   - Recommendation: Yes, include in metadata section

## Estimated Effort

- Phase 1 (Renderer Component): 3-4 hours
- Phase 2 (Export Functionality): 2-3 hours
- Phase 3 (Dashboard Integration): 1-2 hours
- Phase 4 (Styling): 2-3 hours
- Phase 5 (Testing): 2-3 hours

**Total: 10-15 hours**

## Success Criteria

1. ✅ User can click button to generate shareable image
2. ✅ Image shows two pie charts (before/after)
3. ✅ Image displays percentages, not dollar amounts
4. ✅ Image includes scenario name and key parameters
5. ✅ Image downloads with descriptive filename
6. ✅ Image quality is suitable for social media
7. ✅ Feature works on modern browsers (Chrome, Firefox, Safari, Edge)
8. ✅ Feature handles edge cases gracefully
9. ✅ Styling matches app's brutalist aesthetic
10. ✅ No personal financial data exposed in default view
