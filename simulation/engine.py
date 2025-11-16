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
from .cards import sample_card_pool
from .world import Agent, WorldState


@dataclass
class SimulationConfig:
    seed: int = 42
    initial_agents: int = 500
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

    pool = sample_card_pool()

    world = WorldState()

    # Create agents and seed packs
    for pid in range(config.initial_agents):
        traits = generate_agent_traits(rng)
        agent = Agent(id=pid, prism=0.0, traits=traits)
        for _ in range(config.initial_packs_per_agent):
            cards = open_booster(pool, rng)
            agent.add_cards(cards)
        world.agents[pid] = agent

    # Collect time-series (simple: only initial snapshot + tick summaries)
    timeseries: List[Dict] = []
    timeseries.append({"tick": 0, **world.summary()})

    # Advance ticks (no market yet; reserved for later)
    for t in range(1, config.ticks + 1):
        world.tick = t
        # Placeholder: grant small income
        for agent in world.agents.values():
            agent.prism += 1.0
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
                "collection_count": len(agent.collection),
                "rarity_breakdown": rarity_counts,
                "sample_cards": sample_cards,
                "traits": traits_dict,
            }
        )

    return {
        "config": config.__dict__,
        "timeseries": timeseries,
        "final": world.summary(),
        "agents": agents_summary,
    }
