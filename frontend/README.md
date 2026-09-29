# Polydros frontend

A Vite + React + TypeScript app with two tabs:

- **Cards** (`#cards`, the default): the card browser in `src/cards/`. Every
  card as a thumbnail, with search and filters by colour, type and rarity;
  click a card for its picture and details. Everything comes from the
  backend's `GET /cards`, so there's no copy of the card list in the frontend.
  Pictures need the `images/` folder; see the main README.
- **Old simulation** (`#old-simulation`): the page from before the redesign,
  in `src/components/`. It only starts a simulation run when you open it, and
  it goes once the new result views replace it.

The backend address is `API_BASE` in `src/api.ts` (`http://127.0.0.1:8000`).
The backend allows requests from any origin, so no proxy is needed in
development.

## Run

Start the backend first (see the [main README](../README.md)), then:

```
npm install
npm run dev        # http://localhost:5173
npm run build      # production build into dist/
```

## Test

```
npx vitest run                              # unit tests in src/**/__tests__ and src/hooks
npm run test:e2e                            # Playwright tests in tests/
npx playwright test tests/e2e-combat.spec.ts
npx playwright test --ui                    # interactive
```

The Playwright tests cover the old simulation page, so they open
`#old-simulation`. Most of them fail, and already did before the card
browser: their input selectors never match (#63).

The Playwright config starts the backend on port 8000 and Vite on port 5173 if
they aren't already running. If they are, it reuses them, so stop old servers
first if you want to test the current code. The first run needs
`npx playwright install chromium`.
