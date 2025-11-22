# Price History UI Guide

## Screen Layout

### 1. Main Simulation View
```
┌─────────────────────────────────────────────────────────────────┐
│ Polydros — Economy Simulator                                    │
├─────────────────────────────────────────────────────────────────┤
│ [Run Simulation] Agents: 5  Ticks: 50  Seed: 42  [▶ Run]       │
├─────────────────────────────────────────────────────────────────┤
│ World: Tick 50 | Agents: 5 | Total Cards: 250 | Boosters: 45   │
├─────────────────────────────────────────────────────────────────┤
│ Events: 127 market events recorded                              │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────────┬─────────────────────────────────────────┐ │
│ │ Agent List       │ Agent & Card Search                      │ │
│ │                  │                                          │ │
│ │ - Agent 1 (247)  │ 🔍 Search All Card Collections          │ │
│ │ - Agent 2 (248)  │ Search for any card across all agents   │ │
│ │ - Agent 3 (249)  │                                          │ │
│ │ - Agent 4 (251)  │ [Search card name...]          [Search]  │ │
│ │ - Agent 5 (246)  │                                          │ │
│ │                  │ Found 39 matching card instance(s)       │ │
│ │                  │ ┌────────────────────────────────────┐   │ │
│ │                  │ │ Card Name │ Rarity │ Price │ Hist │   │ │
│ │                  │ ├────────────────────────────────────┤   │ │
│ │                  │ │Alloyed... │ Common │ 0.33  │📈50pts│   │ │
│ │                  │ │Alloyed... │ Common │ 0.33  │📈50pts│   │ │
│ │                  │ │Alloyed... │ Common │ 0.33  │📈50pts│   │ │
│ │                  │ └────────────────────────────────────┘   │ │
│ │                  │                                          │ │
│ │                  │ Agent 1's Card Collection                │ │
│ │                  │ Total Cards: 247                         │ │
│ │                  │                                          │ │
│ │                  │ ┌────────────────────────────────────┐   │ │
│ │                  │ │ Name      │ Rarity │ Price │ Hist │   │ │
│ │                  │ ├────────────────────────────────────┤   │ │
│ │                  │ │Refractor… │ Common │ 0.33  │📈50pts│   │ │
│ │                  │ │Sentry... │ Uncommon│ 1.50  │📈40pts│   │ │
│ │                  │ │Arcane... │ Rare   │ 5.50  │📈30pts│   │ │
│ │                  │ └────────────────────────────────────┘   │ │
│ │                  │                                          │ │
│ └──────────────────┴─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Card Detail Modal with Price History Chart
```
┌─────────────────────────────────────────────────────────────────┐
│                    Card Detail Modal                        [✕]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Alloyed Guardian [COMMON]  Color: Ruby                         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │              [Card Image 320x180]                      │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Cost: 1 red, 0 uncolored                                      │
│  Power: ⚔ 3              Defence: 🛡 2                         │
│                                                                  │
│  ─────────────────────────────────────────────────────────     │
│                                                                  │
│  Market Data:                                                   │
│    Current Price: 0.33 Ⓟ                                       │
│    Quality Score: 10.0                                         │
│    Attractiveness: 7.0                                         │
│                                                                  │
│  ─────────────────────────────────────────────────────────     │
│                                                                  │
│  Price History                                                  │
│                                                                  │
│     Price (Ⓟ)                                                  │
│      10 │                                                      │
│       8 │                                                      │
│       6 │          ╭─────────────────────╮                    │
│       4 │         ╱                       ╲                   │
│       2 │────────╱                         ╲────────          │
│       0 │                                    ●               │
│         ├─────┼────────┼────────┼────────┼──────┤            │
│         0     10      20       30      40      50             │
│                                    Tick                        │
│                                                                  │
│  Legend: ─── Price trend    ● Current price                   │
│                                                                  │
│  First: Tick 1, Price 0.33                                    │
│  Last: Tick 50, Price 0.33                                    │
│  Data Points: 50                                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Search Feature Components

