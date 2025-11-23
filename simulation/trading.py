"""
Trading system module for marketplace buying and selling.

This module implements a two-phase trading system:
1. BUYING PHASE (every 3 ticks): Agents build purchase lists and execute purchases sequentially
2. SELLING PHASE (every 3 ticks): Agents list cards for sale based on their traits

Key principles:
- Trait-based desirability calculations specific to each agent
- Sequential purchasing to prevent race conditions
- Once purchased, cards are removed from all pending purchase lists
- Prices dynamically calculated based on card quality and seller strategy
"""

import random
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, field

from .types import AgentCardInstance, AgentTrait


@dataclass
class PurchaseListItem:
    """Item in an agent's purchase list."""
    card_instance_id: str
    card_instance: AgentCardInstance
    desirability_score: float
    is_viable: bool = True


@dataclass
class SellListItem:
    """Item in an agent's sell list."""
    card_instance_id: str
    card_instance: AgentCardInstance
    suggested_price: float


def calculate_desirability_for_agent(
    card_instance: AgentCardInstance,
    agent_id: int,
    agent_traits,
    agent_prism: float,
    agent_collection_size: int,
    world_state=None,
) -> float:
    """
    Calculate desirability of a card FOR a specific agent based on their traits.
    
    Returns a score from 0.0 to 10.0, where:
    - 0-2: Not interested
    - 3-5: Mildly interested
    - 6-8: Very interested
    - 8-10: Must have
    
    Factors considered:
    - Agent trait preferences
    - Card rarity and quality
    - Agent budget
    - Card price
    - Agent inventory fullness
    """
    if not agent_traits:
        return 5.0  # Default neutral desirability
    
    base_score = 5.0
    
    # RARITY FACTOR
    rarity_map = {
        'Mythic': 3.0,
        'Rare': 2.0,
        'Uncommon': 0.5,
        'Common': 0.0,
        'Player': 1.5,
        'Alternate Art': 2.5,
    }
    rarity_score = rarity_map.get(card_instance.card_rarity, 0.0)
    
    # QUALITY FACTOR (0-2 points)
    quality_factor = (card_instance.quality_score / 10.0) * 2.0
    
    # PRICE FACTOR (cheaper = higher desirability)
    price_factor = 0.0
    if card_instance.current_price < 0.5:
        price_factor = 2.0  # Great deal
    elif card_instance.current_price < 1.0:
        price_factor = 1.5
    elif card_instance.current_price < 2.0:
        price_factor = 1.0
    else:
        price_factor = max(0.0, 2.0 - card_instance.current_price / 2.0)
    
    # BUDGET FACTOR (can afford? is it worth the cost?)
    if agent_prism < card_instance.current_price:
        return 0.0  # Cannot afford
    
    budget_utilization = card_instance.current_price / max(1.0, agent_prism)
    budget_factor = 1.0 if budget_utilization < 0.2 else (0.5 if budget_utilization < 0.5 else 0.0)
    
    # TRAIT-SPECIFIC ADJUSTMENTS
    collector_adj = 0.0
    scavenger_adj = 0.0
    competitor_adj = 0.0
    gambler_adj = 0.0
    
    if agent_traits.collector_trait > 0.5:
        # Collectors love rare cards
        if card_instance.card_rarity in ['Rare', 'Mythic']:
            collector_adj = agent_traits.collector_trait * 2.0  # Up to +2
        else:
            collector_adj = -agent_traits.collector_trait * 1.0  # Penalty for commons
    
    if agent_traits.scavenger_trait > 0.5:
        # Scavengers love cheap cards
        if card_instance.current_price < 1.0:
            scavenger_adj = agent_traits.scavenger_trait * 3.0  # Up to +3
        elif card_instance.current_price > 2.0:
            scavenger_adj = -agent_traits.scavenger_trait * 1.0  # Avoid expensive
    
    if agent_traits.competitor_trait > 0.5:
        # Competitors like winning cards (positive combat record)
        win_loss_ratio = card_instance.win_count / max(1, card_instance.win_count + card_instance.loss_count)
        if win_loss_ratio > 0.6:
            competitor_adj = agent_traits.competitor_trait * 2.0
        elif card_instance.loss_count > 2:
            competitor_adj = -agent_traits.competitor_trait * 1.5
    
    if agent_traits.gambler_trait > 0.5:
        # Gamblers are less predictable but willing to take chances
        gambler_adj = agent_traits.gambler_trait * 1.5
    
    # Calculate final desirability
    total = (
        base_score +
        rarity_score +
        quality_factor +
        price_factor +
        budget_factor +
        collector_adj +
        scavenger_adj +
        competitor_adj +
        gambler_adj
    )
    
    # Clamp to [0, 10]
    return max(0.0, min(10.0, total))


