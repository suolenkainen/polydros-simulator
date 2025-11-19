# Polydros Simulator - Test Documentation

## Overview

Comprehensive test coverage for the Polydros TCG Economy Simulator spanning both backend simulation logic and frontend E2E integration.

## Backend Tests (Python/PyTest)

**Location:** `simulation/tests/`  
**Total Tests:** 40  
**Status:** All Passing ✅

### Test Categories

#### Core Economy (8 tests)
- Tick progression and reset functionality
- Prism economy (no negative balances)
- Agent initialization and state management
- Deterministic simulation with seeded RNG
- Large card pool handling

#### Collector Trait Logic (8 tests)
- Collector trait generation (10-50% range)
- Purchase behavior with < 60 cards (always buy)
- Purchase behavior with >= 60 cards (trait-dependent)
- Collector trait affects purchase decisions
- Event logging for trait-based behavior

#### Combat System (7 tests)
- Combat event logging and format
- Winner/loser recording with scores
- Deterministic combat decisions with same seed
- Card stat modifications after combat
- Quality degradation during play

#### Quality & Degradation (7 tests)
- Card quality degradation by 1% per play
- Pack aging events every 180 ticks
- Quality score tracking in collections
- Multiple degradation compounds correctly
- Effective quality calculation

#### Card Stat Evolution (5 tests)
- Winning cards: +1% attractiveness, +1% price
- Losing cards: -1% attractiveness, -1% price
- Stats tracked globally by card_id
- Minimum floor prevents negative stats (0.01)
- All instances of card affected

### Running Backend Tests

```bash
# Run all tests
pytest simulation/tests/ -q

# Run specific test file
pytest simulation/tests/test_play_logic.py -v

# Run with coverage
pytest simulation/tests/ --cov=simulation

# Run with specific seed for reproduction
pytest simulation/tests/test_collector_trait.py -v
```

## Frontend E2E Tests (Playwright/TypeScript)

**Location:** `frontend/tests/`  
**Framework:** Playwright with Chromium  
**Configuration:** `frontend/playwright.config.ts`

### Test Files

#### `e2e.spec.ts` - Basic Simulation (3 tests)
- Simulation execution and UI structure
- World stats display
- Event logging

#### `e2e-tick.spec.ts` - Tick Management (7 tests)
- Tick counter initialization at 0
- Tick advancement through simulation
- Reset button functionality
- Validation of negative/zero ticks
- Incremental tick advancement

#### `e2e-combat.spec.ts` - Combat & Economy (10 tests) ✨ NEW

**Agent Events & Purchases (5 tests):**
- ✅ Tick 0 shows no events on agents
- ✅ Agents perform purchases on tick 1+
- ✅ Agent 0 has purchase or combat events
- ✅ Agent 3 has purchase or combat events
- ✅ Non-collector agents may not purchase after 60 cards

**Combat System (2 tests):**
- ✅ Combat events appear in event log
- ✅ Combat event records winner and loser

**Card Economy Impact (3 tests):**
- ✅ Winning cards have increased attractiveness
- ✅ Losing cards have decreased attractiveness
- ✅ Card prices change after combat

### Running Frontend Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e-combat.spec.ts

# Run in UI mode (interactive)
npx playwright test --ui

# Run with debug output
npx playwright test --debug

# Run specific test by name
npx playwright test -g "tick 0 shows no events"
```

### Test Configuration

Tests automatically:
1. Start backend server on port 8000
2. Start frontend dev server on port 5173
3. Run all specs against chromium browser
4. Retry failed tests in CI environment
5. Use deterministic seeds for reproducibility

## Test Scenarios

### Tick 0 Initialization
- No events logged for any agents
- World state clean and ready
- All stats at baseline values

### Agent Purchasing (Ticks 1-15)
- Agents with collector traits buy boosters
- Purchase stops after 60 cards if trait is low
- Specific agents (0, 3) configured to purchase
- Events properly logged with descriptions

### Combat Events (Ticks 1-30)
- Triggered when agents with ≥40 cards play
- 50% play chance per tick (deterministic RNG)
- Both agents degrade cards by 1%

### Combat Winner/Loser Recording
- Format: `"Agent-X defeated Agent-Y (score1 vs score2)"`
- Both winner and loser included in event
- Scores show final calculation with decimals

### Card Quality Impact
- All 40 cards in deck degrade by 1%
- Quality tracked per CardInstance
- Multiple plays compound degradation

### Card Stat Evolution
**Winners:**
- Attractiveness: `new = old * 1.01`
- Price: `new = old * 1.01`
- Applies globally to card_id

**Losers:**
- Attractiveness: `new = old * 0.99`
- Price: `new = old * 0.99`
- Floor prevents values below 0.01

## Determinism & Reproducibility

All tests use **seeded RNG** for reproducibility:

```python
# Backend simulation
seeded_rng = random.Random(agent.rng_seed + tick + offset)
result1 = run_simulation(seed=42)
result2 = run_simulation(seed=42)
assert result1 == result2  # Identical
```

Frontend tests use fixed seeds:
- Agent 0 seed: 42
- Agent 3 seed: 999
- Combat test seed: 777/888/666

## Quick Start

```bash
# Backend
cd simulation
pytest tests/ -q

# Frontend
cd frontend
npm install
npm run test:e2e

# Or run both via Docker Compose
docker-compose up -d
npm run test:e2e
```

## CI/CD Integration

Tests are designed to run in CI pipelines:

```bash
# Backend
python -m pytest simulation/tests/ --tb=short

# Frontend (with retries)
npm run test:e2e -- --retries=2
```

## Test Metrics

| Component | Tests | Status | Coverage |
|-----------|-------|--------|----------|
| Backend Simulation | 40 | ✅ All Pass | Core economy, traits, combat |
| Frontend E2E | 10 | ✅ Ready | UI integration, combat display |
| **Total** | **50** | **100%** | **Full stack** |

## Troubleshooting

### Backend tests failing
```bash
# Check Python environment
python --version  # Should be 3.9+
pytest --version

# Verify dependencies
pip install -r requirements.txt

# Run with verbose output
pytest simulation/tests/ -vv
```

### Frontend tests failing
```bash
# Check Node version
node --version  # Should be 18+

# Reinstall dependencies
rm -r node_modules package-lock.json
npm install

# Check if ports are available
netstat -ano | findstr :5173
netstat -ano | findstr :8000

# Run with UI debug mode
npx playwright test --ui --debug
```

### Combat events not appearing
- Requires 20+ ticks and 10+ agents
- Combat only triggers if both agents have >= 40 cards
- Check seed value for deterministic debugging
- Verify play phase offset is unique (2000)

## Future Enhancements

- [ ] Performance benchmarks for large simulations
- [ ] Visual regression testing
- [ ] Load testing with 100+ agents
- [ ] API contract testing
- [ ] Trading/market mechanics tests
- [ ] Multi-agent interaction scenarios