### Global Card Search Section
```
┌─────────────────────────────────────────────┐
│ 🔍 Search All Card Collections              │
│ Search for any card across all agents and    │
│ view its price history                       │
│                                              │
│ [Search card name...] [Search]              │
│                                              │
│ Found 39 matching card instance(s)          │
│                                              │
│ ┌───────────────────────────────────────┐   │
│ │ Card      │Agent│Rarity│Price│History │   │
│ │─────────────────────────────────────── │   │
│ │ Alloyed G │ Ag1 │Common│0.33 │📈 50pt  │   │
│ │ Alloyed G │ Ag1 │Common│0.33 │📈 46pt  │   │
│ │ Alloyed G │ Ag2 │Common│0.33 │📈 50pt  │   │
│ │ Alloyed G │ Ag3 │Common│0.33 │📈 48pt  │   │
│ │ Alloyed G │ Ag4 │Common│0.33 │📈 50pt  │   │
│ │ Alloyed G │ Ag5 │Common│0.33 │📈 50pt  │   │
│ └───────────────────────────────────────┘   │
│                                              │
│ Showing 6 of 39 cards (scroll to see more)  │
└─────────────────────────────────────────────┘
```

## Price History Chart Detail

### Simple Price History (Flat)
```
Price (Ⓟ)
  1.0 ├─────────────────────────────────────────
      │     ▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃▃●
  0.5 ├─────────────────────────────────────────
      │
  0.0 └─────┬────────┬────────┬────────┬──────
        0   10       20       30       40    50
                          Tick

Description: Alloyed Guardian (Common) - stable price
Card value remains constant at 0.33 Ⓟ throughout 50-tick simulation
Quality maintained at 10.0
Desirability steady at 7.0
```

### Rising Price (Positive Trend)
```
Price (Ⓟ)
  5.0 ├─────────────────────────────────────●
      │                              ╱╱╱╱
  3.0 ├───────────────────────╱╱╱╱╱╱
      │              ╱╱╱╱╱╱╱
  1.0 ├─────────────╱╱╱
      │     ╱╱╱╱╱╱
  0.0 └─────┬────────┬────────┬────────┬──────
        0   10       20       30       40    50
                          Tick

Description: Card increasing in value
Market demand rising → price increased 5x over 50 ticks
Quality score improved with wins
Desirability trending upward
```

### Volatile Price (Multiple Fluctuations)
```
Price (Ⓟ)
  8.0 ├──────╲──╱╲──╱╲─────╱─●
      │       ╲╱  ╲╱  ╲   ╱
  4.0 ├────────────────╲─╱
      │          
  0.0 └─────┬────────┬────────┬────────┬──────
        0   10       20       30       40    50
                          Tick

Description: Volatile market
Card experiencing significant price swings
Possible factors: win/loss streaks, supply changes
Higher risk but potentially higher rewards
```

## Search Results Table Legend

| Column | Meaning | Example |
|--------|---------|---------|
| Card Name | Name of the card | "Alloyed Guardian" |
| Agent | Owner agent | "Agent 1" |
| Rarity | Card rarity | "Common", "Rare", "Mythic" |
| Color | Card color | "Ruby", "Sapphire", "Emerald" |
| Current Price | Market price | "0.33 Ⓟ", "5.50 Ⓟ" |
| Quality | Quality score | "10.0", "8.5", "6.2" |
| Price History | Data points | "📈 50 pts", "📈 30 pts" |

## Rarity Colors

| Rarity | Color | Background |
|--------|-------|------------|
| Common | Gray | #888888 |
| Uncommon | Green | #2d5016 |
| Rare | Blue | #3c6382 |
| Mythic | Orange | #9c3c0f |
| Player | Purple | #6b3b8a |
| Alternate Art | Gold | #c2a000 |

## Interactive Elements

