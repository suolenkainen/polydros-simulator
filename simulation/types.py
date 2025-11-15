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

    This represents a physical/virtual card a player can hold, sell, or trade.
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
