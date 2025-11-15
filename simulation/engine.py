"""Simulation engine (minimal scaffold).

This module provides a small, deterministic runner used by the backend and
unit tests. It follows the project's requirements for RNG seeding and
reproducibility.
"""
from dataclasses import dataclass
from typing import Dict, List
import random

from .cards import sample_card_pool
from .booster import open_booster
from .world import WorldState, Player


@dataclass
class SimulationConfig:
    seed: int = 42
    initial_players: int = 500
    initial_packs_per_player: int = 15
    ticks: int = 1


def run_simulation(config: SimulationConfig) -> Dict:
    """Run a minimal deterministic simulation.

    The runner is intentionally small: it creates players, opens the seeded
    number of boosters for each player at t=0, then advances `ticks` times
    without further market logic. This gives a stable base for later
    development.

    Returns a dictionary containing summary time-series and final world state
    metadata.
    """
    rng = random.Random(config.seed)

    pool = sample_card_pool()

    world = WorldState()

    # Create players and seed packs
    for pid in range(config.initial_players):
        p = Player(id=pid, prism=0.0)
        for _ in range(config.initial_packs_per_player):
            cards = open_booster(pool, rng)
            p.add_cards(cards)
        world.players[pid] = p

    # Collect time-series (simple: only initial snapshot + tick summaries)
    timeseries: List[Dict] = []
    timeseries.append({"tick": 0, **world.summary()})

    # Advance ticks (no market yet; reserved for later)
    for t in range(1, config.ticks + 1):
        world.tick = t
        # Placeholder: grant small income
        for player in world.players.values():
            player.prism += 1.0
        timeseries.append({"tick": t, **world.summary()})

    return {
        "config": config.__dict__,
        "timeseries": timeseries,
        "final": world.summary(),
    }
