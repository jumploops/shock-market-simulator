# GitHub Pages deployment notes (2025-02-14)

## Current layout

- Root: meta docs (`README.md`, `plan/`, `debug/`), plus `app/` holding the React/Vite project.
- `app/public/` contains the marketing assets (`favicon.ico`, `logo.png`, screenshot).
- Build command: `pnpm run build` (runs `tsc -b` + `vite build`).
- Vite config (`app/vite.config.ts`) is default—no `base` configured yet.
- No GitHub Actions workflows present.

## Requirements for GitHub Pages

GitHub Pages (static) needs the built assets hosted from either:
1. `/docs` folder in default branch, or
2. `gh-pages` branch, or
3. GitHub Actions workflow that publishes to Pages (recommended).

For React/Vite + client-side routing (we have none yet), only a static build is needed.

### Base path / custom domain
- Target domain: **shockmarketsimulator.com** (served via GitHub Pages).
- With a custom apex domain, Vite can keep the default `base: "/"` (no repo subpath).
- We should add a `CNAME` file under `app/public/` with `shockmarketsimulator.com` so the build includes it.

### Scripts
- `pnpm run build` creates `dist/`.
- We should deploy `app/dist` to Pages.

## Proposed approach

1. **GitHub Actions workflow**
   - Add `.github/workflows/deploy.yml` with steps:
     - `pnpm install`
     - `pnpm run build`
     - Upload artifact `app/dist`
     - Use `actions/deploy-pages` to publish to Pages.
   - Configure to run on push to `main`.
   - Use `actions/configure-pages` + `actions/upload-pages-artifact`.

2. **Custom domain setup**
   - Add `app/public/CNAME` with `shockmarketsimulator.com`.
   - Configure DNS (A/ALIAS/ANAME to GitHub Pages IPs or CNAME to `jumploops.github.io`).
   - Enable Pages → Build and deployment → GitHub Actions workflow; set custom domain to `shockmarketsimulator.com`.

3. **Optional**: link to deployed site in README once live.

## Tasks before enabling

- [ ] Create `app/public/CNAME` with `shockmarketsimulator.com`.
- [ ] Add deploy workflow under `.github/workflows`.
- [ ] Confirm `pnpm` is available in GitHub Actions (use `pnpm/action-setup` or install manually).
- [ ] Push to `main` and verify Pages deployment.