def build_purchase_lists(world_state) -> Dict[int, List[PurchaseListItem]]:
    """
    Build purchase lists for all agents based on marketplace cards.
    
    Each agent evaluates each card on the market and scores it.
    Returns dict: agent_id -> sorted list of PurchaseListItem (by desirability DESC)
    """
    purchase_lists = {}
    
    # Get marketplace listings
    marketplace_listings = world_state.get_marketplace_listings()
    
    for agent in world_state.agents.values():
        agent_list = []
        
        for card_id, seller_id, card_instance, price, listing_tick in marketplace_listings:
            # Skip if agent is the seller (can't buy own cards)
            if seller_id == agent.id:
                continue
            
            # Calculate desirability FOR this agent
            desirability = calculate_desirability_for_agent(
                card_instance=card_instance,
                agent_id=agent.id,
                agent_traits=agent.traits,
                agent_prism=agent.prism,
                agent_collection_size=len(agent.card_instances),
                world_state=world_state,
            )
            
            # Determine if agent would buy this card (trait-dependent threshold)
            is_viable = False
            if agent.traits:
                if agent.traits.gambler_trait > 0.5:
                    threshold = 2.0  # Gamblers are lenient
                elif agent.traits.collector_trait > 0.5:
                    threshold = 5.0  # Collectors are selective
                elif agent.traits.scavenger_trait > 0.5:
                    threshold = 3.0  # Scavengers are moderate
                else:
                    threshold = 5.0  # Default conservative
            else:
                threshold = 5.0
            
            if desirability >= threshold:
                item = PurchaseListItem(
                    card_instance_id=card_id,
                    card_instance=card_instance,
                    desirability_score=desirability,
                    is_viable=True,
                )
                agent_list.append(item)
        
        # Sort by desirability DESC (highest first)
        agent_list.sort(key=lambda x: x.desirability_score, reverse=True)
        purchase_lists[agent.id] = agent_list
    
    return purchase_lists


def execute_buying_phase(world_state, purchase_lists: Dict[int, List[PurchaseListItem]]) -> int:
    """
    Execute buying phase: agents purchase cards in random order each tick.
    
    Process:
    1. Randomize agent order for this tick
    2. For each agent in randomized order:
       - For each card in their purchase list:
         - If card still on market and agent has budget:
           - Execute purchase
           - Remove from all other agents' lists
           - Log event
           - Move to next agent
    
    Returns: number of cards purchased
    """
    from .world import Event
    
    purchases_made = 0
    processed_cards = set()  # Track cards already bought
    
    # Randomize agent order for this tick
    a_rng = random.Random(world_state.tick + 9000)
    agents_list = list(world_state.agents.values())
    a_rng.shuffle(agents_list)
    
    for agent in agents_list:
        if agent.id not in purchase_lists:
            continue
        
        purchase_list = purchase_lists[agent.id]
        
        for item in purchase_list:
            card_id = item.card_instance_id
            
            # Skip if already purchased
            if card_id in processed_cards:
                continue
            
            # Check if card still on marketplace
            marketplace_result = world_state.buy_from_marketplace(card_id, agent.id)
            
            if marketplace_result:
                seller_id, card_instance, listing_price = marketplace_result
                seller = world_state.agents.get(seller_id)
                
                if seller:
                    purchases_made += 1
                    processed_cards.add(card_id)
                    
                    # Log purchase event
                    description = (
                        f"{agent.name} bought {card_instance.card_name} from {seller.name} "
                        f"for {listing_price} Prism"
                    )
                    event = Event(
                        tick=world_state.tick,
                        agent_id=agent.id,
                        event_type="card_purchased",
                        description=description,
                        agent_ids=[agent.id, seller_id],
                        triggered=True,
                    )
                    world_state.add_event(event)
                    
                    # Remove this card from all other agents' purchase lists
                    for other_id, other_list in purchase_lists.items():
                        if other_id != agent.id:
                            purchase_lists[other_id] = [
                                item for item in other_list
                                if item.card_instance_id != card_id
                            ]
                
                # Agent buys max 1 card per cycle
                break
    
    return purchases_made


