"""World and agent representations.

Keep these simple: agents have Prism balance and collections. For the skeleton
we only model opening packs and tracking counts.
"""

from dataclasses import dataclass, field
from typing import Dict, List

from .types import AgentTraits, CardInstance


@dataclass
class Event:
    """Represents a single event that occurred during simulation.
    
    Attributes:
        tick: the simulation tick when the event occurred
        agent_id: id of the primary agent involved
        event_type: 'purchase', 'sale', 'match', 'booster_open', etc.
        description: human-readable event description
        agent_ids: list of all agent ids involved (for bilateral events like trades)
    """
    tick: int
    agent_id: int
    event_type: str  # 'purchase', 'sale', 'match', 'booster_open', etc.
    description: str
    agent_ids: List[int] = field(default_factory=list)

    def to_dict(self) -> Dict:
        return {
            "tick": self.tick,
            "agent_id": self.agent_id,
            "event_type": self.event_type,
            "description": self.description,
            "agent_ids": self.agent_ids,
        }


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
    events: List[Event] = field(default_factory=list)  # all events that occurred

    def add_event(self, event: Event) -> None:
        """Record an event that occurred in the world."""
        self.events.append(event)

    def summary(self) -> Dict:
        return {
            "tick": self.tick,
            "agent_count": len(self.agents),
            "total_cards": sum(len(a.collection) for a in self.agents.values()),
            "distributor_boosters": self.distributor_boosters,
            "total_unopened_boosters": sum(a.boosters for a in self.agents.values()),
        }
