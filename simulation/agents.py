"""Agent trait generation and initialization.

This module provides utilities to create and randomize agent traits.
"""

import random
from typing import Sequence

from .types import AgentTrait, AgentTraits, RiskAversion, TimeHorizon


def generate_agent_traits(rng: random.Random) -> AgentTraits:
    """Generate random traits for an agent.

    Parameters:
        rng: seeded Random instance for determinism

    Returns:
        AgentTraits with randomized values
    """
    primary = rng.choice(list(AgentTrait))
    risk = rng.choice(list(RiskAversion))
    horizon = rng.choice(list(TimeHorizon))

    # Each trait is independent and ranges [0, 1]
    traits = AgentTraits(
        primary_trait=primary,
        risk_aversion=risk,
        time_horizon=horizon,
        collector_trait=rng.random(),
        competitor_trait=rng.random(),
        gambler_trait=rng.random(),
        scavenger_trait=rng.random(),
    )
    return traits
