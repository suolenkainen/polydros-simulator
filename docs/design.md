# How the new Polydros is built

This file says how the simulator in [product.md](product.md) gets built: the
parts, what each one owns, how data moves between them, and the order to
build them in. [current-features.md](current-features.md) says what exists
today.

Only the first milestone is designed in detail. Each later one gets designed
when we reach it, using what the earlier ones taught us.

## How we work on it

- **Prove the core idea first.** The product rests on one idea: card groups
  win more, so they become worth more. Build the smallest thing that tests it
  before building what depends on it.
- **Thin working slices.** Every milestone ends with something that runs and a
  test that shows it does what it's for. No milestone leaves half-built parts
  for a later one to finish.
- **New code next to the old.** The new code goes in a new package,
  `polydros/`. The old `simulation/`, `backend/` and frontend pages keep
  working until something replaces them, then they're deleted. We don't
  refactor the old code.
- **Answer open questions with experiments.** When we don't know how
  something should behave (how labels create group strength, how income
  works), build the smallest version, run it, and look at the numbers.

## The parts

```
card set ──► combat rating ──► pricing ◄── market (players, packs, trades)
   │               │              │                 │
   └───────────────┴──────► results files ◄─────────┘
                                  │
                         API ──► frontend
```

Each part owns one thing, and nothing else does that thing.

| Part | Owns | Input | Output |
|---|---|---|---|
| **Card set** (`polydros/cards`) | What cards exist: stats, rarity, labels, pack rates. | The card file. | A checked card set. Refuses to load a bad file, and says what's wrong. |
| **Combat rating** (`polydros/combat`) | The rules of a game, and measuring what wins. | Card set, number of games, seed. | Win rates per card and per group. |
| **Pricing** (`polydros/pricing`) | Turning supply and demand into a price. | Card set, ratings, market state. | A price per card. |
| **Market** (`polydros/market`) | Players, money, packs and trades over time. | Card set, ratings, player mix, seed. | Prices and holdings over time. |
| **Results** (`polydros/results`) | What a run leaves behind. | Everything above. | Files on disk that the API and frontend read. |
| **API and frontend** | Showing things. No simulation logic. | Card set, results files. | The card browser and result views. |

Rules that follow from the table:

- **Combat doesn't know about prices, and pricing doesn't play games.**
  Pricing only sees ratings.
- **The rules of a game sit behind one function**, roughly
  `play(deck_a, deck_b, rng) -> winner`. Abstract combat is the first version.
  Real card mechanics replace it later without changes elsewhere.
- **The rating doesn't read the rules.** It only sees decks and who won, and
  finds strong groups from that. That's what lets it keep working when the
  rules change.
- **The frontend never calculates simulation results.** It shows what the
  engine wrote.

## Across all parts

- **One seed per run.** Each part gets its own random stream from it, using
  numpy's `SeedSequence.spawn()`. Adding a random draw in one part then can't
  change the results of another.
- **Built for scale from the start.** Card copies and players are rows in
  numpy arrays, and a tick is calculated for all players at once, not in a
  loop over player objects. History is kept per card, not per card copy.
  Summaries replace one event per action.
- **The engine is a library with a command line**, for example
  `python -m polydros rate --games 100000`. Big runs don't need the server.
- **Tests prove behaviour.** Each milestone names the test that shows it
  works. Those are the tests that matter; others are optional.

Speed targets, to measure against rather than promise: rating 100,000 games in
under a minute, and a market run of 10,000 players over a simulated year in a
few minutes.

## Milestones

### 1. Card set and card browser

**Builds:**

- **One card file**, `polydros/data/cards.json`, holding what `cards.json`
  holds today plus `labels`: a list of words that describe what a card works
  with. To start, each card's labels are its colour and its type (for example
  `["Ruby", "Creature"]`), since we don't have real ones yet. Card groups in
  milestone 2 are built from labels.
- **A loader** that checks every card: required fields present, rarity known,
  numbers in range, IDs unique. A bad file fails to load with a message naming
  the card and the field.
- **API:** `GET /cards` returns the card set; `GET /cards/{id}/image` returns
  the picture from the `images/` folder at the repo root, or 404.
- **Frontend:** a card browser page: all cards with their pictures, filter by
  colour, type and rarity, and a detail view with stats and flavour text. It
  gets everything from the API, so there's only one copy of the card list.
  This fixes #48.

**Done when:** from a fresh start, the browser shows all 120 cards with
pictures, and loading a card file with a mistake in it fails with a clear
message. `README.md` says where to get the `images/` folder.

**Not in it:** deciding which card data is right (#33). The loader makes the
card file easy to change once that's decided. The old export script stays
unused until then.

### 2. Combat rating

**Builds:** abstract combat and the rating.

- **Abstract combat:** a deck's strength comes from its cards' stats plus
  group bonuses. A group is a rule like "at least N cards with label X" or
  "these specific cards together". Each group has its own size N, and only
  pays off once the deck has all N. The groups for testing live in a rules
  file that only the combat function reads.
- **The rating:** generate many decks, play many games, and measure win rates.
  Compare decks that contain a candidate group with decks that don't, to find
  which groups matter and at what size.

**Test data:** the tests use small made-up card sets (about 20 cards) written
by hand in `polydros/tests/`, with planted groups. With the real cards nobody
knows which groups should win, so a test couldn't check the answer. Real runs
use the full card set unchanged: leaving cards out (for example the expensive
ones) would describe a different game, and 120 cards isn't what makes runs
slow. For quick experiments on part of the set, the command line takes
filters such as `--only-colour Ruby` or `--max-cost 3`.

**Done when:** we plant groups of different sizes in a test set (a pair, a
group of 3, a group of 5), and the rating finds each at its own size, and
shows little gain for partial groups. With no planted groups, it finds none.

**Hard part:** there are far too many possible card combinations to test all
of them. The design for this milestone has to decide how candidate groups are
chosen (by label first, then specific cards). That's the main open question
for this milestone.

### 3. Price model v0

A price per card from supply (how often it comes out of packs) and demand
(its rating). No players or time yet.

**Done when:** a Common that's too strong ends up priced above a weak Rare.

### 4. Market

Players of the four types, an income, packs and trades, over time, for
thousands of players. Pricing from milestone 3 runs inside it.

**Done when:** the same seed gives the same prices, and changing the card set
moves prices the way milestones 2 and 3 predict.

### 5. Result views

Starting with the main one: one card's price and combat strength over time.
Then strongest cards and groups, rarity against value, and player outcomes.

**Done when:** you can pick a card and see why it got expensive.

## What happens to the old code

- `simulation/` and `backend/main.py` stay until milestone 4 replaces them,
  then they're deleted along with their tests.
- The old frontend page stays until the new views cover what's worth keeping
  from it (see current-features.md), then it goes too.
- Issues #27 to #32 describe the old code's problems. They get closed once
  the old code is deleted, since the new design doesn't have those parts.

## Open questions

- **How candidate groups are chosen** in the rating (milestone 2).
- **Real labels.** Colour and type are placeholders. What labels the real
  cards have is a game design question.
- **Income** (milestone 4): what keeps players buying packs without flooding
  the market with money.
- **Combat strength over time** (milestone 5): fixed for a run, or changing
  as players adapt? See product.md.
