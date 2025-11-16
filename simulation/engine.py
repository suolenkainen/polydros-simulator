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
from .world import Agent, WorldState


@dataclass
class SimulationConfig:
    seed: int = 42
    initial_agents: int = 10
    initial_packs_per_agent: int = 15
    ticks: int = 1


def run_simulation(config: SimulationConfig) -> Dict:
    """Run a minimal deterministic simulation.

    The runner is intentionally small: it creates agents, opens the seeded
    number of boosters for each agent at t=0, then advances `ticks` times
    without further market logic. This gives a stable base for later
    development.

    Returns a dictionary containing summary time-series and final world state
    metadata.
    """
    rng = random.Random(config.seed)

    pool = large_card_pool()

    world = WorldState()

    # Distributor initially owns all boosters; agents start empty
    total_boosters = config.initial_agents * config.initial_packs_per_agent
    world.distributor_boosters = total_boosters

    # Create agents with deterministic per-agent RNG seeds and empty collections
    for pid in range(config.initial_agents):
        traits = generate_agent_traits(rng)
        seed = rng.randint(0, 2 ** 31 - 1)
        agent = Agent(id=pid, prism=0.0, traits=traits, name=f"Agent-{pid}", nick=f"A{pid}", rng_seed=seed, boosters=0)
        world.agents[pid] = agent

    # Collect time-series (simple: only initial snapshot + tick summaries)
    timeseries: List[Dict] = []
    timeseries.append({"tick": 0, **world.summary()})

    # Cost parameters
    BOOSTER_COST = 5.0

    # Advance ticks: agents buy boosters from distributor and open some
    for t in range(1, config.ticks + 1):
        world.tick = t
        # Each agent gets small income
        for agent in world.agents.values():
            agent.prism += 1.0

        # Buying phase: each agent buys up to default_buy boosters (influenced by collector_trait)
        default_buy = 5
        for agent in world.agents.values():
            # Buying decisions: default behavior (no trait influence): buy up to default_buy
            # constrained by distributor stock and affordability (BOOSTER_COST)
            affordable = int(agent.prism // BOOSTER_COST)
            buy_wish = default_buy
            buy_count = min(buy_wish, world.distributor_boosters, affordable)
            if buy_count > 0:
                agent.add_boosters(buy_count)
                world.distributor_boosters -= buy_count
                # charge prism
                agent.prism -= buy_count * BOOSTER_COST

        # Opening phase: agents open up to default_open boosters from their inventory
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

        timeseries.append({"tick": t, **world.summary()})

    # Build a serializable agents summary to expose to the frontend/backend.
    agents_summary = []
    for _pid, agent in world.agents.items():
        # include a few sample cards (card ids and names) to keep payload small
        sample_cards = []
        for ci in agent.collection[:5]:
            sample_cards.append(
                {
                    "card_id": ci.ref.card_id,
                    "name": ci.ref.name,
                    "rarity": ci.ref.rarity.value,
                    "is_hologram": ci.is_hologram,
                }
            )

        # Full collection for detailed view
        full_collection = []
        for ci in agent.collection:
            full_collection.append(
                {
                    "card_id": ci.ref.card_id,
                    "name": ci.ref.name,
                    "rarity": ci.ref.rarity.value,
                    "is_hologram": ci.is_hologram,
                    "is_reverse_holo": ci.is_reverse_holo,
                    "is_alt_art": ci.is_alt_art,
                    "quality_score": ci.effective_quality(),
                }
            )

        traits_dict = agent.traits.to_dict() if agent.traits else {}

        # Collection summary by rarity
        rarity_counts: Dict[str, int] = {}
        for ci in agent.collection:
            r = ci.ref.rarity.value
            rarity_counts[r] = rarity_counts.get(r, 0) + 1

        agents_summary.append(
            {
                "id": agent.id,
                "prism": agent.prism,
                "name": agent.name,
                "nick": agent.nick,
                "rng_seed": agent.rng_seed,
                "collection_count": len(agent.collection),
                "booster_count": agent.boosters,
                "rarity_breakdown": rarity_counts,
                "sample_cards": sample_cards,
                "full_collection": full_collection,
                "traits": traits_dict,
            }
        )

    return {
        "config": config.__dict__,
        "timeseries": timeseries,
        "final": world.summary(),
        "agents": agents_summary,
    }
