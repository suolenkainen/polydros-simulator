"""World and agent representations.

Keep these simple: agents have Prism balance and collections. For the skeleton
we only model opening packs and tracking counts.
"""

from dataclasses import dataclass, field
from typing import Dict, List

from .types import AgentCardInstance, AgentTraits, CardInstance


@dataclass
class Event:
    """Represents a single event that occurred during simulation.

    Attributes:
        tick: the simulation tick when the event occurred
        agent_id: id of the primary agent involved
        event_type: 'purchase', 'sale', 'match', 'booster_open', etc.
        description: human-readable event description
        agent_ids: list of all agent ids involved (for bilateral events)
        triggered: event status (True=success, False=fail, None=neutral)
    """
    tick: int
    agent_id: int
    event_type: str  # 'purchase', 'sale', 'match', 'booster_open', etc.
    description: str
    agent_ids: List[int] = field(default_factory=list)
    triggered: bool | None = None  # True=triggered/won, False=not triggered/lost

    def to_dict(self) -> Dict:
        return {
            "tick": self.tick,
            "agent_id": self.agent_id,
            "event_type": self.event_type,
            "description": self.description,
            "agent_ids": self.agent_ids,
            "triggered": self.triggered,
        }


@dataclass
class Agent:
    id: int
    prism: float = 50.0
    collection: List[CardInstance] = field(default_factory=list)
    card_instances: Dict[str, AgentCardInstance] = field(default_factory=dict)  # card_instance_id -> AgentCardInstance
    traits: AgentTraits | None = None
    name: str = ""
    nick: str = ""
    rng_seed: int = 0
    boosters: int = 0  # number of unopened booster packs the agent holds

    def add_cards(self, cards: List[CardInstance]) -> None:
        self.collection.extend(cards)

    def add_card_instance(self, card_instance: AgentCardInstance) -> None:
        """Add a tracked card instance to this agent."""
        self.card_instances[card_instance.card_instance_id] = card_instance

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
    # Track card metadata (attractiveness and current price) by card_id
    card_metadata: Dict[str, Dict[str, float]] = field(default_factory=dict)
    market_snapshots: List = field(default_factory=list)  # List[MarketSnapshot]
    cards_traded_this_tick: int = 0  # Counter for trades in current tick
    volume_traded_this_tick: float = 0.0  # Total prisms exchanged this tick

    def add_event(self, event: Event) -> None:
        """Record an event that occurred in the world."""
        self.events.append(event)

    def get_card_attractiveness(self, card_id: str, default: float = 1.0) -> float:
        """Get the current attractiveness of a card."""
        if card_id not in self.card_metadata:
            self.card_metadata[card_id] = {"attractiveness": default, "price": 1.0}
        return self.card_metadata[card_id].get("attractiveness", default)

    def get_card_price(self, card_id: str, default: float = 1.0) -> float:
        """Get the current price of a card."""
        if card_id not in self.card_metadata:
            self.card_metadata[card_id] = {"attractiveness": 1.0, "price": default}
        return self.card_metadata[card_id].get("price", default)

    def boost_card_stats(self, card_id: str, boost_percent: float = 0.01) -> None:
        """Increase attractiveness and price of a card by a percentage.

        Args:
            card_id: the card to boost
            boost_percent: percentage increase (0.01 = 1%)
        """
        if card_id not in self.card_metadata:
            self.card_metadata[card_id] = {"attractiveness": 1.0, "price": 1.0}

        metadata = self.card_metadata[card_id]
        metadata["attractiveness"] *= (1.0 + boost_percent)
        metadata["price"] *= (1.0 + boost_percent)

    def penalize_card_stats(self, card_id: str, penalty_percent: float = 0.01) -> None:
        """Decrease attractiveness and price of a card by a percentage.

        Args:
            card_id: the card to penalize
            penalty_percent: percentage decrease (0.01 = 1%)
        """
        if card_id not in self.card_metadata:
            self.card_metadata[card_id] = {"attractiveness": 1.0, "price": 1.0}

        metadata = self.card_metadata[card_id]
        # Ensure stats don't go below a minimum threshold
        min_value = 0.01
        metadata["attractiveness"] = max(
            min_value, metadata["attractiveness"] * (1.0 - penalty_percent)
        )
        metadata["price"] = max(
            min_value, metadata["price"] * (1.0 - penalty_percent)
        )

    def record_price_points(self) -> None:
        """Record price data point for all card instances across all agents.

        This should be called at the end of each tick to capture market state.
        """
        for agent in self.agents.values():
            for card_instance in agent.card_instances.values():
                card_instance.record_price_point(self.tick)

    def capture_market_snapshot(self) -> None:
        """Capture aggregate market statistics for the current tick.

        This should be called at the end of each tick.
        """
        from .types import MarketSnapshot

        # Count unique card IDs and total instances
        unique_card_ids = set()
        total_instances = 0
        total_prices = 0.0
        prices = []

        for agent in self.agents.values():
            for card_instance in agent.card_instances.values():
                unique_card_ids.add(card_instance.card_id)
                total_instances += 1
                total_prices += card_instance.current_price
                prices.append(card_instance.current_price)

        # Calculate statistics
        price_index = total_prices / max(1, total_instances)

        # Calculate volatility (standard deviation of prices)
        if prices and len(prices) > 1:
            mean_price = price_index
            variance = sum((p - mean_price) ** 2 for p in prices) / len(prices)
            volatility = variance ** 0.5  # Standard deviation
        else:
            volatility = 0.0

        snapshot = MarketSnapshot(
            tick=self.tick,
            total_volume_traded=self.volume_traded_this_tick,
            cards_traded_count=self.cards_traded_this_tick,
            price_index=price_index,
            volatility=volatility,
            unique_cards_in_circulation=len(unique_card_ids),
            total_card_instances=total_instances,
        )
        self.market_snapshots.append(snapshot)

        # Reset tick counters
        self.cards_traded_this_tick = 0
        self.volume_traded_this_tick = 0.0

    def summary(self) -> Dict:
        return {
            "tick": self.tick,
            "agent_count": len(self.agents),
            "total_cards": sum(len(a.collection) for a in self.agents.values()),
            "distributor_boosters": self.distributor_boosters,
            "total_unopened_boosters": sum(a.boosters for a in self.agents.values()),
        }
