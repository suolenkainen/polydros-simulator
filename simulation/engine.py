"""Simulation engine (minimal scaffold).

This module provides a small, deterministic runner used by the backend and
unit tests. It follows the project's requirements for RNG seeding and
reproducibility.
"""

import random
from dataclasses import dataclass
from typing import Dict, List

from .agents import generate_agent_traits
from .booster import open_booster
from .cards import large_card_pool
from .world import Agent, Event, WorldState


def calculate_card_price(card_ref) -> float:
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
    quality_mult = max(0.5, min(2.0, quality_mult))  # clamp between 0.5 and 2.0
    
    return card_ref.base_price * rarity_mult * scarcity_mult * quality_mult * 0.1  # scale down final price


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


@dataclass
class SimulationConfig:
    seed: int = 42
    initial_agents: int = 10
    ticks: int = 1


def run_simulation(config: SimulationConfig) -> Dict:
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
            if len(agent.collection) >= 60:
                # After 60 cards, use collector trait to determine if they buy
                a_rng = random.Random(agent.rng_seed + t + 2000)
                collector_roll = a_rng.random()
                
                if collector_roll >= agent.traits.collector_trait:
                    # Collector trait did NOT trigger this tick, skip purchase
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
                if len(agent.collection) >= 60:
                    description = f"{agent.name} bought {buy_count} booster{'s' if buy_count > 1 else ''} for {cost} Prism (collector trait triggered: {agent.traits.collector_trait:.0%})"
                else:
                    description = f"{agent.name} bought {buy_count} booster{'s' if buy_count > 1 else ''} for {cost} Prism"
                
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
                    "price": calculate_card_price(ci.ref),
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
