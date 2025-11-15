# Polydros — TCG Economy Simulator (Scaffold)

[![codecov](https://codecov.io/gh/suolenkainen/polydros-simulator/branch/main/graph/badge.svg)](https://codecov.io/gh/suolenkainen/polydros-simulator)

This repository contains an initial scaffold for the Polydros economy
simulation. It provides a deterministic, seedable Python simulation core and
a minimal FastAPI backend to run it.

Quick dev setup (Windows, cmd.exe):

1. Create a virtual environment and activate it:

```cmd
python -m venv .venv
.\.venv\Scripts\activate
```

2. Install dependencies:

```cmd
pip install -r requirements.txt
```

3. Run the backend locally:

```cmd
uvicorn backend.main:app --reload
```

4. Run tests:

```cmd
pytest -q
```

QA, linters and coverage
------------------------

Run linters and type checks locally:

```cmd
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
ruff check .
black --check .
mypy .
```

Run tests with coverage:

```cmd
pytest --cov=simulation --cov=backend --cov-report=term
```

CI: a basic GitHub Actions workflow runs linters and tests and uploads a coverage report. See `.github/workflows/ci.yml`.

Coverage badge and report
-------------------------

This repository uploads coverage reports to Codecov from CI. The badge above reflects the `main` branch coverage; if you want to target a different branch update the badge URL.

Notes:
- The simulation engine is in `simulation/engine.py` and supports a seeded run.
- This scaffold focuses on economy-only logic and deterministic behavior.
