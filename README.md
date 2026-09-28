# Polydros: a trading card game economy simulator

[![codecov](https://codecov.io/gh/suolenkainen/polydros-simulator/branch/main/graph/badge.svg)](https://codecov.io/gh/suolenkainen/polydros-simulator)

Polydros simulates the economy of a trading card game. Agents with different
traits buy and open booster packs, play games against each other, and buy and
sell cards on a market. Runs are seeded, so the same settings always give the
same result. A FastAPI backend runs the simulation and a React frontend shows
the agents, their cards, the market and each card's price history.

[ARCHITECTURE.md](ARCHITECTURE.md) explains how the simulation works.
[CLAUDE.md](CLAUDE.md) has the working rules for coding agents, and they apply
to people too.

## Setup

You need Python 3.11 or newer and Node.js 20. `requirements.txt` has what the
backend needs to run; `requirements-dev.txt` adds the test and lint tools.
Install the dev one for development.

```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements-dev.txt
cd frontend
npm install
```

## Run it

`run_all.ps1` runs ruff, mypy and pytest, then opens the backend and frontend
in two new windows and opens the browser:

```
powershell -ExecutionPolicy Bypass -File .\run_all.ps1
```

Or start them yourself, each in its own terminal:

```
uvicorn backend.main:app --reload      # http://127.0.0.1:8000, API docs at /docs
cd frontend; npm run dev               # http://localhost:5173
```

The frontend expects the backend at `http://127.0.0.1:8000`.

## Test

```
pytest -q                                                   # Python tests, from the repo root
pytest --cov=simulation --cov=backend --cov-report=term     # with coverage
cd frontend; npx vitest run                                 # frontend unit tests
cd frontend; npm run test:e2e                               # Playwright
```

Playwright starts the backend and Vite itself if they aren't already running.
If old servers are still up, it reuses them and tests run against old code.

CI ([ci.yml](.github/workflows/ci.yml)) runs the Python tests on Python 3.11
and builds the frontend. It doesn't run the frontend tests yet (#14).

## Lint

```
ruff check .
black --check .
mypy --explicit-package-bases .
```

These run in CI but don't fail the build yet (#15).

## Card data

The simulation reads the card list from `simulation/data/cards.json`. It was
first generated from `polydros_master_set_v1.xlsx`, but the two have drifted
apart. Don't run the export script until #33 is fixed; see
[scripts/README.md](scripts/README.md).
