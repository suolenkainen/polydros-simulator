"""Booster pack logic.

Provides functions to sample packs from a card pool using a provided random
.Random instance to guarantee determinism when seeded.
"""

import random
from typing import List, Sequence

from .types import CardInstance, CardRef, Rarity

DEFAULT_PACK_TEMPLATE = {
    Rarity.COMMON: 7,
    Rarity.UNCOMMON: 3,
    Rarity.RARE: 1,  # may be replaced by mythic via probability
    Rarity.PLAYER: 1,  # one player card per pack
}


def _filter_by_rarity(pool: Sequence[CardRef], rarity: Rarity) -> List[CardRef]:
    return [c for c in pool if c.rarity == rarity]


def open_booster(pool: Sequence[CardRef], rng: random.Random) -> List[CardInstance]:
    """Open a single booster pack.

    Parameters:
        pool: sequence of CardRef available
        rng: seeded random.Random instance for determinism

    Returns:
        list of CardInstance objects representing cards opened
    """
    # Simple implementation: select exact counts per rarity using weights
    instances: List[CardInstance] = []

    for rarity, count in DEFAULT_PACK_TEMPLATE.items():
        candidates = _filter_by_rarity(pool, rarity)
        if not candidates:
            continue
        weights = [c.pack_weight for c in candidates]
        chosen = rng.choices(candidates, weights=weights, k=count)
        for c in chosen:
            # Very small chance to set hologram flag for any card
            is_holo = rng.random() < 0.02
            instances.append(CardInstance(ref=c, is_hologram=is_holo))

    # Simple rare->mythic upgrade
    if rng.random() < 0.05:
        # try to replace one rare with a mythic if available
        mythics = _filter_by_rarity(pool, Rarity.MYTHIC)
        rares = [i for i in instances if i.ref.rarity == Rarity.RARE]
        if mythics and rares:
            replace_idx = rng.randrange(len(rares))
            new_ref = rng.choice(mythics)
            # replace in place
            for idx, inst in enumerate(instances):
                if inst is rares[replace_idx]:
                    instances[idx] = CardInstance(
                        ref=new_ref, is_hologram=rng.random() < 0.05
                    )
                    break

    return instances
