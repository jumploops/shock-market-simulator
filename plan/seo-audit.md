# SEO Audit — Shock Market Simulator

## Current Head & Meta Tags
- **HTML title**: `Shock Market Simulator` (recently updated; good faith keyword coverage).
- **Charset & viewport**: present (UTF-8 & responsive viewport). No issues.
- **Missing meta descriptions**: default `index.html` contains no `<meta name="description">`; crawlers will rely on content snippets.
- **Missing Open Graph tags**: no `og:title`, `og:description`, `og:image`, `og:url`.
- **Missing Twitter Card tags**: no `twitter:card`, `twitter:title`, etc.
- **No canonical link**: helpful once custom domain is set to avoid duplicate content (e.g., GitHub Pages vs sitemap).
- **No manifest or theme meta**: optional, but `public/` contains icons (Android/iOS) without matching `<link rel="manifest">` or color meta.

## Content & Structure
- **H1/H2 structure**: heading hierarchy inside the SPA is consistent (`Shock Market Simulator` heading plus section titles). Adequate for assistive tech.
- **Alt text**: the landing screenshot in README uses alt text via markdown; in-app images (logo) lack explicit `alt` beyond general description. The onboarding logo uses `alt="Shock Market logo"`; good.
- **Internal copy**: home page includes scenario descriptions, but no dedicated marketing text within a `meta` description.
- **Routing**: single page app; no sitemap or structured data. Not critical for MVP but could be added later.

## Assets & Icons
- Favicon (`favicon.ico`) and touch icons present in `public/`. No manifest linking them.
- `public/screenshot.png` could serve as OG image.

## Deployment Considerations
- `CNAME` already set to `shockmarketsimulator.com` (good for canonical domain).
- GitHub Pages workflow handles builds; ensure Pages custom domain is configured so canonical metadata can point to it.

## Recommended Next Steps
1. **Add meta description** (70-160 chars) to `app/index.html` head.
2. **Add Open Graph & Twitter card tags** referencing title, description, and screenshot.
3. **Add canonical link** pointing to `https://shockmarketsimulator.com/` once domain is live.
4. Optional: add `link rel="manifest"` or `theme-color` for richer PWA behavior.
5. Optional: include structured data (JSON-LD) describing the tool (type: SoftwareApplication or FinancialService).

No changes applied yet; ready to implement once priorities are confirmed.
