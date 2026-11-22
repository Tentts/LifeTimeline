# The `.tl` file format (version 1)

`.tl` is Life Timeline's own file format. It's how users back up a timeline, move it between
devices or browsers, and open it again later. It is the **only** format the app imports.

## Encoding

- A UTF-8 **JSON** document. It isn't compressed or encrypted (encryption may come later as a
  new version).
- File extension: **`.tl`**. When downloading, the app uses MIME type `application/json` and a
  file name derived from the timeline title, e.g. `my-life-2026-11-22.tl`.
- The open dialog filters on `accept=".tl"`. Files are read locally with the `File` API and
  are never uploaded.

## Structure

```jsonc
{
  "format": "lifetimeline", // required, exact value: identifies the file
  "version": 1, // required, integer: format version
  "exportedAt": "2026-11-22T18:00:00.000Z", // ISO 8601
  "app": { "version": "0.1.0" }, // app version that wrote the file (informational)
  "timeline": {
    "id": "b1f5…", // UUID
    "title": "My life",
    "person": { "name": "Alex", "birthDate": { "year": 1990, "month": 4 } },
    "events": [
      {
        "id": "…",
        "title": "Moved to Madrid",
        "start": { "year": 2008, "approx": true },
        "end": null,
        "valence": 3, // integer, -5 … +5
        "symbol": "flower", // flower | stone | candle | stick | star | null
        "tags": ["home", "education"],
        "people": [],
        "description": "…",
        "reflection": "…",
        "isTurningPoint": true,
      },
    ],
    "periods": [
      { "id": "…", "name": "University", "start": { "year": 2008 }, "end": { "year": 2012 } },
    ],
    "reflection": "…",
    "createdAt": "2026-11-20T10:00:00.000Z",
    "updatedAt": "2026-11-22T17:59:00.000Z",
  },
}
```

The `timeline` object follows the data model in [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md#core-data-model-v1).
`FuzzyDate` = `{ year, month?, day?, approx? }`. Month and day are optional so users can record
approximate memories.

## Import rules

1. Reject the file if it isn't JSON, if `format` isn't `"lifetimeline"`, or if `version` is
   missing. Show a friendly, translated error, never a stack trace.
2. **Newer version** than the app supports: refuse and ask the user to reload or update the app.
3. **Older version**: run it through migrations (`v1 → v2 → …`) before validating.
4. Validate the whole `timeline` with the zod schema. Unknown extra fields are dropped.
5. Imported text is shown as plain text only (never as HTML), and the file can't run any code.
6. If a timeline with the same `id` already exists in the browser, ask: **replace** it or
   **keep both** (the import gets a new `id`).
7. Size limit: refuse files over 10 MB.

## Versioning

- Any breaking change bumps `version` and adds a migration function and a fixture test.
- Adding an optional field doesn't need a version bump.
- Test fixtures for every version live in `src/format/__fixtures__/` (`v1.tl`, …).

## Privacy

A `.tl` file contains the user's personal story in readable text. The export dialog reminds
the user to keep it somewhere safe.
