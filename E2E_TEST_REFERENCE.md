# E2E Test Expansion - Quick Reference

## What Changed

### Original Tests (10)
- Basic UI navigation
- Event log checks
- Minimal assertions

### Expanded Tests (20)
- API response validation
- Numeric field verification
- Card data integrity checks
- Multi-agent comparisons
- Correlation analysis
- Edge case testing

---

## Test Additions by Category

### Tick 0 Initialization
- **Old:** 1 test (seed=N/A)
- **New:** 2 tests (seeds 42, 999)
- **Addition:** Different seed verification

### Purchase Events
- **Old:** 1 test
- **New:** 2 tests (seeds 42, 555)
- **Addition:** Event counting with regex, multi-tick duration

### Agent Collections
- **Old:** 2 tests (Agent 0 and 3)
- **New:** 3 tests (API response validation, distinct collections)
- **Addition:** 
  - Card field validation (card_id, name, rarity, price, attractiveness)
  - Numeric range checks
  - Collection comparison between agents

### Collector Trait
- **Old:** 1 test
- **New:** 2 tests (seed 123, seed 777 vs 333)
- **Addition:** Trait range validation, seed variation testing

### Combat Events
- **Old:** 1 test
- **New:** 2 tests (10 agents, 5 agents)
- **Addition:** Event counting, varied agent count testing

### Combat Winner/Loser
- **Old:** 1 test
- **New:** 2 tests (format validation, opponent pair structure)
- **Addition:** Regex pattern matching, event structure validation

### Winning Cards Stats
- **Old:** 1 test
- **New:** 2 tests (attractiveness > 1.0, min/max variation)
- **Addition:** Min/max analysis, card variation detection

### Losing Cards Stats
- **Old:** 1 test
- **New:** 2 tests (attractiveness bounds, multi-agent variation)
- **Addition:** Statistics across agents, range validation

### Card Prices
- **Old:** 1 test
- **New:** 3 tests (basic, variation, correlation)
- **Addition:**
  - Price field validation
  - Min/max analysis
  - Price-attractiveness correlation (|diff| < 0.01)

---

## Numeric Validations Added

### Price Validation
```typescript
// For each card:
0 < price < 100
```

### Attractiveness Validation
```typescript
// Initially:
0 < attractiveness ≤ 2.0

// After multiple wins/losses:
0 < attractiveness < 5.0  // Sanity check
```

### Collection Count Validation
```typescript
// After 3 ticks (15 packs opened):
10 ≤ count ≤ 25

// After 15 ticks (75 packs opened):
count ≥ 60
```

### Collector Trait Validation
```typescript
// Always:
0.10 ≤ trait ≤ 0.50
```

### Price-Attractiveness Correlation
```typescript
// Must maintain:
|price - attractiveness| < 0.01
// Both modified by same factors (±1%)
```

---

## API Endpoints Tested

### GET /agents/{id}/cards
```json
{
  "id": 0,
  "name": "Agent 0",
  "collection_count": 75,
  "cards": [
    {
      "card_id": "R050",
      "name": "Pyromancer",
      "rarity": "RARE",
      "is_hologram": false,
      "quality_score": 10.0,
      "price": 1.030301,
      "attractiveness": 1.030301
    }
  ]
}
```

### GET /agents/{id}
```json
{
  "agent": {
    "id": 0,
    "name": "Agent 0",
    "prism": 20.0,
    "collection_count": 75,
    "booster_count": 0,
    "traits": {
      "collector_trait": 0.21,
      "competitor_trait": 0.0,
      "gambler_trait": 0.0,
      "scavenger_trait": 0.0
    },
    "agent_events": [...]
  }
}
```

---

## Seeds Used (12+)

