"""Simulation engine (minimal scaffold).

This module provides a small, deterministic runner used by the backend and
unit tests. It follows the project's requirements for RNG seeding and
reproducibility.
"""

import random
from dataclasses import dataclass
from typing import Dict, List

from .booster import open_booster
from .cards import sample_card_pool
from .world import Player, WorldState


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

    # Build a serializable players summary to expose to the frontend/backend.
    players_summary = []
    for _pid, player in world.players.items():
        # include a few sample cards (card ids and names) to keep payload small
        sample_cards = []
        for ci in player.collection[:5]:
            sample_cards.append(
                {
                    "card_id": ci.ref.card_id,
                    "name": ci.ref.name,
                    "rarity": ci.ref.rarity.value,
                    "is_hologram": ci.is_hologram,
                }
            )

        players_summary.append(
            {
                "id": player.id,
                "prism": player.prism,
                "collection_count": len(player.collection),
                "sample_cards": sample_cards,
            }
        )

    return {
        "config": config.__dict__,
        "timeseries": timeseries,
        "final": world.summary(),
        "players": players_summary,
    }
