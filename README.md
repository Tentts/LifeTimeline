# LifeTimeline

A private, serverless web app to help people create and reflect on their **Life Timeline**: the
psychological lifeline exercise of placing life events on a time axis and rating their emotional
impact.

**Live app:** <https://tentts.github.io/LifeTimeline/>

> ⚠️ This is a self-reflection tool, not a substitute for therapy.

**We never store your data.** The app is just a set of tools that runs in your browser. Your
timelines are kept only in this browser's local storage and in files you export yourself. There is
no backend; the app is a static site on GitHub Pages.

Export to **PDF**, **PNG** or the app's own **`.tl`** format, and open `.tl` files to continue
where you left off.

## Docs

- [Research notes](docs/RESEARCH.md)
- [Development plan](docs/DEVELOPMENT_PLAN.md)
- [Translating](docs/TRANSLATING.md)
- [`.tl` file format](docs/FILE_FORMAT.md)

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