| Seed | Purpose | Agents | Ticks |
|------|---------|--------|-------|
| 42 | Baseline reproducibility | 5-10 | 0-3 |
| 999 | Alternative reproducibility | 10 | 0-20 |
| 888 | Losing card testing | 8 | 25 |
| 777 | Winning card testing | 8 | 25 |
| 555 | Combat format testing | 15 | 30 |
| 444 | Varied agent count | 5 | 20 |
| 333 | Trait variation (vs 777) | 8 | 30 |
| 123 | Collector trait threshold | 5 | 15 |
| 111 | Attractiveness variation | 6 | 30 |
| 202 | Multi-agent attractiveness | 10 | 30 |
| 666 | Price variation testing | 10 | 30 |
| Additional | Future expansion | Any | Any |

---

## Field Verification Matrix

### Card Fields
| Field | Type | Valid Range | Check |
|-------|------|-------------|-------|
| card_id | string | non-empty | ✅ |
| name | string | non-empty | ✅ |
| rarity | enum | COMMON/U/R/M | ✅ |
| is_hologram | boolean | T/F | ✅ |
| quality_score | number | 0-100 | ✅ |
| price | number | 0-100 | ✅ |
| attractiveness | number | 0-2+ | ✅ |

### Agent Fields
| Field | Type | Valid Range | Check |
|-------|------|-------------|-------|
| id | number | 0+ | ✅ |
| name | string | non-empty | ✅ |
| prism | number | 0+ | ✅ |
| collection_count | number | 0+ | ✅ |
| collector_trait | number | 0.10-0.50 | ✅ |
| agent_events | array | any | ✅ |

---

## Test Execution Order

```
Tier 1: Initialization (Tests 1-2)
  └─ Validates tick 0 clean state

Tier 2: Data Entry (Tests 3-4)
  └─ Validates purchasing creates events

Tier 3: Collection Integrity (Tests 5-7)
  └─ Validates card data structure

Tier 4: Trait Logic (Tests 8-9)
  └─ Validates collector trait range

Tier 5: Combat Mechanics (Tests 10-13)
  └─ Validates combat events and format

Tier 6: Card Stats (Tests 14-17)
  └─ Validates attractiveness tracking

Tier 7: Economic System (Tests 18-20)
  └─ Validates price tracking and correlation
```

---

## CI/CD Integration

### Pre-Commit (Local)
```bash
npm run test:e2e -- --project=chromium
```

### CI Pipeline
```bash
# Runs all 20 tests with retries
npm run test:e2e -- --retries=2 --reporter=junit
```

### Failure Diagnosis
1. Check which tier failed
2. Review test purpose
3. Run failed test in isolation
4. Check backend logs at port 8000
5. Verify seed reproducibility

---

## Performance Notes

| Test | Avg Duration | Backend Wait | Notes |
|------|--------------|--------------|-------|
| Tick 0 tests | 2-3s | 2s | Fast |
| Purchase tests | 4-5s | 4s | Medium |
| Collection tests | 3-4s | 3s | API calls |
| Trait tests | 4-5s | 4s | Multi-run |
| Combat tests | 5-6s | 5s | Many events |
| Stats tests | 4-5s | 4s | API parsing |
| Price tests | 5-6s | 5s | Calculations |

**Total Suite:** ~90 seconds (parallel capable with Playwright)

---

## Debugging Single Test

```bash
# Run one test in UI debug mode
npx playwright test -g "tick 0 shows no events" --ui

# With verbose logging
npx playwright test -g "agent 0 has correct collection data" -v

# Generate trace (for post-mortem)
npx playwright test -g "combat records winner and loser" --trace on
```

---

## Future Enhancements

- [ ] Add screenshot assertions for UI validation
- [ ] Test trading system (when implemented)
- [ ] Test market visualization (when implemented)
- [ ] Performance benchmarks (100+ agents)
- [ ] Stress testing (1000+ ticks)
- [ ] Visual regression testing
- [ ] Load testing with multiple concurrent runs
- [ ] GraphQL query testing (if API upgraded)
- [ ] WebSocket real-time updates (if added)
