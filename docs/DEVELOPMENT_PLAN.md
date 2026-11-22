# Development Starting Point

## Product vision

A private, browser-only web app that guides a person through building their Life Timeline:
adding events, rating them, grouping them into chapters, visualising the result as a
peaks-and-valleys graph (or a NET-style rope with flowers & stones) and reflecting on it.
See [RESEARCH.md](RESEARCH.md) for the psychological background.

## Hard constraints

- **Static & serverless** — deployed on GitHub Pages; no backend, no accounts.
- **We never store user data.** The app only provides the tools; the user's work stays on
  the user's device. See [Privacy & data handling](#privacy--data-handling).
- **Export / import** — export to **PDF**, **PNG** and our own **`.tl`** format (only these
  three for now); import from **`.tl`** only. See [FILE_FORMAT.md](FILE_FORMAT.md).
- **Not therapy** — visible disclaimer, gentle tone, crisis-resources link, never force detail.
- Works offline (PWA in a later phase), usable on mobile and desktop.

## Proposed tech stack

| Concern            | Choice                              | Why                                                            |
| ------------------ | ----------------------------------- | -------------------------------------------------------------- |
| Build              | **Vite**                            | Fast, trivial static build for GH Pages (`base` config).       |
| Language           | **TypeScript**                      | Data model safety.                                             |
| UI                 | **React**                           | Large ecosystem. (Decided.)                                    |
| Timeline rendering | **Custom SVG** (+ `d3-scale` only)  | Full control over peaks/valleys, rope view, zoom.              |
| Storage            | **IndexedDB via `idb`**             | Robust local persistence.                                      |
| Validation         | **zod**                             | Validate imported `.tl` files.                                 |
| PNG export         | SVG → `<canvas>` → `toBlob()`       | Native browser APIs, no library.                               |
| PDF export         | **jsPDF** + **svg2pdf.js**          | Vector PDF generated entirely in the browser.                  |
| Tests              | **Vitest** + Testing Library        | Unit tests for model/storage.                                  |
| CI/CD              | **GitHub Actions** → GitHub Pages   | Build + deploy on push to `main`.                              |
| i18n               | **i18next** + one JSON per language | EN default, ES included; see [TRANSLATING.md](TRANSLATING.md). |

## Core data model (v1)

```ts
type FuzzyDate = { year: number; month?: number; day?: number; approx?: boolean };

interface Timeline {
  id: string;
  title: string;
  person: { name?: string; birthDate: FuzzyDate };
  events: LifeEvent[];
  periods: LifePeriod[]; // chapters
  reflection?: string; // themes, turning points, next steps
  createdAt: string;
  updatedAt: string;
}

interface LifeEvent {
  id: string;
  title: string;
  start: FuzzyDate;
  end?: FuzzyDate; // events can span time
  valence: number; // -5 … +5 (0 = neutral)
  symbol?: 'flower' | 'stone' | 'candle' | 'stick' | 'star';
  tags: string[]; // life areas: family, health, work…
  people: string[];
  description?: string;
  reflection?: string; // lessons, resources, values
  isTurningPoint?: boolean;
}

interface LifePeriod {
  id: string;
  name: string;
  start: FuzzyDate;
  end?: FuzzyDate;
  color?: string;
}
```

The on-disk `.tl` format wraps this model with a format name and version; see
[FILE_FORMAT.md](FILE_FORMAT.md).

## Privacy & data handling

The app is a set of tools that runs in the user's browser. **Nothing the user enters is ever
sent to us or to anyone else, and we have no server to store it on.**

**Where user work lives**

- In memory while editing.
- Autosaved in the browser's **IndexedDB** so work survives a reload. Small settings
  (language, disclaimer accepted) go in `localStorage`.
- In files the user saves themselves: `.tl`, PDF, PNG. Exports are generated in the
  browser and downloaded directly; nothing is uploaded.
- Ask the browser to keep the data (`navigator.storage.persist()`), but treat `.tl`
  export as the real backup.

**Enforcement, so it isn't just a promise**

- No analytics, trackers, CDNs, web fonts or any other third-party request. All assets
  ship with the app.
- A `Content-Security-Policy` meta tag with `connect-src 'none'` and `default-src 'self'`,
  so the browser itself blocks the app from sending data anywhere.
- A test that fails the build if the CSP is removed or loosened.

**Telling the user.** A **privacy notice is shown when a timeline is created**. It is part of
the "New timeline" step and has to be acknowledged; it is not a dismissible banner. It
explains:

1. Your timeline is stored only in this browser, on this device. We never receive or store it.
2. Clearing browser data, private/incognito mode, or switching device or browser will lose it.
3. Use **Export → .tl** to keep a backup or move it to another device, and **Open .tl** to load it.
4. Exported files (`.tl`, PDF, PNG) contain your personal story. Keep them somewhere safe.

The same message is also available any time from a "Privacy" link in the footer. A
**"Delete all my data from this browser"** action lets the user wipe IndexedDB and `localStorage`.

## Roadmap

### Phase 0 — Scaffolding ✅ done

- Vite + React + TS project, ESLint/Prettier, Vitest.
- GitHub Actions workflow deploying `dist/` to GitHub Pages.
- Base layout, disclaimer banner, EN/ES strings.

### Phase 1 — MVP ✅ done

- CSP meta tag and the test that guards it.
- "New timeline" step (title, birth date) **with the privacy notice**; footer "Privacy" page;
  "Delete all my data" action.
- CRUD events with the fields above (fuzzy dates, valence slider, symbol, tags).
- **Lifeline graph view**: SVG, x = age/year, y = valence, line through events, peaks & valleys.
- List view sorted chronologically.
- Autosave to IndexedDB.
- **Export `.tl`** and **Open `.tl`**, with validation and clear error messages.
- **Export PNG** (graph) and **Export PDF** (graph plus chronological event list).

### Phase 2 — Guided experience

- ✅ Step-by-step wizard (birth → childhood → adolescence → adulthood → present) with prompts
  inspired by the Lifeline and McAdams Life Story Interview.
- ✅ Chapters/periods as background bands on the graph.
- ✅ Turning points highlighted; reflection page with guided questions.
- Safety features: "take a break" prompts, crisis-resources page.

### Phase 3 — Views & sharing

- NET-style "rope" view (flowers, stones, candles).
- Filter by tag/life area; zoom & pan.
- PDF/PNG export of the rope view and of filtered views.

### Phase 4 — Polish

- PWA / offline, multiple timelines, optional passphrase encryption of stored data,
  accessibility audit, future-events ("desired future") section.

## Decisions

1. UI library: **React**.
2. Repository: **Tentts/LifeTimeline** → <https://tentts.github.io/LifeTimeline/> (Vite `base: '/LifeTimeline/'`).
3. Languages: **English** is the default and fallback; **Spanish** is included. The browser's
   language is detected on first visit and the user's choice is remembered.
4. Translation must stay easy: every UI string lives in `src/i18n/locales/<code>.json`.
5. **No user data is ever stored on our side.** Work stays in the browser and in files the
   user exports, and the user is told this when creating a timeline.
6. Export formats are **PDF, PNG and `.tl`** only for now. Import is **`.tl`** only.