### Search Input
```
[Search card name...                    ] [Search]
     │                                       │
     └─ Type to filter instantly            └─ Click to search
     └─ Press Enter to search               └─ Or press Enter
     └─ Case insensitive
     └─ Partial match supported
```

### Table Rows (Clickable)
```
┌──────────────────────────────────────────────────────┐
│ Card Name │ Agent │ Rarity │ Price │ History │       │
├──────────────────────────────────────────────────────┤
│ Alloyed G │ Ag 1  │ Common │ 0.33  │ 📈 50  │ ← Click│
└──────────────────────────────────────────────────────┘
     ↓ Click opens CardDetail modal with chart
```

### CardDetail Modal Actions
```
Alloyed Guardian [COMMON] [✕]
      ▲                      ▲
      └─ Card info         └─ Close button (click)
      
Price History Chart
     └─ SVG interactive chart
     └─ Shows full 50-point price history
     └─ Green line, red dot for current
```

## Keyboard Navigation

- **Search input**: Type to filter instantly
- **Enter**: Trigger search (if table modified)
- **Click row**: Open card detail
- **Click card**: Trigger chart display
- **Close button**: Close modal

## Mobile Considerations

The interface is responsive:
- **Large screen (1920px+)**: Full layout with 3-column view
- **Medium screen (1280px+)**: Two-column layout
- **Small screen (<768px)**: Single column, stacked layout
- Search results stack vertically on mobile

## Color Scheme

- **Background**: Dark theme (#1a1a2e, #16213e)
- **Text**: Light (#fff, #ddd, #aaa)
- **Accent**: Green (#4CAF50)
- **Chart**: Green line (#4CAF50), Red dot (#FF6B6B)
- **Borders**: Dark gray (#333)

## Data Point Examples

### 10-Tick Simulation
```
Tick  1  2  3  4  5  6  7  8  9 10
Prc  0.33 0.33 0.33 0.33 0.33 0.33 0.33 0.33 0.33 0.33
```

### 50-Tick Simulation (with price increase)
```
Tick  1  10  20  30  40  50
Prc  0.33 0.50 1.25 2.50 3.75 5.00
Chart shows nice upward slope from left to right
```

### 100-Tick Simulation (volatile)
```
Tick  1  25  50  75 100
Prc  1.0 3.5 2.0 4.5 2.5
Chart shows ups and downs across timeline
```

## Success Indicators

✓ Chart renders successfully when:
- Card has price_history data (2+ points)
- priceHistory array populated from API
- SVG renders without errors
- Price range calculated correctly
- Grid lines visible
- Current price indicator (red dot) visible

✗ If chart not showing:
- Check browser console for errors
- Verify price_history has data
- Try refreshing page
- Ensure simulation has 2+ ticks

## Usage Example Flow

```
1. USER ACTION: Run Simulation
   └─ Select 10 agents, 50 ticks
   └─ Click "Run"

2. SYSTEM: Simulation executes
   └─ Records 500+ price data points
   └─ Creates 50 × 10 card instances

3. USER ACTION: Type "Alloyed Guardian"
   └─ Search results appear instantly
   └─ 39 instances found

4. USER ACTION: Click first result
   └─ CardDetail modal opens
   └─ Price history chart renders
   └─ Shows 50 data points

5. USER VIEWS:
   └─ Flat line at 0.33 Ⓟ
   └─ Red dot at right edge (tick 50)
   └─ Quality: 10.0
   └─ Desirability: 7.0

6. USER INSIGHT:
   └─ Alloyed Guardian is stable Common card
   └─ Good quality, reliable desirability
   └─ Safe collectible, no price volatility
```

## Summary

The price history visualization provides:
- **Quick search** for any card by name
- **Complete price tracking** across all ticks
- **Interactive charts** showing trends
- **Rich metadata** (quality, desirability)
- **Intuitive UI** with dark theme
- **Responsive design** for all screen sizes
- **Performance optimized** SVG rendering

Users can analyze market dynamics and make informed decisions based on actual price history data!
