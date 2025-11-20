# Market Functionality Design

## 🎯 Overview

Implement a comprehensive market system that tracks individual card instances across agents, captures price history at each tick, and provides detailed analytics on card performance, desirability, and economic value.

---

## 📊 Data Model

### 1. Price History Tracking

#### Current State (Simulation)
- Cards have base prices in `cards.json`
- Prices evolve during simulation based on supply/demand
- **GAP:** No historical price data is captured per tick

#### New State
Each card instance tracks:
```python
PriceDataPoint = {
    tick: int,
    price: float,
    agent_id: int,
    card_instance_id: str,
    # Additional metrics:
    supply_count: int,          # How many of this card exist globally
    demand_count: int,          # How many agents want this card
    traded_this_tick: bool,     # Was this card traded?
    quality_score: float,       # Current quality (may degrade)
}
```

**Storage Strategy:**
- Backend: Store as list of price points in simulation response
- Frontend: Cache price history in sessionStorage alongside simulation state
- Visualization: Display as line chart in card detail modal

---

### 2. Agent Card Instance Model

#### Current State (Simulation)
- Agents have "cards" but they're just references to card IDs
- No unique identity per card copy
- **GAP:** Can't distinguish individual card instances

#### New State
```python
AgentCard = {
    card_instance_id: str,      # Unique ID for THIS card copy
    card_id: str,               # Reference to master card (e.g., "C001")
    agent_id: int,              # Owner
    acquisition_tick: int,      # When acquired
    acquisition_price: float,   # Price when acquired
    
    # Evolving stats:
    current_price: float,       # Current market price
    quality_score: float,       # Quality (degrades with losses)
    desirability: float,        # How desirable (wins/losses affect it)
    win_count: int,             # Combat wins with this card
    loss_count: int,            # Combat losses with this card
    condition: str,             # "mint" | "played" | "damaged" | "worn"
    
    # Market data:
    trade_history: [
        {
            tick: int,
            sold_to: int,       # agent_id of buyer
            price: float,
        }
    ]
}
```

---

### 3. Global Market State

Track aggregate market data each tick:

```python
MarketSnapshot = {
    tick: int,
    total_volume_traded: float,     # Total Prisms exchanged
    cards_traded_count: int,        # Number of card trades
    price_index: float,             # Average price across all cards
    volatility: float,              # Price movement variance
    unique_cards_in_circulation: int, # How many unique card IDs owned
    total_card_instances: int,      # Total individual cards across all agents
}
```

---

## 🎨 UI/UX Components

### 1. Card Detail Modal Enhancements

**Current:** Shows card stats, flavor text, economy data

**New:** Add price history chart

```
┌─────────────────────────────────────┐
│ Card Detail Modal                   │
├─────────────────────────────────────┤
│ [Card Name] [Rarity] [Color]       │
├─────────────────────────────────────┤
│ Card Image                          │
├─────────────────────────────────────┤
│ Stats: Cost | Power | Defence       │
├─────────────────────────────────────┤
│ *** NEW: Price History Chart ***    │
│ [Line graph showing price over ticks]
│ Legend: Min / Avg / Current         │
├─────────────────────────────────────┤
│ Market Data:                        │
│  Current Price: 123.45 Ⓟ           │
│  Quality Score: 8.5/10              │
│  *** NEW: Desirability: 7.2 ***     │
│  *** NEW: Wins: 12 | Losses: 3 ***  │
│  *** NEW: Condition: Played ***     │
├─────────────────────────────────────┤
│ Flavor Text                         │
└─────────────────────────────────────┘
```

### 2. New Market Dashboard (Optional Future)

Could add a separate "Market" view:
- Global price index over time
- Most traded cards
- Price volatility indicators
- Supply/demand heatmap

---

## 🔄 Data Flow Architecture

### Tick Progression Flow

