# What the code does today

An inventory of the current code, written before the redesign (#39). For each
part it says what exists, whether it works, and whether it's worth keeping.
Compare with [product.md](product.md), which says what the simulator should
do.

"Works" means it does what its name and comments say. It doesn't mean it's
the right design.

## Summary

Most of the pieces exist in some form, but they aren't connected. Combat
doesn't affect the market, the Market view doesn't show the market, and the
card browser has no cards on a fresh checkout. Nothing in the current code
rates card groups, which is the core of the product.

Worth keeping: the card data (once #33 is sorted), the pack-opening logic,
seeding everything from one config seed, and parts of the frontend's card
display. Everything else should be redesigned rather than repaired.

## Simulation (`simulation/`)

| Feature | State | Keep? |
|---|---|---|
| **Card data.** 120 cards in `cards.json`: name, colour, type, rarity, gem cost, power, health, pack weight, holo chance, base price, flavour text. | Works, but the export script no longer produces this file (#33). No labels or abilities yet. | Keep as input. Needs a checked format and the labels from product.md. |
| **Boosters.** 12 cards per pack by rarity, weighted by `pack_weight`, 5% rare-to-mythic upgrade, 2% hologram. | Works. | Keep the logic; it's small and clear. |
| **Seeding.** Every random choice comes from generators seeded from the config seed. | Works, but seeds are built by adding offsets, and two of them collide (#29). | Keep the idea: one seed, each part gets its own stream. |
| **Agents and traits.** 200 Prism each, four trait values, plus `primary_trait`, `risk_aversion` and `time_horizon`. | The last three are never read. `collector_trait` can't reach the level where collector trading rules apply (#31). | Redesign around the four player types in product.md. |
| **Buying boosters.** 5 packs a tick until 60 cards, then only on a collector roll. | Works. There's no income, so agents run out of money. | Redesign with the income system. |
| **Combat.** Two agents' first 40 cards; a score from power, health and gem cost decides the winner. | Runs, but its results never reach the market or price history (#27), and win/loss counts are never recorded (#28). No card groups. | Replace with the combat rating engine. |
| **Decks.** `build_deck()` with rarity quotas; deck maintenance every 20 ticks. | Combat doesn't use the built deck, and maintenance never replaces anything (#30). | Replace. |
| **Card wear.** Each game costs every card in both decks 1% quality. | Applies to only one of the two card records (#27). | Drop unless the product needs it. |
| **Market.** List cards, score listings per agent, buy one card per agent per phase, set price to the average of old price and sale price. | Works on its own, but with no link to combat. Listings never expire. | Replace. Pricing needs its own design. |
| **Price history.** One point per card copy per tick. | Works, but per copy doesn't scale to thousands of players. | Replace with per-card history. |
| **Market snapshots.** Average price, spread, trade count and volume per tick. | Works. | Keep the idea. |
| **Events.** One event per purchase, listing, game and pack. | Works, but too many to be useful at scale. | Replace with summaries. |

## Backend (`backend/main.py`)

| Feature | State | Keep? |
|---|---|---|
| **`POST /run`** runs a whole simulation and returns everything. | Works. Keeps only the last run, in memory. | Redesign. Big runs need to run in the background and return summaries. |
| **`GET /agents...`** reads agents from the last run. | Works, except `/collection`, which is always empty. Errors return status 200 (#32). | Redesign with the results the product needs. |

## Frontend (`frontend/`)

Everything sits on one page, in this order.

| Feature | State | Keep? |
|---|---|---|
| **Runner.** Seed, agents and ticks fields; Run and Reset buttons. | Works, but "run N more ticks" reruns the whole simulation from tick 0. State is kept in `sessionStorage`. | Redesign. |
| **Card browser.** A dropdown of all cards that opens the card detail. | Replaced in milestone 1 by the Cards tab (`frontend/src/cards/`), and removed. | Done. |
| **Card detail.** Picture, rarity, colour, cost, power, defence, flavour text, price, quality. | Still used from an agent's collection. Pictures now come from the API. "Features" is placeholder lorem ipsum. No price history chart. | Goes with the old page; the new card view replaces it. |
| **World overview.** Tick, agent count, cards opened, unopened boosters. | Works. "Approx. total boosters created" is estimated by dividing cards by 12. | Replace with the result views. |
| **Events list.** All events with a type filter, search and pages. | Works. | Drop; too much at scale. |
| **Market.** Card grid with search, filters, sort and pages. | Doesn't show the market. It lists every card every agent owns as "for sale", and shows 12 made-up cards when there's no data. | Drop. |
| **Agent list.** A button per agent. | Works. Polls `/agents` every 2 seconds for as long as the page is open. | Redesign as player-outcome views. |
| **Agent detail.** Prism, traits with descriptions, deck table, events, and the agent's card collection. | Works. The trait descriptions don't match what the traits do in the code. | Redesign. |
| **Agent card collection.** Table with search, filters, sort; each row expands to a small chart of the last 10 prices. | Works. | Keep the mini chart idea for the card-over-time view. |
| **`GlobalCardSearch.tsx`**, a search across all agents' cards. | Not used: nothing imports it. | Drop. |
| **`utils/agentBehavior.ts`**, trait logic in TypeScript. | Not used: nothing imports it. | Drop. |
| **Helpers.** Gem colours, price formatting, pagination hook. | Work, with unit tests. | Keep. |

## Tests

- **Python:** 50 tests in `simulation/tests/`. They check the current code's
  behaviour, including behaviour that's wrong, so they go with the code. The
  ideas worth carrying over: same seed, same result (`test_determinism.py`),
  and money never goes negative (`test_prism_negative.py`).
- **Frontend unit tests (vitest):** 82 tests; 81 pass. The failing one looks
  for a "Buy Now" button that `MarketBlock.tsx` doesn't have, so the test is
  out of date (#36). Vitest also picks up the Playwright specs by mistake
  (#37).
- **Playwright:** 46 tests in `frontend/tests/`, written against the current
  page. They go with the frontend they test.
