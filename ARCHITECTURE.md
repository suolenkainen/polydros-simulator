# How the Polydros simulator works

This file describes how the code works today, including the parts that don't
work the way their comments suggest. For setup and commands, see
[README.md](README.md).

## Layout

```
backend/main.py          FastAPI app: runs the engine, keeps the last result in memory
simulation/
  engine.py              SimulationConfig, run_simulation(): the tick loop, combat, pricing
  trading.py             Selling and buying phases, per-agent desirability scoring
  world.py               WorldState, Agent, Event, the marketplace
  types.py               Card, trait, price history and market snapshot dataclasses
  agents.py              Random trait generation
  booster.py             Opening a booster pack
  cards.py               Loads simulation/data/cards.json
  data/cards.json        The card list (120 cards); see "Card data" in README.md
  tests/                 pytest
frontend/
  src/api.ts             All calls to the backend
  src/components/        React views: runner, world, agents, inventory, market, events, card detail
  src/utils/, src/hooks/ Formatting, gem colours, pagination
  src/**/__tests__/      vitest
  tests/                 Playwright end-to-end tests
scripts/                 export_cards_from_excel.py (xlsx to cards.json; out of date, #33)
polydros_master_set_v1.xlsx   Master card list
run_all.ps1              Runs ruff, mypy and pytest, then starts backend and frontend
```

`simulation/` has no knowledge of HTTP. `backend/` only turns requests into a
`SimulationConfig` and returns the result.

## A run

`run_simulation(SimulationConfig(seed, initial_agents, ticks))` builds a world,
runs it for `ticks` ticks and returns one dict. Everything random comes from
`random.Random` instances seeded from `seed`: the engine's own RNG, and a
`rng_seed` per agent that each phase offsets (`rng_seed + tick + 1000` for
opening packs, `+ 2000` for playing, and so on). Same config, same result.

Setup:

- Agents get IDs from 1, 200 Prism each, and random traits (see below).
- The distributor starts with 10,000 booster packs.

Each tick, in this order:

1. **Buy boosters.** Each agent buys 5 packs for 12 Prism each (60 total) if it
   can afford them. Once an agent has 60 or more cards, it only buys when a
   random roll is below its `collector_trait`.
2. **Open boosters.** Each agent opens up to 5 packs. A pack has 7 Common,
   3 Uncommon, 1 Rare and 1 Player card, picked by `pack_weight`. There's a 5%
   chance per pack that the Rare becomes a Mythic, and each card has a 2%
   chance of being a hologram.
3. **Play.** Agents with 40 or more cards have a 50% chance to play. They pick
   a random opponent who also has 40 cards, and both use the first 40 cards of
   their collection. `calculate_combat_score()` decides the winner. Every card
   in both decks loses 1% quality. On a win, every card ID in the winner's deck
   gets +1% price and attractiveness, and every card ID in the loser's deck
   gets -1% (never below 0.01). These changes are per card ID, not per copy.
4. **Age packs.** Every 180 ticks, agents holding unopened packs get a
   `pack_age` event. Nothing else changes.
5. **Deck maintenance.** Every 20 ticks the engine tries to replace deck cards
   with a low feasibility score. In practice this never replaces anything (see
   "Known gaps").
6. **Trade.** Ticks 1, 4, 7, ... are selling phases; ticks 2, 5, 8, ... are
   buying phases. See "Trading".
7. **Record.** Every tracked card copy appends a price point, and the world
   stores a market snapshot (average price, standard deviation, trade count
   and volume for the tick).

## Agents and traits

`generate_agent_traits()` gives each agent four trait values. `collector_trait`
is between 0.10 and 0.50; `competitor_trait`, `gambler_trait` and
`scavenger_trait` are between 0 and 1. Agents also get a `primary_trait`,
`risk_aversion` and `time_horizon`, but no code reads those yet.

A trait "applies" to trading when its value is above 0.5. Because
`collector_trait` never goes above 0.50, the collector rules in `trading.py`
never apply.

## Two records of every card

This is the part most likely to confuse you. Each opened card is stored twice
on its agent:

| | `agent.collection` | `agent.card_instances` |
|---|---|---|
| Type | list of `CardInstance` | dict of `AgentCardInstance`, keyed by instance ID |
| Used by | booster rules (60 cards), combat (40 cards), quality loss, `full_collection` and `deck` in the result | trading, price history, market snapshots, `/agents/{id}/cards` |
| Quality | starts at 10.0, drops 1% per game | starts at 10.0, never changes |
| Moves when traded | no | yes |

The two are never synced. Combat wears down `collection` and changes the
per-card-ID prices in `WorldState.card_metadata`, but trading reads
`card_instances`, whose price only changes when a copy of that card sells. So
combat has no effect on the market, and a traded card still counts in the
seller's `collection`.

## Trading

The rules are in [simulation/trading.py](simulation/trading.py). The tuning
numbers (chances, thresholds, multipliers) live in the functions named below;
read them there instead of copying them into docs.