```
[Simulation Tick N] 
    ↓
[Game Events Processed]
    ├── Card trades happen
    ├── Combat results computed
    ├── Card stats updated (wins/losses)
    └── Prices adjusted (supply/demand)
    ↓
[Capture Market Snapshot]
    ├── For each agent card instance:
    │   ├── Record current price
    │   ├── Record quality/desirability
    │   ├── Calculate condition
    │   └── Add to price history
    ├── Aggregate market stats
    └── Store in simulation response
    ↓
[Send to Frontend]
    ├── Timeseries data includes price history
    ├── Agent inventory includes card instances
    └── Market snapshots stored
    ↓
[Frontend Cache]
    ├── sessionStorage: Save price history
    ├── sessionStorage: Save card instances
    └── Component State: Display current selection
```

### Backend Changes Required

#### 1. simulation/engine.py
- Track individual card instances (with instance IDs)
- For each card instance, capture price each tick
- Record combat outcomes (win/loss count per card)
- Update desirability based on performance

#### 2. simulation/types.py
- Add `AgentCard` type with all card instance fields
- Add `PriceDataPoint` type
- Add `MarketSnapshot` type

#### 3. simulation/world.py
- Store price history per card instance
- Calculate card condition based on quality/wins/losses
- Aggregate market statistics each tick

#### 4. backend/main.py
- Include price history in API response
- Include card instances in agent inventory
- Include market snapshots in timeseries

---

## 🎯 Frontend Implementation

### 1. Data Structure Changes

**Card Instance Type (TypeScript):**
```typescript
type AgentCard = {
  card_instance_id: string
  card_id: string
  agent_id: number
  acquisition_tick: number
  acquisition_price: number
  current_price: number
  quality_score: number
  desirability: number
  win_count: number
  loss_count: number
  condition: 'mint' | 'played' | 'damaged' | 'worn'
}

type PriceDataPoint = {
  tick: number
  price: number
  quality_score: number
  desirability: number
}

type CardWithHistory = AgentCard & {
  priceHistory: PriceDataPoint[]
}
```

### 2. Component Updates

**CardDetail.tsx:**
- Accept `priceHistory` prop
- Add Recharts LineChart component for price visualization
- Display win/loss count
- Display desirability metric
- Display condition badge
- Show price volatility stats (min, max, average, current)

**AgentInventory.tsx:**
- Display card instances instead of generic cards
- Show condition indicator in table
- Show desirability in table
- Link to card details with full history

**NewComponent: MarketBrowser.tsx (Optional):**
- Global market statistics
- Price index chart
- Most valuable cards
- Most traded cards
- Supply/demand analysis

### 3. Price History Visualization

**Chart Features:**
```
Y-Axis: Price (Prisms)
X-Axis: Tick Number

Features:
- Line chart showing price trend
- Tooltip on hover showing exact price + tick
- Multiple series:
  ├── Historical price line
  ├── Average price reference line
  └── Current price point (highlighted)

Statistics Box:
├── Current: 234.56 Ⓟ
├── Min: 123.45 Ⓟ (Tick 5)
├── Max: 345.67 Ⓟ (Tick 12)
├── Average: 212.34 Ⓟ
└── Volatility: 12.3% (std dev)
```

---

## 📋 Implementation Phases

### Phase 1: Backend Infrastructure (Required First)
1. Create AgentCard type with instance tracking
2. Modify engine to create unique card instance IDs
3. Capture price history each tick
4. Calculate card metrics (win/loss, condition)
5. Update API response structure

### Phase 2: API Integration
1. Verify agent inventory returns card instances
2. Verify price history is included
3. Test data structure in responses
4. Handle backwards compatibility (if needed)

### Phase 3: Frontend Display
1. Update AgentInventory to show card instances
2. Update CardDetail modal with new fields
3. Add price history chart with Recharts
4. Add condition badge styling
5. Update sessionStorage persistence

### Phase 4: Polish & Analytics (Optional)
1. Add market dashboard
2. Add price volatility indicators
3. Add supply/demand visualization
4. Performance optimization

---

## 🔌 API Response Structure

### Current Response
```json
{
  "timeseries": [{
    "tick": 0,
    "agent_count": 10,
    "total_cards": 0,
    "total_unopened_boosters": 100
  }],
  "agents": [{
    "id": 1,
    "cards": [
      {"card_id": "C001", "price": 100.0}
    ]
  }]
}
```

