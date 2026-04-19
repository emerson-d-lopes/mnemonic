# mnemonic — CLAUDE.md

## Commands

```bash
pnpm dev          # start dev server (Vite, http://localhost:5173)
pnpm build        # production build
pnpm preview      # preview production build locally
pnpm tsc --noEmit # type check (run before committing)
```

## Stack

- **React 19** + **TypeScript** + **Vite 8**
- **Tailwind CSS 4** via `@tailwindcss/vite` (no config file — uses `@theme inline` in CSS)
- **Dexie v4** (IndexedDB) + **dexie-react-hooks** (`useLiveQuery`)
- **ts-fsrs v5** — FSRS-5 spaced repetition algorithm
- **React Router v7** — `BrowserRouter`, no loader/action pattern

## Design system

Ash Lumen design system. Tokens live in `src/tokens.css` (generated — do not edit directly).
All text is lowercased globally via CSS (`text-transform: lowercase`). Do not fight it.
Use the utility classes already defined: `btn`, `btn-primary`, `btn-ghost`, `btn-danger`, `btn-secondary`, `card`, `input`, `textarea`, `badge`, `badge-info`.

## Architecture

```
src/
  db/index.ts          Dexie schema + interfaces (Card, Deck, ReviewLog)
  lib/
    fsrs.ts            ts-fsrs wrapper (scheduleCard, getIntervals, formatInterval)
    utils.ts           randomId, toDateStr (local YYYY-MM-DD), formatDue
    seed.ts            seedData() — populates sample decks/cards, clears reviewLogs
  hooks/
    useCards.ts        useCards(deckId), useDeckStats(deckId)
    useDecks.ts        useDecks()
    useReviews.ts      useReviewsByDate(), useTotalReviews(), useGlobalCardStats()
  components/
    HeatMap.tsx        52-week calendar heatmap (Mon-anchored, count-based intensity)
    Layout.tsx         header nav + ThemeToggle
    ThemeToggle.tsx
  pages/
    Home.tsx           deck list + "load sample data"
    Deck.tsx           card list + add/edit/delete + state breakdown
    Study.tsx          study session (keyboard shortcuts: space=flip, 1-4=rate)
    Stats.tsx          global stats + heatmap + per-deck table
```

## Data model

- **Card** — stores FSRS fields directly (`stability`, `difficulty`, `elapsed_days`, `scheduled_days`, `reps`, `lapses`, `learning_steps`, `state`, `due` as ms timestamp, `last_review` as ms or null)
- **ReviewLog** — written on every rating in Study; `date` is local YYYY-MM-DD (via `toDateStr()`); used for heatmap
- Dexie is at **version 2**. v1→v2 added `reviewLogs` table (purely additive, no `.upgrade()` needed)

## FSRS notes

- `Rating.Manual = 0` is excluded from `IPreview` — cast to `Grade` when indexing scheduling results
- `scheduled_days` is 0 for learning-phase cards (sub-day steps). Use `due.getTime() - now` for accurate interval display, not `scheduled_days`
- `formatInterval` handles minutes, hours, days, and months