**Selling phase** (`build_sell_lists`, `execute_selling_phase`). Each agent
goes through its `card_instances`. A card goes up for sale if its quality is
below 3.0, if it has more than 3 losses, or if a trait-based random roll hits.
Only the first trait above 0.5 is checked, in the order scavenger, gambler,
collector, competitor; with none above 0.5, there's a small default chance.
The asking price starts from the card's `current_price` and is adjusted for
how short of Prism the agent is and for its traits. Scavengers always ask 15%
less. The minimum is 0.1 Prism.

A listed card stays in the seller's inventory until someone buys it.
Listings never expire, so unsold cards stay on the market for the rest of the
run.

**Buying phase** (`build_purchase_lists`, `execute_buying_phase`). Each agent
scores every listing it didn't post with `calculate_desirability_for_agent()`,
a 0 to 10 score from rarity, quality, price, affordability and traits. It
keeps the listings above its threshold (lower for gamblers and scavengers),
sorted best first. Agents then take turns in a random order, which is seeded
from the tick. On its turn, an agent buys the first listing on its list that
is still available and that it can afford, then stops: at most one purchase
per agent per buying phase.

**A sale** (`WorldState.buy_from_marketplace`) moves the card copy to the
buyer, moves the Prism, and sets the price of every copy of that card ID, on
every agent, to the average of its old price and the sale price.

## Card prices

A new card copy's price comes from `calculate_card_price()` in `engine.py`:
the card's `base_price` times multipliers for rarity, scarcity (from
`pack_weight`) and quality. After that, only sales change it (see above).

## Price history

At the end of each tick, `WorldState.record_price_points()` calls
`record_price_point()` on every `AgentCardInstance`. That recalculates the
copy's desirability and condition, then appends
`{tick, price, quality_score, desirability}` to its `price_history`. A card
opened on tick 5 of a 50-tick run has 46 points. The history travels with the
copy when it's traded. The frontend draws it as an SVG chart in
`CardDetail.tsx`.

## The result

`run_simulation()` returns:

- `config`: the `SimulationConfig` as a dict.
- `timeseries`: one entry per tick, from tick 0. Each has world counts
  (`agent_count`, `total_cards`, `distributor_boosters`,
  `total_unopened_boosters`) and, from tick 1, that tick's `events` and a
  `market_snapshot`.
- `final`: the world counts after the last tick.
- `agents`: per agent, `id`, `name`, `nick`, `prism`, `rng_seed`, `traits`,
  `collection_count`, `booster_count`, `full_collection` (from `collection`),
  `card_instances` (with price history), `deck` (40 cards built by
  `build_deck()`) and `agent_events`.
- `events`: every event. `event_type` is one of `booster_purchase`, `combat`,
  `play` (no opponent available), `pack_age`, `card_listed` or
  `card_purchased`.

## API

The backend keeps only the most recent run, in memory. It's lost when the
server restarts.

| Endpoint | Returns |
|---|---|
| `POST /run` | Runs a simulation. Body: `{"seed": 42, "agents": 5, "ticks": 1}` (these are the defaults). Returns the whole result. |
| `GET /agents` | `{"agents": [...]}` from the last run |
| `GET /agents/{id}` | `{"agent": {...}}` |
| `GET /agents/{id}/traits` | `{"traits": {...}}` |
| `GET /agents/{id}/cards` | The agent's `card_instances`, with price history |
| `GET /agents/{id}/events` | Events where the agent was the main actor |
| `GET /agents/{id}/collection` | Meant to be a rarity breakdown; currently returns empty fields |

With no run yet, or an unknown agent ID, the endpoints return
`{"error": "..."}` with status 200, not 404. FastAPI's own docs are at
`http://127.0.0.1:8000/docs` while the backend runs.

## Known gaps

These are real behaviour, not doc mistakes.

- The two card records described above are never synced, so combat doesn't
  affect trading, prices or price history ([#27](https://github.com/suolenkainen/polydros-simulator/issues/27)).
- `win_count` and `loss_count` are never increased. Every rule that depends on
  them (loss-based selling, competitor scoring, card condition) never fires
  ([#28](https://github.com/suolenkainen/polydros-simulator/issues/28)).
- The booster-buying roll and the play roll use the same seed
  (`rng_seed + tick + 2000`), so they are the same number. Whether an agent
  buys packs after 60 cards and whether it plays that tick are linked
  ([#29](https://github.com/suolenkainen/polydros-simulator/issues/29)).
- Deck maintenance looks cards up by card ID in a dict keyed by instance ID,
  so it never finds anything to replace. Combat doesn't use `build_deck()`
  either; it takes the first 40 cards of `collection` ([#30](https://github.com/suolenkainen/polydros-simulator/issues/30)).
- `collector_trait` tops out at 0.50, but the trading rules check for above
  0.5, so the collector rules never apply ([#31](https://github.com/suolenkainen/polydros-simulator/issues/31)).
- `GET /agents/{id}/collection` reads fields the engine doesn't produce, and
  errors come back as status 200 ([#32](https://github.com/suolenkainen/polydros-simulator/issues/32)).