### New Response Structure
```json
{
  "timeseries": [{
    "tick": 0,
    "agent_count": 10,
    "total_cards": 0,
    "total_unopened_boosters": 100,
    "market_snapshot": {
      "total_volume_traded": 0.0,
      "cards_traded_count": 0,
      "price_index": 100.0,
      "volatility": 0.0
    }
  }],
  "agents": [{
    "id": 1,
    "cards": [{
      "card_instance_id": "INST_001_1",
      "card_id": "C001",
      "agent_id": 1,
      "acquisition_tick": 0,
      "acquisition_price": 100.0,
      "current_price": 125.5,
      "quality_score": 8.5,
      "desirability": 7.2,
      "win_count": 5,
      "loss_count": 2,
      "condition": "played",
      "priceHistory": [
        {"tick": 0, "price": 100.0, "quality": 10.0, "desirability": 5.0},
        {"tick": 1, "price": 102.3, "quality": 10.0, "desirability": 5.5},
        {"tick": 2, "price": 125.5, "quality": 8.5, "desirability": 7.2}
      ]
    }]
  }]
}
```

---

## 🧮 Calculation Formulas

### Condition Calculation
```
if quality_score > 9.5:
    condition = "mint"
elif quality_score > 7.5 and loss_count == 0:
    condition = "played"
elif quality_score > 5.0:
    condition = "damaged"
else:
    condition = "worn"
```

### Desirability Calculation
```
base_desirability = 5.0
win_bonus = win_count * 0.5
loss_penalty = loss_count * 0.3
quality_factor = (quality_score / 10.0) * 2.0

desirability = base_desirability + win_bonus - loss_penalty + quality_factor
desirability = clamp(desirability, 0.0, 10.0)
```

### Price History Recording
```
Every tick for each card instance:
- Record current_price
- Record quality_score
- Record desirability
- This creates a PriceDataPoint entry
```

---

## ✅ Success Criteria

- [ ] Each card has a unique instance ID
- [ ] Price is captured each tick per card instance
- [ ] Card shows win/loss counts
- [ ] Card shows desirability score
- [ ] Card shows condition ("mint", "played", "damaged", "worn")
- [ ] Price history renders as line chart in card detail
- [ ] Chart shows min/max/average/current prices
- [ ] Volatility is calculated and displayed
- [ ] Agent inventory shows card instances (not just generic cards)
- [ ] Data persists across page refresh (sessionStorage)
- [ ] No TypeScript errors
- [ ] Build completes successfully

---

## 🚀 Questions to Consider

1. **Price History Granularity:** Should we store price for EVERY tick or just when price changes?
   - Recommendation: Every tick (simpler, cleaner data)

2. **Card Instance ID Generation:** How to generate unique IDs?
   - Recommendation: `INST_{card_id}_{agent_id}_{creation_timestamp}` or UUID

3. **Market Dashboard:** Should we build this in Phase 1 or defer to Phase 4?
   - Recommendation: Defer to Phase 4, focus on card-level first

4. **Price Impact on Quality:** Do losses impact quality score, or just desirability?
   - Current assumption: Quality degrades independently; desirability reflects performance

5. **Trade History:** Should we track full trade history per card?
   - Current plan: Yes, include in AgentCard trade_history array

6. **API Backwards Compatibility:** Do we need to support old response format?
   - Question: Should old format still work?

---

## 📚 Related Files to Modify

### Backend
- `simulation/types.py` - Add new types
- `simulation/engine.py` - Implement market tracking
- `simulation/world.py` - Store snapshots
- `backend/main.py` - Update API response

### Frontend
- `frontend/src/components/CardDetail.tsx` - Add price chart
- `frontend/src/components/AgentInventory.tsx` - Show card instances
- `frontend/src/types/market.ts` (new) - TypeScript types
- `frontend/src/utils/marketUtils.ts` (new) - Market calculations
- `frontend/src/styles/global.css` - Add chart styling

---

**Next Steps:** Review design, ask questions, adjust requirements, then proceed to implementation.

