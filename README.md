# LifeTimeline

A private, serverless web app to help people create and reflect on their **Life Timeline**: the
psychological lifeline exercise of placing life events on a time axis and rating their emotional
impact.

**Live app:** <https://tentts.github.io/LifeTimeline/>

> ⚠️ This is a self-reflection tool, not a substitute for therapy.

All data stays in your browser. There is no backend; the app is a static site on GitHub Pages.

## Docs

- [Research notes](docs/RESEARCH.md)
- [Development plan](docs/DEVELOPMENT_PLAN.md)
- [Translating](docs/TRANSLATING.md)

## Development

Requires Node.js (LTS). Node is only needed to build; the output is plain static files.

```sh
npm install
npm run dev          # local dev server
npm test             # unit tests (incl. translation completeness checks)
npm run lint
npm run build        # static site into dist/
npm run preview      # serve dist/ at /LifeTimeline/ like GitHub Pages
```

## Deployment

Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which lints,
tests, builds and publishes `dist/` to GitHub Pages.

One-time setup on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
