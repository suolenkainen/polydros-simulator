# Polydros: a trading card game economy simulator

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

`run_all.ps1` runs pytest and, if it passes, opens the backend and frontend in
two new windows and opens the browser:

```
powershell -ExecutionPolicy Bypass -File .\run_all.ps1
```

Or start them yourself, each in its own terminal:

```
uvicorn backend.main:app --reload --port 8420   # API docs at /docs
cd frontend; npm run dev                        # http://localhost:5420
```

The frontend expects the backend at `http://127.0.0.1:8420`. Vite always uses
port 5420 and stops with an error if something else already has it.

## Test

```
pytest -q                        # Python tests, from the repo root
cd frontend; npx vitest run      # frontend unit tests
cd frontend; npm run test:e2e    # Playwright
```

Playwright starts the backend and Vite itself if they aren't already running.
If old servers are still up, it reuses them and tests run against old code.

CI ([ci.yml](.github/workflows/ci.yml)) runs the Python tests on Python 3.11
and builds the frontend. It doesn't run the frontend tests yet (#14).

## Lint

```
ruff check .      # lint
ruff format .     # format
```

CI doesn't run ruff. The current code has lint errors, and it's going to be
rewritten (#39), so they aren't worth fixing first.

## Card data

The card list is `polydros/data/cards.json`. The backend checks it when it
starts and refuses to start if anything is wrong, with a message naming each
card and field. `GET /cards` serves it.

The old simulation still reads its own copy, `simulation/data/cards.json`.
Both were first generated from `polydros_master_set_v1.xlsx`, but they've
drifted apart since. Don't run the export script until #33 is fixed; see
[scripts/README.md](scripts/README.md).

**Card pictures** aren't in git; they're about 340 MB. Put them in an `images/`
folder at the repo root, one PNG per card named by its ID (`images/C001.png`
and so on). Ask the project owner for the folder. The backend makes small
thumbnails in `images/thumbs/` the first time each is asked for. To keep the
pictures somewhere else, set the `POLYDROS_IMAGES` environment variable to
that folder.
