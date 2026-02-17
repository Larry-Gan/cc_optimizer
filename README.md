# Credit Card Cashback Optimizer

Static React + TypeScript web app for modeling spending, browsing cards, building portfolios, running portfolio optimization, and comparing results.

## Stack

- React + TypeScript + Vite
- Tailwind CSS
- Zustand (persisted local storage)
- Vitest + Testing Library

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Notes

- Built-in cards live in `public/data/cards.json`.
- User data persists in `localStorage` with versioned keys.
- Optimizer supports exact search on smaller card pools and heuristic fallback on larger pools.
