"""World and player representations.

Keep these simple: players have Prism balance and collections. For the skeleton
we only model opening packs and tracking counts.
"""

from dataclasses import dataclass, field
from typing import Dict, List

from .types import CardInstance


@dataclass
class Player:
    id: int
    prism: float = 0.0
    collection: List[CardInstance] = field(default_factory=list)

    def add_cards(self, cards: List[CardInstance]) -> None:
        self.collection.extend(cards)


@dataclass
class WorldState:
    players: Dict[int, Player] = field(default_factory=dict)
    tick: int = 0

    def summary(self) -> Dict:
        return {
            "tick": self.tick,
            "player_count": len(self.players),
            "total_cards": sum(len(p.collection) for p in self.players.values()),
        }
