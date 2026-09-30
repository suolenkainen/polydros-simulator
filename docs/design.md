# How the new Polydros is built

This file says how the simulator in [product.md](product.md) gets built: the
parts, what each one owns, how data moves between them, and the order to
build them in. [current-features.md](current-features.md) says what exists
today.

Only the first two milestones are designed in detail. Each later one gets
designed when we reach it, using what the earlier ones taught us.

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
of them. Worse, a group that only pays off when complete gives no signal from
its parts: in a group of 5, no pair or triple wins more than any other. So the
rating can't find big groups by growing them from small ones. The design below
gets around that by letting decks improve until they contain whole groups, and
then checking each suspected group with a controlled experiment.

#### Combat

`polydros/combat/rules.py` reads a rules file (JSON) and plays games. It's
the only code that reads the rules file.

```json
{
  "deck_size": 8,
  "luck": 4.0,
  "groups": [
    {"name": "twins", "cards": ["T01", "T02"], "bonus": 6},
    {"name": "ruby pack", "label": "Ruby", "at_least": 3, "bonus": 5}
  ]
}
```

- A deck is `deck_size` different cards. No duplicates yet.
- A deck's strength is the sum of `power + health` over its cards, plus the
  `bonus` of every group it completes. A card group is complete when all its
  cards are in the deck; a label group when at least `at_least` cards carry
  the label. An incomplete group adds nothing.
- The stronger deck doesn't always win. Deck A wins with probability
  `1 / (1 + exp(-(strength_a - strength_b) / luck))`, drawn from the rng.
  `luck` sets how much a strength gap matters.
- `play(deck_a, deck_b, rng) -> winner` plays one game. `play_many(decks_a,
  decks_b, rng)` plays a batch at once on numpy arrays: decks are rows of a
  yes/no matrix (deck by card), so strength is a matrix product plus a check
  per group. The rating only calls `play_many`. A test checks that both give
  the same win probability for the same pair of decks.
- Card cost is ignored for now, so a deck of the biggest cards is strongest on
  stats alone. That's fine for finding groups, and it gets revisited with real
  card mechanics.

#### The rating

`polydros/combat/rating.py` gets the card set, a way to play games, a game
budget and a seed. It never sees the rules. It works in rounds, and each
round has two steps.

1. **Search.** Keep a population of decks (for example 400). Each generation,
   every deck plays a few games against random others. The winning half
   stays, and the losing half is replaced by copies of winners with one or
   two cards swapped at random. After some generations the top decks contain
   whole groups, because only whole groups win. One population sometimes
   settles on a deck without the group and never finds it, so each round
   runs a few populations (for example 4) from different seeds. Then:
   - **Card candidates:** in every population, find cards that show up far
     more often in the top decks than in random decks (for example 1.6 times
     as often), and split them into sets that show up together. Each set is
     a candidate.
   - **Label candidates:** for each label and each count N, compare decks
     with exactly N cards of that label with decks that have N - 1. A label
     group shows a jump in win rate at its own N. There are few labels, so
     every label and N gets checked.
2. **Confirm.** Search is biased: it picks what looked good in its own games.
   So each candidate is checked again with fresh games from a separate
   random stream. Take random base decks and make versions of each: one with
   the whole candidate, one per candidate card with that card swapped for a
   random card outside the candidate (the partial groups), and one with none
   of it. Every version plays the same random opponents. The gain of the
   group is the win rate with the whole group minus the win rate with the
   best partial one.
   - A candidate is **found** if the lower end of the gain's 95% interval is
     above a minimum (for example 3 percentage points). The interval is
     widened for the number of candidates checked (Bonferroni), so running
     more checks doesn't make false finds more likely.
   - Search may pick up extra cards that only happened to be in winning decks.
     So after a find, each card is dropped in turn, and if the gain doesn't
     fall, it stays dropped. What's left is the group at its own size.

In the next round, search decks can't contain any group already found (for a
label group, they can't reach its count). Otherwise the population keeps
finding the strongest group again and never looks for the next one. The
rating stops when a round finds nothing or the game budget runs out.

**Output:** the found groups, each with its cards or label and count, its
gain and interval, and how much its best partial version wins over having
none of it. Also a lift per card: the win rate of random decks with the card
minus without it. Pricing in milestone 3 reads these.

**Seeds:** the run's seed is split with `SeedSequence.spawn()` into one
stream for search (split again for each population) and one for confirm. The
same seed and budget always give the same output.

#### Tests

Hand-written card sets of 20 cards live in `polydros/tests/combat/`, each
with its own rules file:

- **planted:** a pair, a group of 3 and a group of 5 (different cards), plus
  a label group of 3 on a label nothing else uses. The rating finds all four
  at their own size, with no extra cards. Each one's best partial version,
  measured against having none of it, gains less than a quarter of what the
  whole group gains.
- **none:** the same cards and no groups. The rating finds nothing.
- A planted group's bonus must be clearly bigger than the stats its cards
  give up against the strongest other cards. If it isn't, the group isn't
  worth playing, and not finding it is the right answer.
- Smaller tests: a group pays only when complete, `play` and `play_many`
  agree, and the same seed gives the same result.

Each of the two main tests must run in under 10 seconds, so they can run in
CI. A rough prototype of search took 8 to 18 seconds for the planted set, with
the deck changes still in a Python loop, so search has to do those on arrays
too.

#### Command line

`python -m polydros rate --rules RULES --games N --seed S` prints the found
groups and card lifts, and `--out FILE` writes them as JSON. `--only-colour`
and `--max-cost` limit the cards the rating uses. The real card set has no
planted groups yet: `polydros/data/rules.json` starts with a deck size and no
groups, so a real run only measures stats until real labels and groups exist.

#### Order of work

Each step is its own PR, with its tests:

1. Rules file, `play` and `play_many`. Adds numpy to `requirements.txt`.
2. Confirm, tested by giving it the planted groups (and wrong guesses) as
   candidates.
3. Search and rounds, which finish the two main tests.
4. The command line, and a check against the speed target.

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

- **Deck size and copies.** Milestone 2 uses decks of different cards, with
  the size set in the rules file. How big a real deck is, and how many copies
  of a card it can hold, is a game design question.
- **Real labels.** Colour and type are placeholders. What labels the real
  cards have is a game design question.
- **Income** (milestone 4): what keeps players buying packs without flooding
  the market with money.
- **Combat strength over time** (milestone 5): fixed for a run, or changing
  as players adapt? See product.md.
