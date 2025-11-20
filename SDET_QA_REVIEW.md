# SDET QA Code Review - Polydros Simulator
**Review Date:** November 20, 2025  
**Perspective:** Senior QA/SDET Engineer  
**Scope:** Functionality, maintainability, readability, robustness, security

---

## Executive Summary

✅ **Overall Status: GOOD** (with targeted improvements needed)

- **50/50 tests passing**: All pytest tests pass
- **Type safety**: mypy ✓, ruff ✓ (all 88-char compliance)
- **Code quality**: Generally clean, well-structured
- **Critical issues**: 2 (error handling, API resilience)
- **Major issues**: 5 (logging, input validation, edge cases)
- **Minor issues**: 8 (documentation, DX improvements)

**Risk Assessment**: Low for current test scenarios; Medium if deployed to production or exposed to variable input.

---

## 1. FUNCTIONALITY & CORRECTNESS

### ✅ What's Working Well

1. **Deterministic Randomness**
   - Seeded RNG in SimulationConfig is solid
   - Test `test_same_seed_produces_same_output` validates reproducibility ✓
   - All 50 tests rely on this and pass consistently

2. **Data Integrity**
   - Agent card instances tracked with unique IDs: `INST_{card_id}_{agent_id}_{tick}_{random}`
   - Price history captured per tick (PriceDataPoint objects)
   - No negative Prism balances (validated by `test_agent_prism_never_negative`) ✓

3. **Market Data Pipeline**
   - Backend → API → Frontend: data flows cleanly
   - Card metadata persists through to_dict() serialization
   - Conversion handles both card_instances and old full_collection format

### ⚠️ Critical Issues

#### 1.1: Inadequate Error Handling in Frontend API Layer

**File**: `frontend/src/api.ts`  
**Severity**: HIGH (Could crash silently)

```typescript
export async function runSimulation(...) {
  const res = await fetch('http://127.0.0.1:8000/run', { ... })
  if (!res.ok) throw new Error('API error')  // ← Generic, not helpful
  return res.json()
}
```

**Problems**:
- Generic error message doesn't indicate what went wrong
- No distinction between 500 (server crash) vs 400 (bad input)
- JSON parsing error won't be caught if response isn't JSON
- No retry logic for transient failures
- No timeout handling (can hang indefinitely)

**Recommendation**:
```typescript
export async function runSimulation(body: { seed: number; agents: number; ticks: number; }, timeoutMs = 30000) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  
  try {
    const res = await fetch('http://127.0.0.1:8000/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    
    if (!res.ok) {
      const errorBody = await res.text()
      throw new Error(`API error ${res.status}: ${errorBody.slice(0, 100)}`)
    }
    
    const data = await res.json()
    if (!data.timeseries || !data.agents) {
      throw new Error('Invalid API response: missing timeseries or agents')
    }
    return data
  } finally {
    clearTimeout(timeout)
  }
}
```

#### 1.2: No Input Validation on Backend

**File**: `backend/main.py`  
**Severity**: MEDIUM

```python
@app.post("/run")
def run(req: RunRequest) -> dict:
    cfg = SimulationConfig(
        seed=req.seed,
        initial_agents=req.agents,
        ticks=req.ticks,
    )
    result = run_simulation(cfg)
```

**Problems**:
- RunRequest should validate ranges (agents > 0, ticks >= 0, seed is int)
- No limits on max ticks (could consume all memory)
- No timeout on API execution (long-running sims could hang)

**Recommendation**:
```python
from pydantic import BaseModel, Field

class RunRequest(BaseModel):
    seed: int = Field(default=42, description="Random seed")
    agents: int = Field(ge=1, le=100, description="Agent count 1-100")
    ticks: int = Field(ge=0, le=5000, description="Ticks 0-5000")

@app.post("/run", response_model=dict)
def run(req: RunRequest) -> dict:
    # Pydantic now validates automatically
    ...
```

#### 1.3: Silent Failures in Frontend Card Conversion

**File**: `frontend/src/components/AgentInventory.tsx` line 68-90  
**Severity**: MEDIUM

