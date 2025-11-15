"""Card pool helpers and simple card generator.

This module contains convenience functions to create a small deterministic card
pool used by the initial scaffold. In the full project this would load from
config or a data file. Keep functions pure and seedable.
"""

from typing import List

from .types import CardRef, Rarity


def sample_card_pool() -> List[CardRef]:
    """Return a small, deterministic sample pool of cards.

    Used for development and tests. The pool intentionally includes different
    rarities and weights.
    """
    return [
        CardRef(
            "C001",
            "Sparkling Pebble",
            Rarity.COMMON,
            quality_score=0.5,
            pack_weight=10.0,
        ),
        CardRef("C002", "Gleam Fox", Rarity.COMMON, quality_score=0.6, pack_weight=9.0),
        CardRef(
            "U001",
            "Lustrous Drake",
            Rarity.UNCOMMON,
            quality_score=1.2,
            pack_weight=5.0,
        ),
        CardRef(
            "U002", "Mirror Sprite", Rarity.UNCOMMON, quality_score=1.1, pack_weight=4.5
        ),
        CardRef(
            "R001", "Prism Knight", Rarity.RARE, quality_score=2.5, pack_weight=1.5
        ),
        CardRef(
            "M001", "Aurora Titan", Rarity.MYTHIC, quality_score=5.0, pack_weight=0.5
        ),
    ]
