# Trading System Rewrite - Detailed Specification

## Overview
Trading happens every 3 ticks in two phases: **Buying Phase** and **Selling Phase**.

---

## BUYING PHASE (Ticks 1, 4, 7, 10, ...)

### Step 1: Build Purchase Lists (Parallel for all agents)
Each agent independently:
1. Retrieves all cards currently on marketplace
2. For EACH card on market:
   - Calculate desirability FOR THIS AGENT based on:
     - Card rarity (collector likes rare)
     - Card price vs agent budget
     - Card quality/condition
     - Agent trait preferences
     - Agent current inventory size
   - Store as: `(card_instance_id, desirability_score, is_viable)`
3. Filter to keep only cards with `is_viable=true` (score > agent's threshold)
4. Sort by desirability_score DESC
5. Store as agent's "purchase_list"

**Output per agent:** Ordered list of card_instance_ids they're willing to buy

### Step 2: Sequential Purchase Execution (Order: Agent 1, 2, 3, ...)
For each agent in order (1, 2, 3, ...):
1. Get agent's purchase_list
2. For EACH card in purchase_list (in order):
   - Check if card still exists on marketplace
   - If sold by previous agent: Skip to next card
   - If agent has enough prism:
     - Execute purchase:
       - Transfer card to agent's inventory
       - Update card's agent_id
       - Transfer prism (buyer loses, seller gains)
       - Remove card from marketplace
       - Remove card from ALL other agents' purchase_lists
       - Log event: `card_purchased`
       - Break (agent buys max 1 card per cycle)
   - Else: Continue to next card
3. Move to next agent

**Key:** Once a card is bought, it's removed from marketplace AND from all pending purchase lists

---

## SELLING PHASE (Ticks 3, 6, 9, 12, ...)

### Step 1: Identify Candidates for Sale
Each agent independently evaluates their inventory:
1. For EACH card in agent's card_instances:
   - Calculate if should sell based on:
     - Card quality_score < threshold (agent's trait-dependent)
     - Card desirability < threshold (losing cards)
     - Random chance based on trait (5% for scavengers, 2% for others)
     - Agent inventory size (if > max_size, must sell)
   - If should_sell = true: Mark for sale
2. Build "sell_list" with marked cards

**Output per agent:** List of card_instance_ids to list on market

### Step 2: Price and List (Sequential per agent)
For each agent in order (1, 2, 3, ...):
1. For EACH card in agent's sell_list:
   - Calculate listing price:
     - Base = card.current_price * 0.75 (sell at discount)
     - Adjust by quality: if quality < 5, discount more (0.6x)
     - Minimum price = 0.1 Prism
   - Add to marketplace:
     - card_instance_id
     - seller_agent_id
     - listing_price
     - listing_tick
   - Remove from agent's card_instances
   - Log event: `card_listed`

---

## State Updates

### Agent State After Buying Phase
```
agent.card_instances:
  - May have NEW cards (purchases)
  - May have SAME count (if no purchases)

agent.prism:
  - Decreased if bought
  - Unchanged if no purchases

agent.purchase_list:
  - Cleared for next cycle
```

### Agent State After Selling Phase
```
agent.card_instances:
  - Decreased (cards listed removed immediately)

agent.prism:
  - Unchanged during listing
  - Will increase AFTER buyer purchases (in next buying phase)
```

### Marketplace State
```
marketplace:
  - Before buying: N listings
  - After buying: N - purchases_made listings
  - After selling: N - purchases_made + new_listings listings
```

---

## Trait-Based Decision Logic

### COLLECTOR (collector_trait > 0.5)
**Buying:**
- Desirability boost for Rare/Mythic: +3
- Desirability reduction for Common: -2
- Buy if desirability > 5.0

**Selling:**
- Rarely sells high-rarity cards
- Only sells Commons and damaged cards
- Random threshold: 3% chance

### SCAVENGER (scavenger_trait > 0.5)
**Buying:**
- Desirability boost for cheap cards (< 1 Prism): +4
- Only buys if price < 2.0 Prism
- Buy if desirability > 3.0

**Selling:**
- Aggressively sells to rotate inventory
- All cards candidate: 5% random chance
- Slightly lower prices: 0.7x base price

### COMPETITOR (competitor_trait > 0.5)
**Buying:**
- Desirability boost for cards they already have (want duplicates): +2
- Desirability reduction for cards others have: -1
- Buy if desirability > 4.0

**Selling:**
- Sells after losses (loss_count > 2): high priority
- Trying to rebuild deck with winning cards
- Normal pricing: 0.75x

### GAMBLER (gambler_trait > 0.5)
**Buying:**
- Random buys: 15% chance to buy ANY card regardless of score
- Desirability threshold low: > 2.0
- Impulse buying behavior

**Selling:**
- Chaotic: 8% random chance for any card
- Wild prices: 0.5x to 0.9x random multiplier

### DEFAULT (no dominant trait)
**Buying:**
- Conservative: desirability > 5.0
- Small random chance: 5% to buy anything

**Selling:**
- Conservative: 2% random chance
- High-quality pricing: 0.8x base price

---

## Event Logging

### Buying Phase Events
```
Event:
  tick: current_tick
  agent_id: buyer_agent_id
  event_type: "card_purchased"
  description: "{buyer} bought {card_name} from {seller} for {price} Prism"
  agent_ids: [buyer_id, seller_id]
  triggered: true
```

### Selling Phase Events
```
Event:
  tick: current_tick
  agent_id: seller_agent_id
  event_type: "card_listed"
  description: "{seller} listed {card_name} for {price} Prism (quality: {q}, desirability: {d})"
  agent_ids: [seller_id]
  triggered: true
```

---

## Implementation Checklist

- [ ] Move trading logic to separate module `simulation/trading.py`
- [ ] Implement `build_purchase_lists(world)` - returns dict of agent_id -> purchase_list
- [ ] Implement `execute_buying_phase(world, purchase_lists)` - executes purchases sequentially
- [ ] Implement `build_sell_lists(world)` - returns dict of agent_id -> sell_list
- [ ] Implement `execute_selling_phase(world, sell_lists)` - lists cards on market
- [ ] Implement trait-specific desirability calculations
- [ ] Integrate into engine.py every 3 ticks
- [ ] Add purchase_list to agent detail page display
- [ ] Update frontend to show desirability FOR EACH AGENT
- [ ] Add UI to visualize marketplace with agent desirability scores
- [ ] Run tests in headless mode
- [ ] Verify trading sequences with 10-tick simulation

---

## Trading Cycle Example (10 ticks)

```
Tick 0: Initial (no trading)
Tick 1: No trading
Tick 2: No trading
Tick 3: SELLING PHASE
        - Agents list cards for sale
Tick 4: BUYING PHASE (first)
        - Agents build purchase lists
        - Agents execute purchases sequentially
        - Cards move from market to agents
Tick 5: No trading
Tick 6: SELLING PHASE (second)
        - Agents list remaining cards
Tick 7: BUYING PHASE (second)
        - New buying round
Tick 8: No trading
Tick 9: SELLING PHASE (third)
Tick 10: BUYING PHASE (third)
```

Every 3 ticks: SELL (t%3==0), BUY (t%3==1)