```typescript
const cards = agent.card_instances.map((instance: any) => ({
  card_id: instance.card_id,
  name: instance.card_name || instance.name || 'Unknown Card',  // ← Silent fallback
  color: instance.card_color || '',  // ← Empty string if missing
  rarity: instance.card_rarity || '',  // ← Empty string if missing
  ...
}))
```

**Problems**:
- Uses `any` type (loses type safety)
- Silent fallbacks mask data quality issues
- No logging when fields are missing
- Empty rarity/color displays poorly in UI

**Recommendation**:
```typescript
interface CardInstance {
  card_id: string
  card_name: string
  card_color: string
  card_rarity: string
  // ... other required fields
}

const cards = agent.card_instances.map((instance: CardInstance) => {
  if (!instance.card_name) {
    console.warn(`[AgentInventory] Missing card_name for ${instance.card_id}`)
  }
  return {
    card_id: instance.card_id,
    name: instance.card_name || `Card-${instance.card_id}`,
    color: instance.card_color || 'Unknown',
    rarity: instance.card_rarity || 'Unknown',
    ...
  }
})
```

### 🟡 Major Issues

#### 1.4: Unhandled Promise Rejections in Simulation Flow

**File**: `frontend/src/components/SimulationRunner.tsx` line 195-242  
**Severity**: MEDIUM

```typescript
async function onRun(e: React.FormEvent) {
  // ...
  try {
    const res = await runSimulation({ seed, agents, ticks: nextTick })
    // No catch for runSimulation throwing
  } catch (err) {
    console.error(err)
    alert('Failed to run simulation; is backend running at http://127.0.0.1:8000?')
    // ← Generic message, user has to guess
  }
}
```

**Problems**:
- Error message generic, doesn't help user debug
- Backend error details lost
- Network errors vs server errors not distinguished
- User sees generic alert

**Recommendation**:
```typescript
catch (err) {
  const message = err instanceof Error ? err.message : 'Unknown error'
  if (message.includes('fetch')) {
    console.error('Network error:', err)
    alert('Failed to connect to backend. Is it running on http://127.0.0.1:8000?')
  } else if (message.includes('Invalid API response')) {
    console.error('Backend response malformed:', err)
    alert('Backend returned unexpected data format. Is it the right version?')
  } else {
    console.error('Simulation failed:', err)
    alert(`Simulation error: ${message}`)
  }
}
```

---

## 2. MAINTAINABILITY & CODE QUALITY

### ✅ Strengths

- Type safety: mypy ✓ (20 files), ruff ✓ (all 88-char lines)
- Test structure: 50 tests organized by concern (traits, combat, economy, etc.)
- Deterministic RNG: Easy to seed and reproduce
- Modular design: simulation/types.py, engine.py, world.py separated

### ⚠️ Issues

#### 2.1: Missing Documentation on Complex Logic

**File**: `simulation/engine.py` line 21-30 (`generate_card_instance_id`)  
**Severity**: MEDIUM

```python
def generate_card_instance_id(
    card_id: str, agent_id: int, tick: int, rng: random.Random
) -> str:
    """Generate a unique card instance ID.

    Format: INST_{card_id}_{agent_id}_{tick}_{random}

    This ensures uniqueness while maintaining determinism with seeded RNG.
    """
    random_suffix = rng.randint(0, 999999)
    return f"INST_{card_id}_{agent_id}_{tick}_{random_suffix}"
```

**Problems**:
- Docstring is OK, but doesn't explain WHY this format
- Doesn't document the collision probability
- No reference to where this ID is used
- No test for collision uniqueness

**Recommendation**:
```python
def generate_card_instance_id(
    card_id: str, agent_id: int, tick: int, rng: random.Random
) -> str:
    """Generate a globally unique card instance ID.

    Format: INST_{card_id}_{agent_id}_{tick}_{random_suffix}

    This format ensures:
    1. Same card_id + agent_id + tick = different instances (via random_suffix)
    2. Deterministic with seeded RNG (collision prob < 1e-6 with 1M cards)
    3. Human-readable for debugging

    Args:
        card_id: Master card ID (e.g., 'C001')
        agent_id: Owner agent ID (1-N)
        tick: Acquisition tick number
        rng: Seeded random.Random instance

    Returns:
        Unique instance ID: INST_C001_1_42_654216

    Note: Used in Agent.card_instances dict to track individual card metrics.
    """
```

