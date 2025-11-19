"""Simulation engine (minimal scaffold).

This module provides a small, deterministic runner used by the backend and
unit tests. It follows the project's requirements for RNG seeding and
reproducibility.
"""

import random
from dataclasses import dataclass
from typing import TYPE_CHECKING, Dict, List

from .agents import generate_agent_traits
from .booster import open_booster
from .cards import large_card_pool
from .world import Agent, Event, WorldState

if TYPE_CHECKING:
    from .types import CardRef, CardInstance


def calculate_card_price(card_ref: "CardRef") -> float:
    """Calculate market price for a card based on rarity, frequency, and quality.

    Price calculation:
    - Rarity multiplier: increases price for rarer cards
    - Appearance/pack_weight: lower appearance = higher price (scarcity premium)
    - Quality: higher quality increases price

    Formula: base_price * (rarity_mult * scarcity_mult * quality_mult)
    """
    # Rarity multipliers
    rarity_multipliers = {
        "Common": 1.0,
        "Uncommon": 1.5,
        "Rare": 3.0,
        "Mythic": 8.0,
        "Player": 1.0,
        "Alternate Art": 6.0,
    }
    rarity_mult = rarity_multipliers.get(card_ref.rarity.value, 1.0)

    # Scarcity multiplier based on pack_weight (appearance frequency)
    # Lower pack_weight = rarer = higher price
    scarcity_mult = max(0.5, 100.0 / max(card_ref.pack_weight, 1.0))

    # Quality multiplier (scales around 1.0)
    # quality_score typically 0-100, normalize to price multiplier
    quality_mult = 1.0 + (card_ref.quality_score - 50.0) / 100.0
    quality_mult = max(0.5, min(2.0, quality_mult))

    # Final calculation: base_price * (rarity_mult * scarcity_mult * quality_mult)
    # Scale down by 0.1 for reasonable prices
    return (
        card_ref.base_price
        * rarity_mult
        * scarcity_mult
        * quality_mult
        * 0.1
    )


def build_deck(collection: List, rng: random.Random, deck_size: int = 40) -> List[Dict]:
    """Build a deck with 40 cards: 1 player, 4 mine, and 35 other cards.

    Args:
        collection: list of CardInstance objects to select from
        rng: random number generator for shuffling
        deck_size: total deck size (default 40)

    Returns:
        list of deck card dicts with name, color, power, health, cost
    """
    if len(collection) < deck_size:
        # If collection is too small, use what we have
        deck_cards = collection
    else:
        # Shuffle and pick deck_size cards
        shuffled = list(collection)
        rng.shuffle(shuffled)
        deck_cards = shuffled[:deck_size]

    deck = []
    for card_inst in deck_cards:
        ref = card_inst.ref
        # Calculate cost as gem_colored + gem_colorless (stored in the raw card data)
        # For now, we'll use a placeholder since CardRef doesn't expose gem fields
        # We'll need to update CardRef to include these fields
        deck.append({
            "card_id": ref.card_id,
            "name": ref.name,
            "type": ref.type,
            "color": ref.color,
            "power": getattr(ref, 'power', 0),  # Will be added to CardRef
            "health": getattr(ref, 'health', 0),  # Will be added to CardRef
            "cost": getattr(ref, 'cost', 0),  # Will be added to CardRef
        })

    return deck


def degrade_card_quality(card: "CardInstance", degradation: float) -> None:
    """Degrade a card's quality by a percentage amount.

    Args:
        card: CardInstance to degrade
        degradation: degradation amount (1.0 = 1%, so 0.01 = 1% reduction)
    """
    current_quality = card.effective_quality()
    new_quality = current_quality * (1.0 - degradation)
    card.quality_score = new_quality


def calculate_combat_score(deck: List["CardInstance"]) -> float:
    """Calculate total combat score for a deck.

    Score is computed as: sum of (card_power/total_gems) - (card_health/total_gems)
    where total_gems is the sum of all gem costs in the deck.

    Args:
        deck: list of CardInstance objects in the deck

    Returns:
        total combat score (can be positive or negative)
    """
    if not deck:
        return 0.0

    # Calculate total gems (gem_colored + gem_colorless)
    total_gems = sum(
        card.ref.gem_colored + card.ref.gem_colorless for card in deck
    )
    if total_gems == 0:
        # Avoid division by zero; if no gems, score is average power - health
        return sum(card.ref.power - card.ref.health for card in deck)

    # Calculate score: attack contribution minus defence contribution
    score = 0.0
    for card in deck:
        # Attack (power) contributes positively
        attack_contribution = card.ref.power / total_gems
        # Defence (health) subtracts from opponent
        defence_contribution = card.ref.health / total_gems
        score += attack_contribution - defence_contribution

    return score
