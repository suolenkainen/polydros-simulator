"""World and agent representations.

Keep these simple: agents have Prism balance and collections. For the skeleton
we only model opening packs and tracking counts.
"""

from dataclasses import dataclass, field
from typing import Dict, List

from .types import AgentTraits, CardInstance


@dataclass
class Agent:
    id: int
    prism: float = 50.0
    collection: List[CardInstance] = field(default_factory=list)
    traits: AgentTraits | None = None
    name: str = ""
    nick: str = ""
    rng_seed: int = 0
    boosters: int = 0  # number of unopened booster packs the agent holds

    def add_cards(self, cards: List[CardInstance]) -> None:
        self.collection.extend(cards)

    def add_boosters(self, n: int) -> None:
        self.boosters += int(n)

    def remove_boosters(self, n: int) -> None:
        self.boosters = max(0, self.boosters - int(n))


@dataclass
class WorldState:
    agents: Dict[int, Agent] = field(default_factory=dict)
    tick: int = 0
    distributor_boosters: int = 0

    def summary(self) -> Dict:
        return {
            "tick": self.tick,
            "agent_count": len(self.agents),
            "total_cards": sum(len(a.collection) for a in self.agents.values()),
            "distributor_boosters": self.distributor_boosters,
            "total_unopened_boosters": sum(a.boosters for a in self.agents.values()),
        }
