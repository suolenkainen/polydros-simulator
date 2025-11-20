# Actionable Fixes - Priority Queue

**Status**: Ready to implement  
**Quick Wins**: 7-8 hours total  
**Production Readiness**: ~13 days including all tests  

---

## TIER 1: BLOCKING ISSUES (Do First)

### 1.1: Frontend API Error Handling ⚠️ CRITICAL
**File**: `frontend/src/api.ts`  
**Time**: 45 minutes  
**Impact**: HIGH - Users get cryptic errors currently

```diff
+ import type { SimulationResponse } from './types/api'
+ 
+ const API_TIMEOUT_MS = 30000
  
  export async function runSimulation(body: {
    seed: number
    agents: number
    ticks: number
- }): Promise<any> {
+}): Promise<SimulationResponse> {
+  const controller = new AbortController()
+  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS)
+  
    try {
      const res = await fetch('http://127.0.0.1:8000/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
+       signal: controller.signal,
      })
      
      if (!res.ok) {
+       const errorBody = await res.text()
-       throw new Error('API error')
+       throw new Error(`API error ${res.status}: ${errorBody.slice(0, 100)}`)
      }
      
+     const data = await res.json()
+     if (!data.timeseries || !data.agents) {
+       throw new Error('Invalid API response: missing timeseries or agents')
+     }
+     return data
-     return res.json()
    } finally {
+     clearTimeout(timeout)
    }
  }
```

### 1.2: Backend Input Validation ⚠️ CRITICAL
**File**: `backend/main.py`  
**Time**: 30 minutes  
**Impact**: HIGH - Prevents DOS-like behavior (ticks=999999)

```diff
+ from pydantic import BaseModel, Field
  
  class RunRequest(BaseModel):
-     seed: int
-     agents: int
-     ticks: int
+     seed: int = Field(default=42, description="Random seed")
+     agents: int = Field(ge=1, le=100, description="1-100 agents")
+     ticks: int = Field(ge=0, le=5000, description="0-5000 ticks")

  @app.post("/run")
  def run(req: RunRequest) -> dict:
+     # Pydantic now validates automatically
      cfg = SimulationConfig(
          seed=req.seed,
          initial_agents=req.agents,
          ticks=req.ticks,
      )
      result = run_simulation(cfg)
      return result
```

### 1.3: TypeScript Interfaces for API Response 🔧 EASY
**File**: New `frontend/src/types/api.ts`  
**Time**: 1 hour  
**Impact**: MEDIUM - Enables type safety in components

Create new file with proper types and use in components.

---

## TIER 2: HIGH PRIORITY (Next Week)

### 2.1: Remove `any` Types from Frontend
**Files**: 
- `frontend/src/components/AgentInventory.tsx` line 68
- `frontend/src/App.tsx` line 24
- `frontend/src/components/SimulationRunner.tsx` line various

**Time**: 1.5 hours  
**Impact**: MEDIUM - Catch bugs before runtime

Use TypeScript strict mode + interfaces from api.ts

### 2.2: Add Logging to Backend
**File**: `simulation/engine.py`  
**Time**: 1 hour  
**Impact**: MEDIUM - Users can debug

```python
import logging
logger = logging.getLogger(__name__)

def run_simulation(config: SimulationConfig) -> dict:
    logger.info(f"Starting: seed={config.seed}, agents={config.initial_agents}, ticks={config.ticks}")
    for t in range(config.ticks):
        if t % 100 == 0:
            logger.debug(f"Tick {t}: {len(world.agents)} agents")
    logger.info(f"Complete: {len(result['agents'])} agents")
```

### 2.3: Improve Error Messages in Frontend
**File**: `frontend/src/components/SimulationRunner.tsx`  
**Time**: 30 minutes  
**Impact**: MEDIUM - Users can actually debug

```typescript
catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    
    if (message.includes('fetch') || message.includes('AbortError')) {
        alert('Network error: Backend not responding. Is it running?')
    } else if (message.includes('Invalid API response')) {
        alert('Backend version mismatch. Check server logs.')
    } else if (message.includes('Invalid input')) {
        alert('Invalid parameters. Check console for details.')
    } else {
        alert(`Error: ${message}`)
    }
    console.error(err)
}
```

---

## TIER 3: MEDIUM PRIORITY (After Tier 2)

### 3.1: Add Frontend Unit Tests (Vitest)
**Time**: 3 hours  
**Files to create**:
- `frontend/src/components/__tests__/AgentInventory.test.tsx`
- `frontend/src/components/__tests__/CardDetail.test.tsx`

### 3.2: Add Backend Performance Tests
**Time**: 2 hours  
**File**: `simulation/tests/test_performance.py`

### 3.3: Add API Integration Tests
**Time**: 2 hours  
**File**: `backend/tests/test_api.py`

### 3.4: Documentation
**Time**: 2 hours  
**Files to create**:
- `docs/ARCHITECTURE.md` - How to add features
- `docs/SETUP.md` - Getting started
- `.env.example` - Environment config

---

## TIER 4: NICE-TO-HAVE

### 4.1: Environment Configuration
**Time**: 30 minutes  
Create `.env` support for production

### 4.2: CORS Configuration
**Time**: 30 minutes  
Make dev/prod configurable

### 4.3: Monitoring/Metrics
**Time**: 1 day  
Add Prometheus metrics

---

## ESTIMATED TIMELINE

| Phase | Tasks | Duration | Start |
|-------|-------|----------|-------|
| **1. Quick Wins** | API error handling, Input validation, TS interfaces | 2 hours | Today |
| **2. Core Robustness** | Remove `any`, Logging, Error messages | 3 hours | Tomorrow |
| **3. Testing** | Unit tests, Integration tests, Performance | 7 hours | Later this week |
| **4. Documentation** | Architecture, Setup, Architecture | 2 hours | After testing |
| **5. Deployment Ready** | Env config, CORS, Monitoring | 2 hours | Final |

**Total**: ~16 hours to production-ready

---

## QUICK TEST: Run This After Each Fix

```bash
# Backend validation
pytest simulation/ backend/ -v

# Frontend build
npm run build

# Type checking
mypy simulation/ backend/
npx tsc --noEmit

# Linting
ruff check .
```

---

## Sign-Off Checklist

- [ ] All 50 backend tests pass
- [ ] No mypy errors
- [ ] No ruff errors
- [ ] Frontend builds without errors
- [ ] API error messages are helpful
- [ ] TypeScript `any` count = 0
- [ ] Logging shows progress
- [ ] Frontend unit tests pass (20+)
- [ ] API integration tests pass (10+)
- [ ] Documentation is clear
- [ ] .env.example exists
- [ ] CORS configured for dev/prod
