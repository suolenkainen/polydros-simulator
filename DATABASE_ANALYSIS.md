# Database & Data Structure Analysis

## Current Data Volume Scenarios

### Scenario 1: Small Scale (Current)
- **5 agents × 40 cards/agent × 5 ticks × ~3 data points/card/tick**
  - ~3,000 data points per run
  - Result JSON: ~150-200 KB
  - **Status**: In-memory JSON ✅ Fine

### Scenario 2: Medium Scale (Near Future)
- **10-20 agents × 60-100 cards/agent × 100 ticks × 5+ data points/card/tick**
  - ~300K-1M data points per run
  - Result JSON: ~15-50 MB
  - **Status**: In-memory JSON ⚠️ Manageable but slow

### Scenario 3: Large Scale (Production)
- **50+ agents × 200 cards/agent × 1000+ ticks × 10 data points/card/tick**
  - ~100M+ data points per run
  - Result JSON: ~5-10 GB
  - **Status**: In-memory JSON ❌ Memory exhaustion

## Recommendation Matrix

| Requirement | Current | Option | Cost | Benefit |
|-------------|---------|--------|------|---------|
| **Real-time runs** | 5-10 agents, 1-10 ticks | Keep JSON | Free | Instant results |
| **Historical analysis** | 20-100 runs stored | **SQLite** | Low | Query across runs |
| **Live simulation updates** | Stream ticks as they complete | **Redis cache** | Med | Live dashboards |
| **Combat/deck analytics** | Complex post-processing | **Pandas** | Low | Stats, ML-ready |
| **Multi-user platform** | Concurrent simulations | **PostgreSQL** | High | Scalable, multi-tenant |

## Recommended Roadmap

### Phase 1 (Now): Status quo ✅
- Keep in-memory JSON for runs up to 100 ticks
- Add simple file persistence (`results.json`, `results.csv`)

### Phase 2 (Next month): Add SQLite
```python
# backend/database.py
import sqlite3

def save_simulation_run(sim_id: str, result: dict):
    """Store run metadata + link to JSON file."""
    conn = sqlite3.connect('simulations.db')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS runs (
            id TEXT PRIMARY KEY,
            timestamp DATETIME,
            config JSONBLOB,
            agent_count INT,
            tick_count INT,
            total_cards INT,
            json_path TEXT
        )
    ''')
    conn.commit()
```

### Phase 3 (Later): Add Pandas for analytics
```python
# backend/analytics.py
import pandas as pd

def run_analytics(sim_id: str):
    """Load run from SQLite, convert to Pandas for analysis."""
    df_agents = pd.read_sql('SELECT * FROM agent_stats WHERE run_id=?', ...)
    df_cards = pd.read_sql('SELECT * FROM card_prices WHERE run_id=?', ...)
    
    # Compute metrics
    win_rate_by_agent = df_cards.groupby('agent_id')['wins'].sum() / df_cards.groupby('agent_id').size()
    price_volatility = df_cards.groupby('card_id')['price'].std()
```

## Current Code Recommendations

### For Next 2 Weeks: No database needed
- Simulation results → JSON file (with timestamp)
- Add CSV export for spreadsheet analysis
- Keep frontend displaying current run only

### For Month 2-3: Add SQLite
- Store each run's metadata (config, summary stats)
- Index by seed, agent_count, tick_count
- Enable "Load previous run" feature

### For Production: PostgreSQL + Pandas
- Multi-user support
- Complex queries
- Scheduled reporting

## File Size Reference

| Scale | Agents | Ticks | Cards Total | JSON Size | CSV Size |
|-------|--------|-------|-------------|-----------|----------|
| Toy | 2 | 10 | 80 | 50 KB | 100 KB |
| Small | 5 | 50 | 200 | 500 KB | 1 MB |
| Medium | 20 | 200 | 1,200 | 20 MB | 40 MB |
| Large | 50 | 1000 | 5,000 | 500 MB | 1 GB |
| Huge | 100 | 5000 | 10,000 | 5 GB | 10 GB |

## Action Items

1. **Immediate** (This week):
   - Add timestamped file save for each simulation run
   - Implement CSV export

2. **Short term** (Weeks 2-3):
   - Design SQLite schema for storing run metadata
   - Add "Load previous run" feature to UI

3. **Medium term** (Month 2):
   - Implement Pandas-based analytics endpoint
   - Create price history export feature

4. **Long term** (Production):
   - Evaluate PostgreSQL if multi-user needed
   - Set up time-series database (InfluxDB) for tick-by-tick data

## Decision: **SQLite is the right choice for now**

### Why SQLite?
- ✅ No server required
- ✅ Stores alongside code (simulations.db)
- ✅ Easy upgrade path to PostgreSQL later
- ✅ Supports all queries you'll need for 6-12 months

### Pandas?
- **Not yet**: Used for post-processing, not storage
- **Later**: Once you need statistical analysis (win rates, volatility, ML features)

### MongoDB?
- **No**: Overkill, adds complexity, slower than SQLite for this use case

## Implementation Example (When Ready)

```python
# backend/models/run.py
from dataclasses import dataclass
from datetime import datetime

@dataclass
class SimulationRun:
    """Metadata for a stored simulation run."""
    run_id: str
    timestamp: datetime
    config: SimulationConfig
    total_cards_created: int
    total_trades: int
    average_agent_prism: float
    price_index_final: float

# backend/database.py
def store_run(sim_result: dict, config: SimulationConfig):
    """Save simulation run to SQLite."""
    run_id = f"run_{int(time.time())}_{config.seed}"
    
    # Write full result to JSON for fast loading
    json_path = f"runs/{run_id}.json"
    with open(json_path, 'w') as f:
        json.dump(sim_result, f)
    
    # Write metadata to SQLite for querying
    conn = sqlite3.connect('simulations.db')
    conn.execute('''
        INSERT INTO runs VALUES (?, ?, ?, ?, ?)
    ''', (
        run_id,
        datetime.now(),
        json.dumps(config.__dict__),
        len(sim_result['agents']),
        json_path
    ))
    conn.commit()
    return run_id

@app.get("/runs")
def list_runs():
    """List all stored runs with metadata."""
    conn = sqlite3.connect('simulations.db')
    runs = conn.execute('SELECT * FROM runs ORDER BY timestamp DESC LIMIT 20')
    return {"runs": [dict(r) for r in runs.fetchall()]}

@app.get("/runs/{run_id}")
def get_run(run_id: str):
    """Load a specific run from JSON file."""
    conn = sqlite3.connect('simulations.db')
    row = conn.execute('SELECT json_path FROM runs WHERE id=?', (run_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Run not found")
    
    with open(row[0]) as f:
        return json.load(f)
```

## Summary

**Do you need a database now?** No.

**When should you add SQLite?** When you want to compare results across multiple runs or generate reports.

**Can you start simple?** Yes - just save `result.json` with a timestamp for now. Very easy to migrate to SQLite later.

**Recommended next steps:**
1. Add file save with timestamp (1 hour of work)
2. Add CSV export (30 minutes)
3. Revisit database in 3-4 weeks if you need run history