def build_sell_lists(world_state) -> Dict[int, List[SellListItem]]:
    """
    Build sell lists for all agents based on their traits and inventory.
    
    Each agent evaluates their own cards and decides which to list.
    Returns dict: agent_id -> list of SellListItem
    """
    sell_lists = {}
    
    for agent in world_state.agents.values():
        sell_list = []
        a_rng = random.Random(agent.rng_seed + world_state.tick + 5000)
        
        for card_id, card_instance in agent.card_instances.items():
            should_sell = False
            reason = ""
            
            # Quality-based selling (low quality = should sell)
            if card_instance.quality_score < 3.0:
                should_sell = True
                reason = "low_quality"
            
            # Loss-based selling (losing cards)
            elif card_instance.loss_count > 3:
                should_sell = True
                reason = "high_losses"
            
            # Trait-based selling
            if not should_sell and agent.traits:
                if agent.traits.scavenger_trait > 0.5:
                    # Scavengers aggressively rotate: 5% chance
                    if a_rng.random() < 0.05:
                        should_sell = True
                        reason = "scavenger_rotation"
                
                elif agent.traits.gambler_trait > 0.5:
                    # Gamblers chaotic: 8% chance
                    if a_rng.random() < 0.08:
                        should_sell = True
                        reason = "gambler_chaotic"
                
                elif agent.traits.collector_trait > 0.5:
                    # Collectors rarely sell high-rarity cards
                    if card_instance.card_rarity in ['Common'] and a_rng.random() < 0.03:
                        should_sell = True
                        reason = "collector_excess_common"
                
                elif agent.traits.competitor_trait > 0.5:
                    # Competitors sell after losses to rebuild
                    if card_instance.loss_count > 2 and a_rng.random() < 0.04:
                        should_sell = True
                        reason = "competitor_rebuild"
                
                else:
                    # Default conservative: 2% chance
                    if a_rng.random() < 0.02:
                        should_sell = True
                        reason = "default_rotation"
            
            if should_sell:
                # Calculate listing price based on urgency
                base_price = card_instance.current_price
                
                # Determine urgency: need to buy boosters soon = urgent
                # Check if agent has low Prism and poor card collection
                urgency_score = 0.0
                if agent.prism < 50:  # Running low on funds
                    urgency_score = 1.0 - (agent.prism / 50.0)  # 0.0 (50+ prism) to 1.0 (0 prism)
                
                # Price multiplier based on urgency and traits
                if urgency_score > 0.7:
                    # Urgent: discount 5% to sell quickly
                    multiplier = 0.95
                elif urgency_score < 0.3:
                    # No rush: can markup 1-20% based on traits
                    # Default: 1.0 (no markup), collectors can go to +20%, gamblers +10%
                    if agent.traits:
                        if agent.traits.collector_trait > 0.5:
                            # Collectors confident in prices, markup up to 20%
                            multiplier = 1.0 + (agent.traits.collector_trait * 0.2)
                        elif agent.traits.gambler_trait > 0.5:
                            # Gamblers add 10% variance
                            multiplier = 1.0 + a_rng.uniform(0.0, 0.1)
                        else:
                            multiplier = 1.0  # Default no markup
                    else:
                        multiplier = 1.0
                else:
                    # Moderate: neutral pricing
                    multiplier = 1.0
                
                # Quality adjustments (scavengers still price lower despite other factors)
                if agent.traits and agent.traits.scavenger_trait > 0.5:
                    multiplier *= 0.85  # Scavengers always reduce by 15%
                
                suggested_price = max(0.1, round(base_price * multiplier, 2))
                
                item = SellListItem(
                    card_instance_id=card_id,
                    card_instance=card_instance,
                    suggested_price=suggested_price,
                )
                sell_list.append(item)
        
        sell_lists[agent.id] = sell_list
    
    return sell_lists


def execute_selling_phase(world_state, sell_lists: Dict[int, List[SellListItem]]) -> int:
    """
    Execute selling phase: agents list cards on marketplace in random order each tick.
    
    Process:
    1. Randomize agent order for this tick
    2. For each agent in randomized order:
       - For each card in their sell list:
         - Add to marketplace
         - Log event
    
    Returns: number of cards listed
    """
    from .world import Event
    
    cards_listed = 0
    
    # Randomize agent order for this tick
    a_rng = random.Random(world_state.tick + 8000)
    agents_list = list(world_state.agents.values())
    a_rng.shuffle(agents_list)
    
    for agent in agents_list:
        if agent.id not in sell_lists:
            continue
        
        sell_list = sell_lists[agent.id]
        
        for item in sell_list:
            card_id = item.card_instance_id
            
            # Add to marketplace (card stays in seller's inventory until purchased)
            world_state.list_card_for_sale(
                card_instance_id=card_id,
                seller_agent_id=agent.id,
                card_instance=item.card_instance,
                listing_price=item.suggested_price,
            )
            
            cards_listed += 1
            
            # Log listing event
            description = (
                f"{agent.name} listed {item.card_instance.card_name} "
                f"(quality: {item.card_instance.quality_score:.1f}, "
                f"desirability: {item.card_instance.desirability:.1f}) "
                f"for {item.suggested_price} Prism"
            )
            event = Event(
                tick=world_state.tick,
                agent_id=agent.id,
                event_type="card_listed",
                description=description,
                agent_ids=[agent.id],
                triggered=True,
            )
            world_state.add_event(event)
    
    return cards_listed


def run_trading_cycle(world_state) -> Dict:
    """
    Run a complete trading cycle (buy + sell).
    
    Called every 3 ticks.
    
    Returns:
        dict with keys:
        - 'purchases_made': int
        - 'cards_listed': int
    """
    # Phase 1: Buying
    purchase_lists = build_purchase_lists(world_state)
    purchases_made = execute_buying_phase(world_state, purchase_lists)
    
    # Phase 2: Selling
    sell_lists = build_sell_lists(world_state)
    cards_listed = execute_selling_phase(world_state, sell_lists)
    
    return {
        'purchases_made': purchases_made,
        'cards_listed': cards_listed,
    }
