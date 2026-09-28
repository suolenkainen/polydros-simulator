# Polydros frontend

A Vite + React + TypeScript app that runs a simulation through the backend and
shows the result: world stats, agents, their cards, the market, events, and a
price history chart for each card.

All backend calls go through `src/api.ts`, which expects the backend at
`http://127.0.0.1:8000`. The backend allows requests from any origin, so no
proxy is needed in development.

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

The Playwright config starts the backend on port 8000 and Vite on port 5173 if
they aren't already running. If they are, it reuses them, so stop old servers
first if you want to test the current code. The first run needs
`npx playwright install chromium`.