@dataclass
class SimulationConfig:
    seed: int = 42
    initial_agents: int = 10
    ticks: int = 1


def run_simulation(config: SimulationConfig) -> Dict:  # noqa: C901
    """Run a minimal deterministic simulation.

    The runner is intentionally small: it creates agents with realistic starting
    Prism, advances `ticks` times with market logic. Agents buy boosters from
    the distributor, open them, and track events.

    Returns a dictionary containing summary time-series and final world state
    metadata.
    """
    rng = random.Random(config.seed)

    pool = large_card_pool()

    world = WorldState()

    # Distributor initially owns a large supply of boosters
    # (agents will buy from them each tick)
    world.distributor_boosters = 10000

    # Create agents with realistic starting Prism and deterministic per-agent RNG seeds
    # Each agent starts with exactly 200.00 Prism
    for pid in range(config.initial_agents):
        traits = generate_agent_traits(rng)
        seed = rng.randint(0, 2 ** 31 - 1)
        starting_prism = 200.00  # 200.00 Prism per agent
        agent = Agent(
            id=pid,
            prism=round(starting_prism, 2),
            traits=traits,
            name=f"Agent-{pid}",
            nick=f"A{pid}",
            rng_seed=seed,
            boosters=0,
        )
        world.agents[pid] = agent

    # Collect time-series (simple: only initial snapshot + tick summaries)
    timeseries: List[Dict] = []
    timeseries.append({"tick": 0, **world.summary()})

    # Cost parameters
    BOOSTER_COST = 12.0  # 12 Prism per booster pack

    # Advance ticks: agents buy boosters from distributor and open some
    for t in range(1, config.ticks + 1):
        world.tick = t

        # Buying phase: each agent buys boosters based on collector trait
        # - Before 60 cards: always buy 5 packs
        # - After 60 cards: only buy if collector trait triggers (random chance)
        for agent in world.agents.values():
            buy_count = 5

            # Check if agent already has 60+ cards
            if len(agent.collection) >= 60 and agent.traits is not None:
                # After 60 cards, use collector trait to determine if they buy
                a_rng = random.Random(agent.rng_seed + t + 2000)
                collector_roll = a_rng.random()

                if collector_roll >= agent.traits.collector_trait:
                    # Collector trait did NOT trigger, skip purchase
                    continue
                # else: collector trait triggered, proceed with purchase

            cost = buy_count * BOOSTER_COST
            # Only buy if agent has enough Prism and distributor has enough boosters
            if world.distributor_boosters >= buy_count and agent.prism >= cost:
                agent.add_boosters(buy_count)
                world.distributor_boosters -= buy_count
                agent.prism -= cost
                agent.prism = round(agent.prism, 2)  # Round to 2 decimals

                # Log event with trait info if applicable
                if (len(agent.collection) >= 60 and agent.traits is not None):
                    trait_str = f"{agent.traits.collector_trait:.0%}"
                    description = (
                        f"{agent.name} bought {buy_count} booster"
                        f"{'s' if buy_count > 1 else ''} for {cost} Prism "
                        f"(collector trait triggered: {trait_str})"
                    )
                else:
                    description = (
                        f"{agent.name} bought {buy_count} booster"
                        f"{'s' if buy_count > 1 else ''} for {cost} Prism"
                    )

                event = Event(
                    tick=t,
                    agent_id=agent.id,
                    event_type="booster_purchase",
                    description=description,
                    agent_ids=[agent.id],
                )
                world.add_event(event)

        # Opening phase: agents open some of their boosters
        default_open = 5
        for agent in world.agents.values():
            open_count = min(default_open, agent.boosters)
            if open_count <= 0:
                continue
            a_rng = random.Random(agent.rng_seed + t + 1000)
            for _ in range(open_count):
                cards = open_booster(pool, a_rng)
                agent.add_cards(cards)
                agent.remove_boosters(1)

        # Play phase: agents play games with their decks, degrading card quality
        for agent in world.agents.values():
            if len(agent.collection) < 40:
                # Can't play without a deck
                continue

            # Use seeded RNG to decide if agent plays this tick
            a_rng = random.Random(agent.rng_seed + t + 2000)
            play_chance = a_rng.random()

            # Play if random roll is less than 0.5 (50% chance per tick)
            if play_chance < 0.5:
                # Pick a random opponent from other agents
                other_agents = [a for a in world.agents.values()
                                if a.id != agent.id and len(a.collection) >= 40]

                if other_agents:
                    # Use seeded RNG for opponent selection
                    opponent_rng = random.Random(agent.rng_seed + t + 2001)
                    opponent = opponent_rng.choice(other_agents)

                    # Build decks (40 cards)
                    if len(agent.collection) >= 40:
                        player1_deck = agent.collection[:40]
                    else:
                        player1_deck = agent.collection

                    if len(opponent.collection) >= 40:
                        player2_deck = opponent.collection[:40]
                    else:
                        player2_deck = opponent.collection

                    # Calculate combat scores
                    player1_score = calculate_combat_score(player1_deck)
                    player2_score = calculate_combat_score(player2_deck)

                    # Determine winner
                    if player1_score > player2_score:
                        winner = agent
                        loser = opponent
                        winner_score = player1_score
                        loser_score = player2_score
                        winner_deck = player1_deck
                        loser_deck = player2_deck
                    else:
                        winner = opponent
                        loser = agent
                        winner_score = player2_score
                        loser_score = player1_score
                        winner_deck = player2_deck
                        loser_deck = player1_deck

                    # Boost attractiveness and price of winning cards by 1%
                    for card in winner_deck:
                        world.boost_card_stats(card.ref.card_id, 0.01)

                    # Penalize attractiveness and price of losing cards by 1%
                    for card in loser_deck:
                        world.penalize_card_stats(card.ref.card_id, 0.01)

                    # Degrade cards in both decks by 1%
                    for card in player1_deck:
                        degrade_card_quality(card, 0.01)  # 1% degradation
                    for card in player2_deck:
                        degrade_card_quality(card, 0.01)  # 1% degradation

                    # Log combat event
                    description = (
                        f"{winner.name} defeated {loser.name} "
                        f"({winner_score:.2f} vs {loser_score:.2f})"
                    )
                    event = Event(
                        tick=t,
                        agent_id=winner.id,
                        event_type="combat",
                        description=description,
                        agent_ids=[winner.id, loser.id],
                    )
                    world.add_event(event)
                else:
                    # No opponent available, just degrade cards
                    if len(agent.collection) >= 40:
                        deck_sample = agent.collection[:40]
                    else:
                        deck_sample = agent.collection
                    for card in deck_sample:
                        degrade_card_quality(card, 0.01)

                    description = f"{agent.name} played a game (no opponent)"
                    event = Event(
                        tick=t,
                        agent_id=agent.id,
                        event_type="play",
                        description=description,
                        agent_ids=[agent.id],
                    )
                    world.add_event(event)

        # Degrade unopened packs by 1% every 180 ticks
        for agent in world.agents.values():
            if agent.boosters > 0 and t > 0 and t % 180 == 0:
                # Pack degradation happens at tick 180, 360, 540, etc.
                # For now, we log this but don't degrade anything physical
                # (packs don't have quality_score, only opened cards do)
                plural = "s" if agent.boosters > 1 else ""
                description = (
                    f"{agent.name}'s {agent.boosters} unopened booster{plural} aged"
                )
                event = Event(
                    tick=t,
                    agent_id=agent.id,
                    event_type="pack_age",
                    description=description,
                    agent_ids=[agent.id],
                )
                world.add_event(event)

        # Collect events that occurred this tick
        tick_events = [e.to_dict() for e in world.events if e.tick == t]
        timeseries.append({"tick": t, **world.summary(), "events": tick_events})

    # Build a serializable agents summary to expose to the frontend/backend.
    agents_summary = []
    for _pid, agent in world.agents.items():
        # Full collection for detailed view
        full_collection = []
        for ci in agent.collection:
            full_collection.append(
                {
                    "card_id": ci.ref.card_id,
                    "name": ci.ref.name,
                    "color": ci.ref.color,
                    "rarity": ci.ref.rarity.value,
                    "is_hologram": ci.is_hologram,
                    "quality_score": ci.effective_quality(),
                    "price": world.get_card_price(ci.ref.card_id),
                    "attractiveness": world.get_card_attractiveness(ci.ref.card_id),
                    "power": ci.ref.power,
                    "health": ci.ref.health,
                    "gem_colored": ci.ref.gem_colored,
                    "gem_colorless": ci.ref.gem_colorless,
                }
            )

        # Build a deck from the collection
        a_rng = random.Random(agent.rng_seed + 5000)
        deck = build_deck(agent.collection, a_rng)

        traits_dict = agent.traits.to_dict() if agent.traits else {}

        # Agent-specific events (events where this agent is the primary actor)
        agent_events = [e.to_dict() for e in world.events if e.agent_id == agent.id]

        agents_summary.append(
            {
                "id": agent.id,
                "prism": agent.prism,
                "name": agent.name,
                "nick": agent.nick,
                "rng_seed": agent.rng_seed,
                "collection_count": len(agent.collection),
                "booster_count": agent.boosters,
                "full_collection": full_collection,
                "deck": deck,
                "traits": traits_dict,
                "agent_events": agent_events,
            }
        )

    return {
        "config": config.__dict__,
        "timeseries": timeseries,
        "final": world.summary(),
        "agents": agents_summary,
        "events": [e.to_dict() for e in world.events],
    }
