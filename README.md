<div align="center">

<img src="public/favicon.svg" alt="" width="88" height="88" />

# Life Timeline

**Map the moments that shaped your story.**

A private, browser-only app for drawing your life as a line<br />
and reflecting on its highs, lows and turning points.

### [Open the app →](https://tentts.github.io/LifeTimeline/)

[![Build](https://img.shields.io/github/actions/workflow/status/Tentts/LifeTimeline/deploy.yml?branch=main&style=flat-square&label=build&color=2f5fc4)](https://github.com/Tentts/LifeTimeline/actions/workflows/deploy.yml)
[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-c8417a?style=flat-square)](LICENSE)
[![Private by design](https://img.shields.io/badge/data-stays_in_your_browser-7a50a0?style=flat-square)](#-privacy)

</div>

> [!IMPORTANT]
> Life Timeline is a tool for self-reflection, not a substitute for therapy. Revisiting difficult
> memories can be painful. If you feel overwhelmed, please reach out to a mental health
> professional.

## ✨ Features

- **Lifeline graph:** see your life's highs and lows at a glance, on desktop or phone.
- **Guided walkthrough:** move through your life one period at a time, with gentle prompts.
- **Flexible events:** only a title and a year are needed, and dates can be approximate.
- **Room for reflection:** add feelings, turning points, life areas, people, notes and symbols.
- **Exports:** create a PDF to print or share, a PNG image, or a `.tl` backup file.
- **Comfortable to use:** available in English and Spanish, with light and dark themes.

## 🧭 How to use it

1. [Open the app](https://tentts.github.io/LifeTimeline/) and create a timeline.
2. Add the events that feel important and mark how each one felt, or start the guided walkthrough.
3. Look at your lifeline for turning points, strengths and recurring themes.
4. **Export a `.tl` file to keep a backup.** Open it later to continue, even on another device.

## 🔒 Privacy

Your timeline is stored only in your browser. There is no account and no backend, and the
production build includes a
[Content-Security-Policy](src/security/csp.ts) that tells the browser to block network requests
from the app.

Because the data lives only in your browser, clearing browser data can erase it. Keep a `.tl`
backup somewhere safe.

## 🛠️ Run it locally

Requires [Node.js](https://nodejs.org/) LTS.

```sh
git clone https://github.com/Tentts/LifeTimeline.git
cd LifeTimeline
npm install
npm run dev
```

Before opening a pull request, run `npm run lint`, `npm run format:check`, `npm test` and
`npm run build`.

## 🚀 Deploy your own

The app builds to plain static files, so it can be hosted almost anywhere.

**GitHub Pages**

1. Fork this repository.
2. If you rename it, update `base` in [`vite.config.ts`](vite.config.ts) to `/<repo-name>/`.
3. Go to **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**.
4. Push to `main`. The included workflow tests, builds and publishes the site.

**Any other static host**

Set `base` in [`vite.config.ts`](vite.config.ts) to the path you will serve from (`/` for a domain
root), run `npm run build`, and upload the `dist/` folder.

## 📚 Documentation

- [`.tl` file format](docs/FILE_FORMAT.md)
- [Translating the app](docs/TRANSLATING.md)
- [Branches and releases](docs/WORKFLOW.md)
- [Research notes](docs/RESEARCH.md)
- [Development plan](docs/DEVELOPMENT_PLAN.md)

## 📄 License

Copyright © 2026 Tentts. Released under the [GNU General Public License v3.0](LICENSE).
