#!/usr/bin/env python3
"""
Debug script to understand card desirability and why trading isn't triggering.
"""

import json
from simulation import run_simulation, SimulationConfig

def debug_trading():
    """Run simulation and debug card desirability."""
    
    print("=" * 80)
    print("DEBUG: Card Desirability and Marketplace Triggering")
    print("=" * 80)
    
    # Shorter sim with 2 agents
    config = SimulationConfig(seed=42, initial_agents=2, ticks=50)
    
    print("\n[INFO] Running simulation...")
    result = run_simulation(config)
    
    agents = result["agents"]
    timeseries = result["timeseries"]
    
    agent_1 = agents[0]
    
    print(f"\n[AGENT 1 CARDS ANALYSIS]")
    print(f"  Total cards in inventory: {len(agent_1['card_instances'])}")
    
    # Analyze card desirability distribution
    desirabilities = []
    qualities = []
    min_desir_card = None
    min_desir_value = 10.0
    
    for card_inst in agent_1['card_instances']:
        des = card_inst['desirability']
        qual = card_inst['quality_score']
        desirabilities.append(des)
        qualities.append(qual)
        
        if des < min_desir_value:
            min_desir_value = des
            min_desir_card = card_inst
    
    avg_desir = sum(desirabilities) / len(desirabilities) if desirabilities else 0
    avg_qual = sum(qualities) / len(qualities) if qualities else 0
    
    print(f"  Desirability Stats:")
    print(f"    Min: {min(desirabilities):.2f}")
    print(f"    Avg: {avg_desir:.2f}")
    print(f"    Max: {max(desirabilities):.2f}")
    print(f"  Quality Stats:")
    print(f"    Min: {min(qualities):.2f}")
    print(f"    Avg: {avg_qual:.2f}")
    print(f"    Max: {max(qualities):.2f}")
    
    if min_desir_card and min_desir_card['desirability'] < 3.0:
        print(f"\n  Card with LOWEST desirability (< 3.0 threshold):")
        print(f"    Name: {min_desir_card['card_name']}")
        print(f"    Rarity: {min_desir_card['card_rarity']}")
        print(f"    Desirability: {min_desir_card['desirability']:.2f}")
        print(f"    Quality: {min_desir_card['quality_score']:.2f}")
        print(f"    Price: {min_desir_card['current_price']:.2f}")
    else:
        print(f"\n  ⚠ No cards with desirability < 3.0 threshold")
        print(f"  Cards with quality < 2.0 (degraded)?")
        degraded_cards = [c for c in agent_1['card_instances'] if c['quality_score'] < 2.0]
        if degraded_cards:
            print(f"    Found {len(degraded_cards)} degraded cards")
            for card in degraded_cards[:2]:
                print(f"      - {card['card_name']}: quality={card['quality_score']:.2f}")
        else:
            print(f"    No degraded cards either")
    
    # Check events
    print(f"\n[MARKETPLACE EVENTS]")
    all_events = []
    for tick_data in timeseries:
        if 'events' in tick_data:
            for event in tick_data['events']:
                if event['event_type'] in ['card_listed', 'card_purchased', 'card_discarded', 'play', 'combat']:
                    all_events.append((tick_data['tick'], event))
    
    if all_events:
        print(f"  Total marketplace/play/combat events: {len(all_events)}")
        print(f"  Event breakdown:")
        event_types = {}
        for _, event in all_events:
            et = event['event_type']
            event_types[et] = event_types.get(et, 0) + 1
        for et, count in sorted(event_types.items()):
            print(f"    {et}: {count}")
        
        # Show card_listed events
        card_listed = [e for _, e in all_events if e['event_type'] == 'card_listed']
        if card_listed:
            print(f"\n  Card Listed Events ({len(card_listed)}):")
            for event in card_listed[:3]:
                print(f"    Tick {event['tick']}: {event['description']}")
        else:
            print(f"\n  No card_listed events found")
    else:
        print(f"  No marketplace/play/combat events found")
    
    # Check agent traits
    print(f"\n[AGENT TRAITS]")
    print(f"  Agent 1 traits: {agent_1.get('traits', 'N/A')}")
    print(f"  Agent 2 traits: {agents[1].get('traits', 'N/A') if len(agents) > 1 else 'N/A'}")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    debug_trading()
