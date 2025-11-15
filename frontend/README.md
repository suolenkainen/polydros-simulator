# Polydros Frontend (Scaffold)

This is a minimal Vite + React + TypeScript scaffold intended to call the
backend `/run` endpoint and render a small time-series chart of the simulation
summary.

Dev setup (Windows cmd.exe):

1. From repository root, change into the frontend folder:

```cmd
cd frontend
```

2. Install node dependencies (requires Node.js >= 18 recommended):

```cmd
npm install
```

3. Run the dev server:

```cmd
npm run dev
```

4. Open the URL printed by Vite (usually http://localhost:5173) and use the
form to run a small simulation. The frontend expects the backend API at
`http://127.0.0.1:8000/run`.

Notes:
- This scaffold is intentionally small. It's safe to replace Chart.js with
  another charting library later.
- CORS: If your backend is on a different origin, enable CORS in the FastAPI
  backend (not added in the scaffold backend yet).
