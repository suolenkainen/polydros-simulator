"""Core types for the Polydros simulation.

This module defines simple, serializable dataclasses and enums used across the
simulation. Keep these lightweight and documented so the rest of the engine
can remain modular.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


class Rarity(str, Enum):
    COMMON = "Common"
    UNCOMMON = "Uncommon"
    RARE = "Rare"
    MYTHIC = "Mythic"
    PLAYER = "Player"
    ALTERNATE_ART = "Alternate Art"


@dataclass(frozen=True)
class CardRef:
    """Immutable reference to a card definition.

    Attributes:
        card_id: unique identifier (str)
        name: display name
        color: card color (Ruby, Sapphire, etc.)
        rarity: one of Rarity
        type: card type (Creature, Spell, etc.)
        quality_score: float used by demand heuristics (higher = more desirable)
        pack_weight: relative weight in booster selection
        base_price: base market price from card data
        power: creature power (for deck building)
        health: creature health (for deck building)
        gem_colored: number of colored gems in cost
        gem_colorless: number of colorless gems in cost
        flavor_text: flavor text describing the card
    """

    card_id: str
    name: str
    color: str
    rarity: Rarity
    type: str = "Unknown"
    quality_score: float = 1.0
    pack_weight: float = 1.0
    base_price: float = 1.0
    power: int = 0
    health: int = 0
    gem_colored: int = 0
    gem_colorless: int = 0
    flavor_text: str = ""


@dataclass
class CardInstance:
    """A specific owned card instance with visual flags.

    This represents a physical/virtual card an agent can hold, sell, or trade.
    """

    ref: CardRef
    is_hologram: bool = False
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


@dataclass
class PriceDataPoint:
    """A snapshot of a card's price and metrics at a specific tick.

    Attributes:
        tick: simulation tick when this data point was captured
        price: market price of the card at this tick
        quality_score: card quality at this tick
        desirability: desirability metric (0.0 to 10.0)
    """

    tick: int
    price: float
    quality_score: float
    desirability: float

    def to_dict(self) -> dict:
        """Serialize to dictionary for API response."""
        return {
            "tick": self.tick,
            "price": round(self.price, 2),
            "quality_score": self.quality_score,
            "desirability": self.desirability,
        }


class CardCondition(str, Enum):
    """Physical condition of a card instance."""

    MINT = "mint"  # Perfect condition, never played
    PLAYED = "played"  # Normal play wear
    DAMAGED = "damaged"  # Significant wear
    WORN = "worn"  # Heavy wear, barely playable


@dataclass
class AgentCardInstance:
    """A specific card instance owned by an agent with individual tracking.

    This represents a unique copy of a card with its own stats, history, and metrics.

    Attributes:
        card_instance_id: unique identifier for this specific card copy
        card_id: reference to the master card definition
        card_name: card name (for display)
        flavor_text: card flavor text
        card_color: card color
        card_rarity: card rarity
        agent_id: current owner agent ID
        acquisition_tick: tick when this card was acquired
        acquisition_price: price paid when acquired
        current_price: current market price
        quality_score: current quality (0.0 to 10.0)
        desirability: desirability metric (0.0 to 10.0)
        win_count: number of combat wins with this card
        loss_count: number of combat losses with this card
        condition: physical condition (mint, played, damaged, worn)
        price_history: list of PriceDataPoint for this card across ticks
    """

    card_instance_id: str
    card_id: str
    card_name: str
    flavor_text: str
    card_color: str
    card_rarity: str
    agent_id: int
    acquisition_tick: int
    acquisition_price: float
    current_price: float
    quality_score: float = 10.0
    desirability: float = 5.0
    win_count: int = 0
    loss_count: int = 0
    condition: CardCondition = CardCondition.MINT
    price_history: list = field(default_factory=list)  # List[PriceDataPoint]

    def to_dict(self) -> dict:
        """Serialize to dictionary for API response."""
        return {
            "card_instance_id": self.card_instance_id,
            "card_id": self.card_id,
            "card_name": self.card_name,
            "flavor_text": self.flavor_text,
            "card_color": self.card_color,
            "card_rarity": self.card_rarity,
            "agent_id": self.agent_id,
            "acquisition_tick": self.acquisition_tick,
            "acquisition_price": round(self.acquisition_price, 2),
            "current_price": round(self.current_price, 2),
            "quality_score": self.quality_score,
            "desirability": self.desirability,
            "win_count": self.win_count,
            "loss_count": self.loss_count,
            "condition": self.condition.value,
            "price_history": [p.to_dict() for p in self.price_history],
        }

    def update_condition(self) -> None:
        """Calculate and update card condition based on quality and win/loss record."""
        if self.quality_score > 9.5:
            self.condition = CardCondition.MINT
        elif self.quality_score > 7.5 and self.loss_count == 0:
            self.condition = CardCondition.PLAYED
        elif self.quality_score > 5.0:
            self.condition = CardCondition.DAMAGED
        else:
            self.condition = CardCondition.WORN

    def calculate_desirability(self) -> float:
        """Calculate desirability based on quality, wins, and losses.

        Returns:
            desirability score (0.0 to 10.0)
        """
        base_desirability = 5.0
        win_bonus = self.win_count * 0.5
        loss_penalty = self.loss_count * 0.3
        quality_factor = (self.quality_score / 10.0) * 2.0

        desirability = base_desirability + win_bonus - loss_penalty + quality_factor
        return max(0.0, min(10.0, desirability))  # Clamp to [0, 10]

    def record_price_point(self, tick: int) -> None:
        """Record current card state as a price data point at the given tick."""
        # Update desirability first
        self.desirability = self.calculate_desirability()
        # Update condition
        self.update_condition()
        # Record price point
        price_point = PriceDataPoint(
            tick=tick,
            price=self.current_price,
            quality_score=self.quality_score,
            desirability=self.desirability,
        )
        self.price_history.append(price_point)


@dataclass
class MarketSnapshot:
    """Aggregate market statistics for a tick.

    Attributes:
        tick: simulation tick
        total_volume_traded: total Prisms exchanged this tick
        cards_traded_count: number of card trades this tick
        price_index: average price across all cards
        volatility: price movement variance
        unique_cards_in_circulation: count of unique card IDs owned
        total_card_instances: total individual card instances across all agents
    """

    tick: int
    total_volume_traded: float = 0.0
    cards_traded_count: int = 0
    price_index: float = 0.0
    volatility: float = 0.0
    unique_cards_in_circulation: int = 0
    total_card_instances: int = 0

    def to_dict(self) -> dict:
        """Serialize to dictionary for API response."""
        return {
            "tick": self.tick,
            "total_volume_traded": round(self.total_volume_traded, 2),
            "cards_traded_count": self.cards_traded_count,
            "price_index": round(self.price_index, 2),
            "volatility": round(self.volatility, 2),
            "unique_cards_in_circulation": self.unique_cards_in_circulation,
            "total_card_instances": self.total_card_instances,
        }
