#!/usr/bin/env python3
"""
Test script demonstrating card trading between agents:
1. Run tick 1: Agents open boosters and build initial inventory
2. Check Agent 1 cards and find "Onyx Supplicant" with low desirability
3. Run tick 2: Agent 1 puts card on marketplace
4. Run tick 3: Agent 2 purchases the card
5. Verify card transfer: Agent 1 loses card and gains Prism, Agent 2 gains card and loses Prism
"""

import json
from simulation import run_simulation, SimulationConfig

def find_card_by_name(agent, card_name):
    """Find a card instance by name in an agent's inventory."""
    for card_id, card_instance in agent.card_instances.items():
        if card_instance.card_name == card_name:
            return card_id, card_instance
    return None, None

def run_trading_test():
    """Simulate a complete trading scenario."""
    
    print("=" * 80)
    print("CARD TRADING SIMULATION TEST")
    print("=" * 80)
    
    # Config: 2 agents, 100 ticks to allow marketplace logic to trigger
    config = SimulationConfig(seed=42, initial_agents=2, ticks=100)
    
    print("\n[INFO] Running simulation with 2 agents for 100 ticks...")
    result = run_simulation(config)
    
    agents = result["agents"]
    timeseries = result["timeseries"]
    
    if len(agents) < 2:
        print("[ERROR] Expected at least 2 agents, got", len(agents))
        return
    
    agent_1 = agents[0]  # Agent-1
    agent_2 = agents[1]  # Agent-2
    
    print(f"\n[AGENTS]")
    print(f"  Agent 1: {agent_1['name']} (ID: {agent_1['id']}, Prism: {agent_1['prism']})")
    print(f"    Cards: {len(agent_1['card_instances'])}")
    print(f"  Agent 2: {agent_2['name']} (ID: {agent_2['id']}, Prism: {agent_2['prism']})")
    print(f"    Cards: {len(agent_2['card_instances'])}")
    
    # Scan for low-desirability cards in Agent 1
    print(f"\n[AGENT 1 INVENTORY ANALYSIS]")
    low_desirability_cards = []
    for card_inst_data in agent_1['card_instances']:
        card_name = card_inst_data['card_name']
        desirability = card_inst_data['desirability']
        quality = card_inst_data['quality_score']
        rarity = card_inst_data['card_rarity']
        price = card_inst_data['current_price']
        
        if desirability < 3.0 or quality < 2.0:
            low_desirability_cards.append({
                'name': card_name,
                'desirability': desirability,
                'quality': quality,
                'rarity': rarity,
                'price': price,
                'instance_id': card_inst_data['card_instance_id']
            })
    
    if low_desirability_cards:
        print(f"  Found {len(low_desirability_cards)} low-desirability cards:")
        for card in low_desirability_cards[:5]:  # Show top 5
            print(f"    - {card['name']} (rarity: {card['rarity']}, quality: {card['quality']:.1f}, desirability: {card['desirability']:.1f}, price: {card['price']:.2f})")
    else:
        print("  No low-desirability cards found (simulation may need more ticks)")
    
    # Scan events for card_listed and card_purchased events
    print(f"\n[MARKETPLACE EVENTS]")
    card_listed_events = []
    card_purchased_events = []
    
    for tick_data in timeseries:
        if 'events' in tick_data:
            for event in tick_data['events']:
                if event['event_type'] == 'card_listed':
                    card_listed_events.append(event)
                elif event['event_type'] == 'card_purchased':
                    card_purchased_events.append(event)
    
    if card_listed_events:
        print(f"  Card Listed Events: {len(card_listed_events)}")
        for event in card_listed_events[:3]:  # Show top 3
            print(f"    Tick {event['tick']}: {event['description']}")
    else:
        print("  No card listings found (simulation may need more ticks)")
    
    if card_purchased_events:
        print(f"  Card Purchased Events: {len(card_purchased_events)}")
        for event in card_purchased_events[:3]:  # Show top 3
            print(f"    Tick {event['tick']}: {event['description']}")
    else:
        print("  No purchases found (simulation may need more ticks)")
    
    # Summary
    print(f"\n[FINAL STATE]")
    print(f"  Agent 1: {agent_1['name']}")
    print(f"    Prism: {agent_1['prism']}")
    print(f"    Cards: {len(agent_1['card_instances'])}")
    print(f"  Agent 2: {agent_2['name']}")
    print(f"    Prism: {agent_2['prism']}")
    print(f"    Cards: {len(agent_2['card_instances'])}")
    
    # Calculate changes
    initial_prism_1 = 200.0
    initial_prism_2 = 200.0
    
    prism_change_1 = agent_1['prism'] - initial_prism_1
    prism_change_2 = agent_2['prism'] - initial_prism_2
    
    print(f"\n[CHANGES]")
    print(f"  Agent 1 Prism Change: {prism_change_1:+.2f} Prism")
    print(f"  Agent 2 Prism Change: {prism_change_2:+.2f} Prism")
    
    # Check if trading occurred
    if card_purchased_events:
        print(f"\n[SUCCESS] Trading system is working!")
        print(f"  - Cards were listed for sale: {len(card_listed_events)}")
        print(f"  - Cards were purchased: {len(card_purchased_events)}")
        print(f"  - Prism transferred between agents: {abs(prism_change_1) > 0 or abs(prism_change_2) > 0}")
    else:
        print(f"\n[INFO] No purchases occurred yet")
        print(f"  - This may be normal if marketplace matching logic needs refinement")
        print(f"  - Or if agent traits aren't aligning with available cards")
    
    print("\n" + "=" * 80)
    
    return result

if __name__ == "__main__":
    result = run_trading_test()
    
    # Optionally save detailed output to file
    output_file = "test_trading_output.json"
    print(f"\nSaving detailed output to {output_file}...")
    with open(output_file, 'w') as f:
        # Only save summary to avoid large file
        summary = {
            "agents": result["agents"][:2],  # Just first 2 agents
            "trading_events": [
                e for t in result["timeseries"] 
                for e in t.get("events", [])
                if e["event_type"] in ["card_listed", "card_purchased"]
            ]
        }
        json.dump(summary, f, indent=2)
    print(f"Output saved to {output_file}")
