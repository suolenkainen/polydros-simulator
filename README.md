# Polydros — TCG Economy Simulator (Scaffold)

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

Notes:
- The simulation engine is in `simulation/engine.py` and supports a seeded run.
- This scaffold focuses on economy-only logic and deterministic behavior.
