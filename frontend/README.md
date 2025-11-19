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

## Testing with Playwright

E2E tests verify frontend functionality and integration with the backend simulation engine.

### Running Tests

From the frontend directory:

```cmd
# Run all tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e-combat.spec.ts

# Run tests in UI mode (interactive)
npx playwright test --ui
```

### Test Files

#### `e2e.spec.ts` - Basic Simulation & UI Structure
- Verifies simulation execution and basic UI structure
- Tests world stats display
- Validates agent listing
- Confirms tick progression

#### `e2e-tick.spec.ts` - Tick Progression & Reset
- Validates tick counter starts at 0
- Tests tick advancement through multiple runs
- Verifies reset button functionality
- Confirms negative/zero tick validation

#### `e2e-combat.spec.ts` - Combat System & Agent Behavior ✨ NEW
Comprehensive tests for the combat and economy system:

**Agent Events & Purchases:**
- Tick 0 shows no events on agents
- Agents perform purchases on tick 1+
- Agent 0 has purchase or combat events
- Agent 3 has purchase or combat events
- Non-collector agents may not purchase after 60 cards

**Combat System:**
- Combat events appear in event log
- Combat event records winner and loser

**Card Economy Impact:**
- Winning cards have increased attractiveness
- Losing cards have decreased attractiveness
- Card prices change after combat

### Test Conditions

The combat tests verify:

1. **Tick 0 State**: No events recorded at initialization
2. **Agent Purchasing**: Specific agents (0, 3) make purchases based on:
   - Collector trait values
   - Available Prism budget
   - Current collection size (stops after 60 cards if low trait)
3. **Non-Purchasers**: Agents with low collector traits stop purchasing after threshold
4. **Combat Events**: Occur when agents with ≥40 cards trigger play chance
5. **Winner/Loser Format**: Records both agents and score differential
6. **Card Stat Evolution**:
   - Winners' cards: +1% attractiveness, +1% price
   - Losers' cards: -1% attractiveness, -1% price
