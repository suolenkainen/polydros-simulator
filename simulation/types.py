"""Core types for the Polydros simulation.

This module defines simple, serializable dataclasses and enums used across the
simulation. Keep these lightweight and documented so the rest of the engine
can remain modular.
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional


class Rarity(str, Enum):
    COMMON = "Common"
    UNCOMMON = "Uncommon"
    RARE = "Rare"
    MYTHIC = "Mythic"
    PLAYER = "Player"


@dataclass(frozen=True)
class CardRef:
    """Immutable reference to a card definition.

    Attributes:
        card_id: unique identifier (str)
        name: display name
        rarity: one of Rarity
        quality_score: float used by demand heuristics (higher = more desirable)
        pack_weight: relative weight in booster selection
    """

    card_id: str
    name: str
    rarity: Rarity
    quality_score: float = 1.0
    pack_weight: float = 1.0


@dataclass
class CardInstance:
    """A specific owned card instance with visual flags.

    This represents a physical/virtual card an agent can hold, sell, or trade.
    """

    ref: CardRef
    is_hologram: bool = False
    is_reverse_holo: bool = False
    is_alt_art: bool = False
    quality_score: Optional[float] = None

    def effective_quality(self) -> float:
        """Compute effective quality used by demand calculations.

        If `quality_score` is set use it; otherwise fall back to ref. This keeps
        instance-level variation (e.g., better printings) possible.
        """
        return float(
            self.quality_score
            if self.quality_score is not None
            else self.ref.quality_score
        )


class AgentTrait(str, Enum):
    """Behavioral traits that influence agent decision-making."""

    COLLECTOR = "collector_trait"
    COMPETITOR = "competitor_trait"
    GAMBLER = "gambler_trait"
    SCAVENGER = "scavenger_trait"


class RiskAversion(str, Enum):
    """Risk tolerance spectrum."""

    LOW = "low"  # aggressive, takes risks
    MEDIUM = "medium"
    HIGH = "high"  # conservative, avoids risks


class TimeHorizon(str, Enum):
    """Planning horizon for agent decisions."""

    SHORT_TERM = "short_term"
    MEDIUM_TERM = "medium_term"
    LONG_TERM = "long_term"


@dataclass
class AgentTraits:
    """Bundle of trait values for an agent."""

    primary_trait: AgentTrait
    risk_aversion: RiskAversion
    time_horizon: TimeHorizon
    collector_trait: float = 0.0  # 0.0 to 1.0
    competitor_trait: float = 0.0
    gambler_trait: float = 0.0
    scavenger_trait: float = 0.0

    def to_dict(self) -> dict:
        """Serialize traits to a dictionary."""
        return {
            "primary_trait": self.primary_trait.value,
            "risk_aversion": self.risk_aversion.value,
            "time_horizon": self.time_horizon.value,
            "collector_trait": self.collector_trait,
            "competitor_trait": self.competitor_trait,
            "gambler_trait": self.gambler_trait,
            "scavenger_trait": self.scavenger_trait,
        }
