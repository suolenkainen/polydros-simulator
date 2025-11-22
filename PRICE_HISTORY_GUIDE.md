# Price History Feature Guide

## Overview

The Polydros Economy Simulator now tracks and visualizes the complete price history of every card instance across the entire simulation. This allows you to analyze market trends, card performance, and pricing dynamics over time.

## What's Tracked

For every card in every agent's collection, the system records:
- **Tick**: Simulation tick when data was captured
- **Price**: Market price of the card at that tick
- **Quality Score**: Quality rating (0-10 scale)
- **Desirability**: Desirability metric based on wins/losses and quality (0-10 scale)

Data is recorded automatically at the end of each simulation tick and persisted through the API.

## Features

### 1. Global Card Search
The search feature (at the top of the Agent panel) lets you find any card across all agents:

1. Type a card name (e.g., "Alloyed Guardian")
2. Results show all instances of that card in the collection
3. Click any result to open the detailed card view

**What you see:**
- Card name and rarity
- Which agent owns it
- Current price in Ⓟ (Prisms)
- Quality score
- Price history data points (number of ticks recorded)

### 2. Price History Chart
When you click a card, the CardDetail modal opens with a comprehensive price history chart:

**Chart Features:**
- **X-axis**: Simulation ticks
- **Y-axis**: Price in Ⓟ (Prisms)
- **Green line**: Price trend over time
- **Red dot**: Current price
- **Grid lines**: Reference grid for easy reading

**Data Displayed:**
- Automatic scaling to fit all prices
- First, middle, and last tick labeled on X-axis
- Y-axis shows price range with labels

### 3. Card Detail Modal
Clicking a card from the inventory table or search results opens the detail modal with:

**Card Information:**
- Card image
- Cost (in colored and colorless gems)
- Power and Defence stats
- Card flavor text

**Market Data:**
- Current Price
- Quality Score
- Attractiveness rating

**Price History:**
- Interactive SVG chart with price trend
- Current price highlighted
- Tracks all 20+ ticks of simulation data

## How to Use

### Find a Specific Card

1. Run a simulation (e.g., 50 ticks, 10 agents)
2. Use the "🔍 Search All Card Collections" feature
3. Type the card name (e.g., "Alloyed Guardian")
4. View all instances and their price histories

### View Price History for a Card

**Method 1: From Agent Inventory**
1. Select an agent from the left panel
2. View their card collection table
3. Click any card to open its details
4. Price history chart appears at the bottom

**Method 2: From Global Search**
1. Use the search feature to find cards
2. Click a search result to open detail
3. View price history chart

### Interpret the Price Chart

**Flat line**: Card price remained constant
**Upward slope**: Card increased in value over time
**Downward slope**: Card decreased in value
**Multiple data points**: Simulation ran across many ticks

**Example: "Alloyed Guardian"**
- Common card with base price 0.33 Ⓟ
- Quality score: 10.0
- Typical desirability: 7.0
- Price history: Records from tick 1 to tick 50 (for 50-tick simulation)

## Data Flow

```
Simulation Engine
    ↓
    record_price_points() called each tick
    ↓
    AgentCardInstance.record_price_point()
    ↓
    PriceDataPoint appended to price_history array
    ↓
    Agent data serialized to JSON
    ↓
    API /agents/{agent_id}/cards endpoint
    ↓
    Frontend receives full price_history
    ↓
    AgentInventory component maps data
    ↓
    CardDetail renders SVG chart
```

## Technical Details

### Backend Storage (simulation/types.py)
```python
@dataclass
class PriceDataPoint:
    tick: int                  # Simulation tick
    price: float              # Market price
    quality_score: float      # Card quality
    desirability: float       # Desirability (0-10)
    
@dataclass
class AgentCardInstance:
    # ... other fields ...
    price_history: list       # List[PriceDataPoint]
    
    def record_price_point(self, tick: int) -> None:
        """Record current state as price data point"""
        price_point = PriceDataPoint(
            tick=tick,
            price=self.current_price,
            quality_score=self.quality_score,
            desirability=self.desirability,
        )
        self.price_history.append(price_point)
```

### API Response (backend/main.py)
The `/agents/{agent_id}/cards` endpoint returns:
```json
{
  "id": 1,
  "name": "Agent 1",
  "collection_count": 47,
  "cards": [
    {
      "card_instance_id": "...",
      "card_name": "Alloyed Guardian",
      "current_price": 0.33,
      "price_history": [
        {"tick": 1, "price": 0.33, "quality_score": 10.0, "desirability": 7.0},
        {"tick": 2, "price": 0.33, "quality_score": 10.0, "desirability": 7.0},
        // ... more data points ...
      ]
    }
  ]
}
```

### Frontend Components

**GlobalCardSearch.tsx** - New search component
- Searches all agents' card instances by name
- Displays results in searchable table
- Shows price history entry count
- Click to open CardDetail

**CardDetail.tsx** - Updated to display chart
- Already had SVG chart implementation
- Receives priceHistory prop from card data
- Displays price trend with grid lines
- Shows current price indicator

**AgentInventory.tsx** - Maps price history
- Maps card_instances to Card format
- Includes price_history from instance.price_history
- Passes full priceHistory to CardDetail

## Example Scenarios

### Scenario 1: Tracking "Alloyed Guardian"
1. Run simulation: 50 ticks, 10 agents
2. Search for "Alloyed Guardian"
3. Find 39 instances across agents
4. Click Agent 1's instance
5. View 50-point price history (one per tick)
6. See flat price line at 0.33 Ⓟ
7. View desirability trend (7.0)

### Scenario 2: Finding Price Volatility
1. Search for specific card
2. View price chart
3. Look for upward/downward trends
4. Compare prices across different agent's copies
5. Analyze which cards increase in value

### Scenario 3: Quality vs Desirability Analysis
1. Open card detail
2. View price chart (shows price history)
3. Note quality score and desirability
4. Correlate with price trend
5. Identify cards where quality impacts price

## Limitations and Future Improvements

**Current Limitations:**
- Chart refreshes on modal close/open
- Search is client-side only (works with current agents data)
- No export or historical comparison

**Potential Future Features:**
- Aggregated price statistics (min/max/average)
- Price history export to CSV
- Trend analysis and prediction
- Price comparison across cards
- Historical playback (scrub through time)
- Watchlist/bookmarks for favorite cards

## Troubleshooting

### Chart not showing?
- Ensure you've run a simulation first
- Card must have price_history data (requires multiple ticks)
- Click the card to ensure modal opened

### Search results empty?
- Run a simulation with more ticks
- Check card name spelling
- Try partial name match

### Price history showing only 1 point?
- Run simulation with more ticks (50+ recommended)
- Each tick adds one data point
- 100-tick simulation gives 100 price points per card

## API Endpoints

**GET** `/agents/{agent_id}/cards`
Returns all card instances with full price history
- Response includes price_history array for each card
- Data is serialized from AgentCardInstance.to_dict()

## Performance Notes

- Price history is recorded for every card instance every tick
- For 100 ticks with 10 agents (50 cards each):
  - ~50,000 price data points total
  - ~13.5 MB data size (acceptable for API)
  - Chart renders efficiently with SVG

## Summary

The price history feature provides complete visibility into card pricing dynamics throughout the simulation. Use it to:
- Track individual card performance
- Analyze market trends
- Compare card values across agents
- Understand desirability impact on prices
- Make informed trading decisions

All price data is automatically collected, persisted, and ready for visualization. Simply run a simulation and use the search feature to explore!
