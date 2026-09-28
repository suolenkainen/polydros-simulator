# What Polydros is for

Polydros simulates the market of a collectible card game. Players buy cards in
booster packs, then play with them or trade them. The simulator answers one
question: **given this card set and these pack rates, what will each card be
worth, and why?**

This file says what the simulator must do. How it does it goes in
`docs/design.md`.

## The idea

A card's price comes from how much players want it. Two things drive that:

- **Rarity.** Rarer cards are scarcer, so they cost more.
- **Combat strength.** Cards that win more, alone or together with other cards,
  cost more.

Different kinds of players want different things, so they value the same card
differently. The market is where those views meet and set a price.

## What it must do

### 1. Browse the card set

See every card with its picture, rarity, cost, stats, type and flavour text.
This works from the card data alone, without running a simulation.

### 2. Rate cards in combat

Play a chosen number of games between decks and measure how often each kind of
deck wins: "a deck with this set of cards wins X of Y games".

Strength comes from **groups of cards**, not single cards. A group can matter
far more as a whole than as the sum of its parts, and groups come in different
sizes depending on the style of play: two cards may be a strong pair, while
another combination only works once all 3, or all 5, of its cards are in the
deck. A partial group barely helps. The rating has to find groups like that,
whatever their size, and the win rates of decks built around a group then
raise the value of every card in the group.

- Start with **abstract combat**: a strength score calculated from card stats,
  without real game rules. Even abstract combat has to model group effects,
  since that's what drives value.
- Later, switch to **real card mechanics**, the actual rules of the game. The
  rest of the simulator shouldn't need to change when that happens.
- Combat rating runs **before** the market. Its scores are an input to the
  market run.

### 3. Simulate the market

Players open packs, play, and buy and sell cards over time. The market turns
their demand into a price for each card.

Money: a player who sells a card gets what the card is worth. Players also
need an income, or they run out of money and stop buying packs. How income
works is still to be designed (see open questions).

Player types, all four needed:

| Type | Wants |
|---|---|
| Competitive | Cards that win. Buys strong cards, sells weak ones. |
| Collector | Rare cards and complete sets. Rarely sells. |
| Trader | Profit. Buys cheap, sells expensive. |
| Casual | Opens packs, plays a bit, sells duplicates. |

### 4. Show the results

After a run, you must be able to see:

- **Card prices over time**, and what moved them.
- **The strongest cards**, alone and in combinations.
- **Rarity against value**: whether pack rates and rarities give sensible
  prices. For example, a Common that's too strong should become expensive.
- **Player outcomes**: how each type of player did (money, collection, wins).

The most important view is **one card over time: its market value next to its
combat strength**. Other views come after that.

## Constraints

- **Scale:** a run must handle thousands of players, and more if possible.
- **Stable:** the same inputs and seed always give the same result.
- **Fast:** big runs should finish in minutes, not hours. (Exact targets go in
  the design.)

## Open questions

- **Combat strength over time.** Combat rating runs before the market, so each
  card's combat score is fixed during a run. But the main view shows combat
  strength over time next to price. Which is it?
  - (a) Combat strength is fixed for a run, and the view shows it as a flat
    reference line next to the price.
  - (b) Combat strength changes during a run, because what's strong depends on
    what other players are playing (the "meta"). Then the market needs to
    re-rate cards during the run.
- **How groups are found.** The current idea: cards carry labels (for example
  a type, faction or keyword) that make them work together. Nobody decides
  which groups are strong. That shows up when games are played dozens of
  times: decks with certain cards just win more often. Later, cards get
  special abilities, and those drive the group effects instead. Still open:
  what the labels are, and how abstract combat turns them into winning.
- **Income.** What keeps players able to buy packs: a fixed income per tick,
  income from winning games, or something else? It has to keep the market
  moving without flooding it with money.
- **Card data.** Nobody knows yet whether `polydros_master_set_v1.xlsx` or
  `cards.json` is right; the plan for the game may differ from both. The
  simulator should treat the card set as an input it checks when loading, so
  it's easy to change once the real card set is decided. See #33.

## Later

- **Special prints.** A tournament can publish a special print of a card that
  enters the market mid-run.
- **Real card mechanics** in combat (see "Rate cards in combat").
