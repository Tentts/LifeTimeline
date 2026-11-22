# Development Starting Point

## Product vision

A private, browser-only web app that guides a person through building their Life Timeline:
adding events, rating them, grouping them into chapters, visualising the result as a
peaks-and-valleys graph (or a NET-style rope with flowers & stones) and reflecting on it.
See [RESEARCH.md](RESEARCH.md) for the psychological background.

## Hard constraints

- **Static & serverless** — deployed on GitHub Pages; no backend, no accounts.
- **Private by design** — data lives only in the user's browser (IndexedDB). No analytics,
  no third-party calls. Explicit JSON export/import for backup and moving between devices.
- **Not therapy** — visible disclaimer, gentle tone, crisis-resources link, never force detail.
- Works offline (PWA in a later phase), usable on mobile and desktop.

## Proposed tech stack

| Concern | Choice | Why |
|---|---|---|
| Build | **Vite** | Fast, trivial static build for GH Pages (`base` config). |
| Language | **TypeScript** | Data model safety. |
| UI | **React** | Large ecosystem; alternative: Svelte (smaller) — decide before Phase 0. |
| Timeline rendering | **Custom SVG** (+ `d3-scale` only) | Full control over peaks/valleys, rope view, zoom. |
| Storage | **IndexedDB via `idb`** | Robust local persistence. |
| Validation | **zod** | Validate imported JSON files. |
| Tests | **Vitest** + Testing Library | Unit tests for model/storage. |
| CI/CD | **GitHub Actions** → GitHub Pages | Build + deploy on push to `main`. |
| i18n | Simple message files (EN / ES) | Users likely bilingual. |

## Core data model (v1)

```ts
type FuzzyDate = { year: number; month?: number; day?: number; approx?: boolean };

interface Timeline {
  id: string;
  title: string;
  person: { name?: string; birthDate: FuzzyDate };
  events: LifeEvent[];
  periods: LifePeriod[];       // chapters
  reflection?: string;         // themes, turning points, next steps
  schemaVersion: 1;
  createdAt: string; updatedAt: string;
}

interface LifeEvent {
  id: string;
  title: string;
  start: FuzzyDate;
  end?: FuzzyDate;             // events can span time
  valence: number;             // -5 … +5 (0 = neutral)
  symbol?: 'flower' | 'stone' | 'candle' | 'stick' | 'star';
  tags: string[];              // life areas: family, health, work…
  people: string[];
  description?: string;
  reflection?: string;         // lessons, resources, values
  isTurningPoint?: boolean;
}

interface LifePeriod { id: string; name: string; start: FuzzyDate; end?: FuzzyDate; color?: string; }
```

## Roadmap

### Phase 0 — Scaffolding (first development session)
- Vite + React + TS project, ESLint/Prettier, Vitest.
- GitHub Actions workflow deploying `dist/` to GitHub Pages.
- Base layout, disclaimer banner, EN/ES strings.

### Phase 1 — MVP
- Create/edit one timeline (birth date, title).
- CRUD events with the fields above (fuzzy dates, valence slider, symbol, tags).
- **Lifeline graph view**: SVG, x = age/year, y = valence, line through events, peaks & valleys.
- List view sorted chronologically.
- Persist to IndexedDB; export/import JSON.

### Phase 2 — Guided experience
- Step-by-step wizard (birth → childhood → adolescence → adulthood → present) with prompts
  inspired by the Lifeline and McAdams Life Story Interview.
- Chapters/periods as background bands on the graph.
- Turning points highlighted; reflection page with guided questions.
- Safety features: "take a break" prompts, crisis-resources page.

### Phase 3 — Views & sharing
- NET-style "rope" view (flowers, stones, candles).
- Filter by tag/life area; zoom & pan.
- Print-friendly / PDF / PNG export to bring to a therapist.

### Phase 4 — Polish
- PWA / offline, multiple timelines, optional passphrase encryption of stored data,
  accessibility audit, future-events ("desired future") section.

## Open decisions for the next session
1. React vs. Svelte.
2. GitHub repository name/owner (needed for Vite `base` path and Pages URL).
3. UI language default (EN or ES).