#### 2.2: Insufficient Logging

**File**: `simulation/engine.py` + `backend/main.py`  
**Severity**: MEDIUM

**Problems**:
- No logging of simulation progress (user can't tell if it's stuck)
- No warnings for edge cases (e.g., agent runs out of Prism)
- No metrics logged (e.g., total cards created, average quality)
- Backend stores LAST_RUN globally with no versioning

**Recommendation** (Python):
```python
import logging

logger = logging.getLogger(__name__)

def run_simulation(config: SimulationConfig) -> Dict:
    logger.info(f"Starting simulation: seed={config.seed}, agents={config.initial_agents}, ticks={config.ticks}")
    
    # ... main loop
    for t in range(config.ticks):
        if t % 10 == 0:
            logger.debug(f"Tick {t}: {len(world.agents)} agents, {world.total_cards} cards")
    
    logger.info(f"Simulation complete: {len(result['agents'])} agents, {total_instances} instances")
    return result
```

#### 2.3: Type Safety Issues with `any`

**Locations**:
- `frontend/src/components/AgentInventory.tsx` line 68: `(instance: any) =>`
- `frontend/src/components/SimulationRunner.tsx` line multiple
- `frontend/src/App.tsx` line 24: `agents: any[]`

**Severity**: MEDIUM (TypeScript can't catch bugs)

**Recommendation**: Define strict interfaces:
```typescript
interface PriceDataPoint {
  tick: number
  price: number
  quality_score: number
  desirability: number
}

interface AgentCardInstance {
  card_instance_id: string
  card_id: string
  card_name: string
  flavor_text: string
  card_color: string
  card_rarity: string
  agent_id: number
  acquisition_tick: number
  current_price: number
  quality_score: number
  desirability: number
  condition: string
  win_count: number
  loss_count: number
  price_history: PriceDataPoint[]
}

interface Agent {
  id: number
  prism: number
  name: string
  card_instances: AgentCardInstance[]
  traits: any  // TODO: define traits interface
}

const [agents, setAgents] = useState<Agent[]>([])  // ✓ Type-safe
```

#### 2.4: Missing Dependency Documentation

**File**: `requirements.txt`  
**Severity**: LOW-MEDIUM

```txt
fastapi>=0.95.0
uvicorn[standard]>=0.21.0
numpy>=1.25
pandas>=2.0
pytest>=7.0
httpx>=0.24
```

**Problems**:
- No comments explaining why each dep is needed
- numpy/pandas: are these actively used? (check with `grep`)
- No pinned versions for reproducibility
- No dev vs prod separation

**Recommendation**:
```txt
# Core simulation & API
fastapi>=0.95.0        # REST API framework
uvicorn[standard]>=0.21.0  # ASGI server

# Data processing (optional, check if used)
# numpy>=1.25
# pandas>=2.0

# Testing & QA
pytest>=7.0            # Unit test framework
pytest-cov>=4.0        # Code coverage
httpx>=0.24            # HTTP client for tests
ruff>=0.12.0           # Linter
mypy>=1.8              # Type checker
```

---

## 3. READABILITY & ONBOARDING

### ✅ Strengths

- Clear file structure: `simulation/`, `backend/`, `frontend/` separation
- Test naming is descriptive: `test_agent_prism_never_negative` ✓
- Docstrings present on key functions

### ⚠️ Issues

#### 3.1: Unclear API Response Format

**Potential new developer problem**: "What does /run return?"

**Current state**: Type checking in api.ts doesn't exist, so TypeScript can't help

**Recommendation**: Create `frontend/src/types/api.ts`:
```typescript
/**
 * Full simulation response from /run endpoint.
 * 
 * Use this to understand the data structure:
 * const result: SimulationResponse = await runSimulation(...)
 */
export interface SimulationResponse {
  config: {
    seed: number
    initial_agents: number
    ticks: number
  }
  timeseries: TimeseriesPoint[]
  final: WorldSummary
  agents: Agent[]
  events: SimulationEvent[]
}

export interface TimeseriesPoint {
  tick: number
  agent_count: number
  total_cards: number
  total_unopened_boosters: number
  events: SimulationEvent[]
}

export interface Agent {
  id: number
  prism: number
  name: string
  card_instances: AgentCardInstance[]
  // ... other fields
}

// ... etc
```

Then use in components:
```typescript
import type { SimulationResponse } from '../types/api'

const result: SimulationResponse = await runSimulation(...)
```

#### 3.2: No Getting Started Guide for Backend Changes

**Problem**: New contributor can't easily understand:
- How to add a new market metric?
- Where do card_instances get created?
- How does price_history get updated?

**Recommendation**: Create `docs/ARCHITECTURE.md`:
```markdown
# Architecture Guide

## Card Instance Lifecycle

1. **Creation** (engine.py, line 324-345):
   - When booster opened → generate_card_instance_id()
   - Create AgentCardInstance with acquisition_tick, initial price
   - Add to agent.card_instances dict

2. **Price Tracking** (world.py, record_price_points):
   - Each tick end: loop agent.card_instances
   - Create PriceDataPoint with current market price
   - Append to instance.price_history

3. **API Response** (engine.py, line 547):
   - Convert card_instances to to_dict()
   - Includes full price_history array
   - Sent to frontend via /run endpoint

## How to Add a New Card Metric

1. Add field to AgentCardInstance (types.py)
2. Initialize in engine.py when creating instance
3. Update in tick logic (world.py or engine.py)
4. Add to to_dict() for API response
5. Add TypeScript interface in frontend (types/api.ts)
6. Render in AgentInventory or CardDetail component
7. Add test case in simulation/tests/
```

---

## 4. ROBUSTNESS & EDGE CASES

### ⚠️ Critical Issues

#### 4.1: No Protection Against Long-Running Simulations

**File**: `backend/main.py`  
**Severity**: MEDIUM (Could cause memory leak/timeout)

**Problem**:
- User sends ticks=10000 → backend hangs for minutes
- Frontend times out but backend still running
- LAST_RUN keeps growing (memory leak)

**Recommendation**:
```python
import asyncio
from fastapi import HTTPException

MAX_TICKS = 5000  # Configurable limit
SIMULATION_TIMEOUT = 60  # seconds

@app.post("/run")
def run(req: RunRequest) -> dict:
    if req.ticks > MAX_TICKS:
        raise HTTPException(
            status_code=400,
            detail=f"ticks must be <= {MAX_TICKS}, got {req.ticks}"
        )
    
    try:
        result = asyncio.wait_for(
            run_simulation_async(cfg),
            timeout=SIMULATION_TIMEOUT
        )
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=504,
            detail=f"Simulation exceeded {SIMULATION_TIMEOUT}s timeout"
        )
    
    return result
```

#### 4.2: Global State Without Versioning

**File**: `backend/main.py` line 16  
**Severity**: MEDIUM

```python
LAST_RUN = None  # ← Global mutable state

@app.post("/run")
def run(req: RunRequest) -> dict:
    # ...
    global LAST_RUN
    LAST_RUN = result  # ← What if GET /agents reads while POST /run is writing?
    return result
```

**Problems**:
- Race condition: GET /agents while POST /run updating
- No versioning: if two clients run simulations, second overwrites first
- No cleanup: LAST_RUN grows unbounded

**Recommendation**:
```python
from datetime import datetime
from threading import Lock

_last_run_lock = Lock()
_run_history: dict[int, dict] = {}  # version -> result
_run_counter = 0

@app.post("/run")
def run(req: RunRequest) -> dict:
    global _run_counter
    result = run_simulation(cfg)
    
    with _last_run_lock:
        _run_counter += 1
        version = _run_counter
        _run_history[version] = result
        # Keep only last 10 runs
        if len(_run_history) > 10:
            oldest = min(_run_history.keys())
            del _run_history[oldest]
    
    return {
        'version': version,
        'data': result
    }

@app.get("/agents")
def list_agents(version: int | None = None) -> dict:
    with _last_run_lock:
        if version is None:
            version = _run_counter
        if version not in _run_history:
            return {"error": f"Run version {version} not found"}
        agents = _run_history[version].get("agents", [])
    return {"agents": agents}
```

### 🟡 Major Issues

#### 4.3: Missing Validation on Card Data

**File**: `simulation/world.py` + `simulation/engine.py`  
**Severity**: MEDIUM

**Problem**: No validation when reading cards.json:
- What if a card has negative power?
- What if rarity is misspelled?
- What if card_id is duplicated?

**Recommendation**:
```python
from pydantic import BaseModel, Field

class CardDefinition(BaseModel):
    id: str = Field(pattern=r"^C\d{3}$")  # C000, C001, etc.
    name: str = Field(min_length=1, max_length=100)
    flavor_text: str = Field(default="")
    color: str = Field(pattern=r"^(Sapphire|Onyx|Bronze|Jade|Ember)$")
    rarity: str = Field(pattern=r"^(Common|Uncommon|Rare|Mythic|Player)$")
    power: int = Field(ge=0, le=99)
    health: int = Field(ge=0, le=99)
    cost: int = Field(ge=0, le=10)
    base_price: float = Field(ge=0.01)

def load_cards_from_json(path: str) -> Dict[str, CardDefinition]:
    with open(path) as f:
        raw_data = json.load(f)
    
    cards = {}
    for card_data in raw_data:
        try:
            card = CardDefinition(**card_data)
            if card.id in cards:
                raise ValueError(f"Duplicate card ID: {card.id}")
            cards[card.id] = card
        except ValueError as e:
            logger.error(f"Invalid card data: {e}")
            raise
    
    logger.info(f"Loaded {len(cards)} cards from {path}")
    return cards
```

#### 4.4: No Bounds Checking on Agent Prism

**File**: `simulation/engine.py` (buy logic)  
**Severity**: MEDIUM

**Test exists** (`test_agent_cannot_buy_without_sufficient_prism`), but could fail if:
- Card price calculation returns NaN
- Floating-point precision causes underflow

**Recommendation**: Add defensive checks:
```python
def try_buy_booster(agent: Agent, card_pool: CardPool, rng: random.Random) -> bool:
    booster_price = calculate_booster_price(card_pool)
    
    # Defensive checks
    if math.isnan(booster_price):
        logger.error(f"NaN booster price! pool={card_pool}")
        return False
    
    if booster_price < 0:
        logger.error(f"Negative booster price: {booster_price}")
        return False
    
    # Require small buffer to avoid floating-point edge cases
    if agent.prism < booster_price + 0.01:
        return False
    
    agent.prism -= booster_price
    assert agent.prism >= 0, "Prism went negative!"
    return True
```

#### 4.5: No Max Bounds on Simulation Output

**Severity**: LOW-MEDIUM

**Problem**: Result of run_simulation() has no size bounds:
- Result could be huge JSON (1GB+)
- Memory exhaustion on frontend when loading
- Network timeout

**Recommendation**:
```python
import sys

MAX_RESULT_SIZE = 50 * 1024 * 1024  # 50MB limit

@app.post("/run")
def run(req: RunRequest) -> dict:
    result = run_simulation(cfg)
    result_size = sys.getsizeof(json.dumps(result))
    
    if result_size > MAX_RESULT_SIZE:
        logger.warn(f"Result too large: {result_size / 1e6:.1f}MB, truncating")
        # Optionally paginate or compress
        raise HTTPException(
            status_code=413,
            detail=f"Simulation result too large: {result_size / 1e6:.1f}MB"
        )
    
    return result
```

---

## 5. SECURITY ISSUES

### 🔴 Critical

#### 5.1: Hardcoded API Endpoint in Frontend

**File**: `frontend/src/api.ts` and `frontend/src/components/*.tsx`  
**Severity**: MEDIUM (not ideal for production)

```typescript
const res = await fetch('http://127.0.0.1:8000/run', ...)  // ← Hardcoded
```

**Recommendation**:
```typescript
// frontend/src/config.ts
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

// frontend/src/api.ts
export async function runSimulation(...) {
  const res = await fetch(`${API_BASE_URL}/run`, ...)
}
```

Then in `.env.local`:
```
VITE_API_URL=http://localhost:8000  # dev
VITE_API_URL=https://api.polydros.com  # prod
```

#### 5.2: No Input Sanitization on Card Names

**File**: Frontend CardDetail, AgentInventory  
**Severity**: LOW (React auto-escapes, but still risky)

**Problem**: If card name contains HTML, could be XSS risk (unlikely since from backend, but defense-in-depth)

**Recommendation**: Use React best practices (already doing this correctly):
```typescript
// ✓ Safe: React auto-escapes
<td className="card-name">{card.name}</td>

// ✗ Unsafe if card.name had HTML
<td dangerouslySetInnerHTML={{ __html: card.name }} />
```

Status: ✓ Already correct in codebase

#### 5.3: No CORS Configuration

**File**: `backend/main.py` line 23-33  
**Severity**: MEDIUM (will fail in prod)

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ← Too permissive
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Problem**:
- `allow_origins=["*"]` is development-only
- When deployed, needs specific origins

**Recommendation**:
```python
import os

ALLOWED_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,  # Set True only if using cookies
    allow_methods=["GET", "POST"],  # Explicitly list methods
    allow_headers=["Content-Type"],  # Explicitly list headers
)
```

---

## 6. TESTING & TEST COVERAGE

### ✅ Excellent Coverage

- 50 tests covering: economy, traits, combat, quality, determinism
- All passing ✓
- Good coverage of edge cases (prism negative, collector limits, etc.)

### 🟡 Gaps

#### 6.1: Missing Frontend Unit Tests

**Current state**: Only E2E tests with Playwright  
**Risk**: Component bugs not caught until E2E

**Recommendation**: Add Vitest unit tests:
```typescript
// frontend/src/components/AgentInventory.test.tsx
import { render, screen } from '@testing-library/react'
import AgentInventory from './AgentInventory'

describe('AgentInventory', () => {
  it('displays loading state', async () => {
    render(<AgentInventory agentId={1} agents={[]} />)
    expect(screen.getByText('Loading inventory...')).toBeInTheDocument()
  })

  it('converts card_instances to Card format', () => {
    const mockAgents = [{
      id: 1,
      card_instances: [{
        card_name: 'Test Card',
        card_color: 'Sapphire',
        card_rarity: 'Rare',
        // ...
      }]
    }]
    render(<AgentInventory agentId={1} agents={mockAgents} />)
    expect(screen.getByText('Test Card')).toBeInTheDocument()
  })

  it('handles missing metadata gracefully', () => {
    const mockAgents = [{
      id: 1,
      card_instances: [{
        card_name: '',  // Missing
        card_color: '',
        // ...
      }]
    }]
    render(<AgentInventory agentId={1} agents={mockAgents} />)
    // Should not crash
    expect(screen.getByText('Unknown Card')).toBeInTheDocument()
  })
})
```

#### 6.2: Missing Backend Performance Tests

**Recommendation**: Add pytest benchmarks:
```python
def test_simulation_performance_1000_ticks(benchmark):
    cfg = SimulationConfig(seed=42, initial_agents=10, ticks=1000)
    result = benchmark(run_simulation, cfg)
    
    # Should complete in < 5 seconds
    assert len(result['timeseries']) == 1001

def test_memory_usage_10k_cards(benchmark):
    cfg = SimulationConfig(seed=42, initial_agents=50, ticks=200)
    # Should use < 100MB
    import tracemalloc
    tracemalloc.start()
    result = run_simulation(cfg)
    current, peak = tracemalloc.get_traced_memory()
    assert peak / 1e6 < 100, f"Memory usage: {peak / 1e6}MB"
```

#### 6.3: Missing API Integration Tests

**Recommendation**:
```python
def test_api_returns_valid_schema():
    from backend.main import app
    from fastapi.testclient import TestClient
    
    client = TestClient(app)
    response = client.post("/run", json={
        "seed": 42,
        "agents": 2,
        "ticks": 10
    })
    
    assert response.status_code == 200
    data = response.json()
    
    # Validate schema
    assert "timeseries" in data
    assert "agents" in data
    assert len(data["agents"]) == 2
    assert all("card_instances" in a for a in data["agents"])

def test_api_rejects_invalid_input():
    client = TestClient(app)
    
    # Negative ticks
    response = client.post("/run", json={
        "seed": 42,
        "agents": 2,
        "ticks": -1
    })
    assert response.status_code == 422  # Validation error
```

---

## 7. DEPLOYMENT & OPERATIONAL READINESS

### ⚠️ Issues

#### 7.1: No Environment Configuration

**Recommendation**: Create `.env.example`:
```env
# backend
CORS_ORIGINS=http://localhost:5173,https://polydros.com
LOG_LEVEL=INFO
MAX_SIMULATION_TICKS=5000
SIMULATION_TIMEOUT_SECONDS=60

# frontend
VITE_API_URL=http://localhost:8000
```

#### 7.2: No Monitoring/Metrics

**Recommendation**: Add Prometheus metrics:
```python
from prometheus_client import Counter, Histogram

simulation_runs = Counter(
    'polydros_simulation_runs_total',
    'Total simulation runs',
    ['status']
)
simulation_duration = Histogram(
    'polydros_simulation_duration_seconds',
    'Simulation execution time'
)

@app.post("/run")
def run(req: RunRequest) -> dict:
    with simulation_duration.time():
        try:
            result = run_simulation(cfg)
            simulation_runs.labels(status='success').inc()
            return result
        except Exception as e:
            simulation_runs.labels(status='error').inc()
            raise
```

---

## 8. SUMMARY TABLE

| Category | Status | Priority | Effort |
|----------|--------|----------|--------|
| **Functionality** | 🟡 Good, needs edge cases | HIGH | 3 days |
| **Error Handling** | 🔴 Weak | CRITICAL | 2 days |
| **Type Safety** | 🟡 Partial (mypy ✓, TS `any` ✗) | MEDIUM | 1 day |
| **Testing** | ✅ Backend 50/50, Frontend E2E only | MEDIUM | 3 days |
| **Documentation** | 🟡 Exists, needs details | MEDIUM | 1 day |
| **Security** | 🟡 Dev-only, risky for prod | MEDIUM | 2 days |
| **Monitoring** | ❌ None | LOW | 1 day |
| **Deployment** | ❌ No env config | LOW | 0.5 days |

**Total Effort to Production Ready**: ~13 days

---

## 9. TOP 3 RECOMMENDATIONS (Do These First)

1. **ERROR HANDLING** (2 days)
   - Add proper error messages in API layer
   - Distinguish network vs server vs validation errors
   - Add timeout handling

2. **INPUT VALIDATION** (1 day)
   - Validate RunRequest with Pydantic ranges
   - Add max_ticks limit (5000)
   - Add simulation timeout (60s)

3. **TYPE SAFETY** (1 day)
   - Remove `any` types in frontend
   - Create TypeScript interfaces for API responses
   - Use strict tsconfig

**After these 3, system is ready for basic testing. After all 9 categories, ready for production.**

---

## 10. QUICK WIN CHECKLIST

- [ ] Add API timeout handling (30 min)
- [ ] Add max_ticks validation in backend (30 min)
- [ ] Create TypeScript interfaces for API response (1 hr)
- [ ] Remove `any` types from frontend state (1 hr)
- [ ] Add logging to engine.py (1 hr)
- [ ] Document generate_card_instance_id function (30 min)
- [ ] Add .env.example (15 min)
- [ ] Add frontend unit test scaffold (2 hrs)

**Total: ~7 hours → Significantly more robust**

---

## Conclusion

**"Will it work?"** ✅ Yes, all tests pass.

**"Will it break in production?"** ⚠️ Possibly:
- Unhandled edge cases (long-running sims, network flakes)
- Poor error messages (users can't debug)
- No monitoring (can't see what's wrong)

**Recommendation**: Complete error handling, validation, and type safety before deploying beyond localhost.
