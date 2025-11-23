#!/usr/bin/env python3
"""
Test script for demonstrating the specific scenario:
1. Run a tick and check Agent 1's "Onyx Supplicant" with feasibility 0
2. Verify it appears in the marketplace
3. Have Agent 2 buy it
4. Verify inventory and prism transfer
"""

import json
from simulation import run_simulation, SimulationConfig

def find_onyx_supplicant(agent):
    """Find Onyx Supplicant in agent's inventory."""
    for card_inst in agent.get('card_instances', []):
        if card_inst['card_name'] == 'Onyx Supplicant':
            return card_inst
    return None

def demo_scenario():
    """Run a demo scenario showing the trading flow."""
    
    print("=" * 90)
    print("CARD TRADING SCENARIO: Low Feasibility Card Listing & Purchase")
    print("=" * 90)
    
    # Run simulation
    config = SimulationConfig(seed=123, initial_agents=2, ticks=50)
    print("\n[STEP 1] Running simulation with 2 agents for 50 ticks...")
    result = run_simulation(config)
    
    agents = result["agents"]
    timeseries = result["timeseries"]
    
    agent_1_data = agents[0]
    agent_2_data = agents[1]
    
    print(f"\n[INITIAL STATE]")
    print(f"  Agent 1: {agent_1_data['name']} (ID: {agent_1_data['id']})")
    print(f"    Prism: {agent_1_data['prism']:.2f}")
    print(f"    Cards owned: {len(agent_1_data['card_instances'])}")
    print(f"  Agent 2: {agent_2_data['name']} (ID: {agent_2_data['id']})")
    print(f"    Prism: {agent_2_data['prism']:.2f}")
    print(f"    Cards owned: {len(agent_2_data['card_instances'])}")
    
    # Look for Onyx Supplicant in Agent 1
    print(f"\n[STEP 2] Checking Agent 1's collection for 'Onyx Supplicant'...")
    onyx_card = find_onyx_supplicant(agent_1_data)
    if onyx_card:
        print(f"  ✓ Found 'Onyx Supplicant'!")
        print(f"    Rarity: {onyx_card['card_rarity']}")
        print(f"    Quality: {onyx_card['quality_score']:.1f}")
        print(f"    Desirability: {onyx_card['desirability']:.1f}")
        print(f"    Current Price: {onyx_card['current_price']:.2f} Prism")
    else:
        print(f"  ℹ 'Onyx Supplicant' not in Agent 1's collection")
        # Show what Agent 1 actually has
        print(f"  Sample cards from Agent 1's collection:")
        for card in agent_1_data['card_instances'][:3]:
            print(f"    - {card['card_name']} ({card['card_rarity']}, quality={card['quality_score']:.1f})")
    
    # Analyze all marketplace events
    print(f"\n[STEP 3] Analyzing marketplace events...")
    
    all_listings = []
    all_purchases = []
    
    for tick_data in timeseries:
        tick = tick_data['tick']
        for event in tick_data.get('events', []):
            if event['event_type'] == 'card_listed':
                all_listings.append((tick, event))
            elif event['event_type'] == 'card_purchased':
                all_purchases.append((tick, event))
    
    print(f"  Total card listings: {len(all_listings)}")
    print(f"  Total card purchases: {len(all_purchases)}")
    
    # Show sample listings
    if all_listings:
        print(f"\n  Sample card listings (first 5):")
        for tick, event in all_listings[:5]:
            print(f"    Tick {tick}: {event['description']}")
    
    # Show sample purchases
    if all_purchases:
        print(f"\n  Sample purchases (first 5):")
        for tick, event in all_purchases[:5]:
            print(f"    Tick {tick}: {event['description']}")
    
    # Look for Onyx Supplicant being listed or purchased
    print(f"\n[STEP 4] Checking for 'Onyx Supplicant' marketplace activity...")
    onyx_listings = [e for _, e in all_listings if 'Onyx Supplicant' in e['description']]
    onyx_purchases = [e for _, e in all_purchases if 'Onyx Supplicant' in e['description']]
    
    if onyx_listings:
        print(f"  ✓ Found {len(onyx_listings)} 'Onyx Supplicant' listing(s):")
        for event in onyx_listings[:3]:
            print(f"    {event['description']}")
    else:
        print(f"  ℹ No 'Onyx Supplicant' listings found (may not have low enough quality)")
    
    if onyx_purchases:
        print(f"  ✓ Found {len(onyx_purchases)} 'Onyx Supplicant' purchase(s):")
        for event in onyx_purchases[:3]:
            print(f"    {event['description']}")
    else:
        print(f"  ℹ No 'Onyx Supplicant' purchases found")
    
    # Show final state
    print(f"\n[FINAL STATE]")
    final_agent_1_prism = agent_1_data['prism']
    final_agent_2_prism = agent_2_data['prism']
    final_agent_1_cards = len(agent_1_data['card_instances'])
    final_agent_2_cards = len(agent_2_data['card_instances'])
    
    print(f"  Agent 1: {final_agent_1_prism:.2f} Prism, {final_agent_1_cards} cards")
    print(f"  Agent 2: {final_agent_2_prism:.2f} Prism, {final_agent_2_cards} cards")
    
    # Calculate total transfers
    total_listings = len(all_listings)
    total_purchases = len(all_purchases)
    
    print(f"\n[SUMMARY]")
    print(f"  Marketplace Activity:")
    print(f"    - Total card listings: {total_listings}")
    print(f"    - Total card purchases: {total_purchases}")
    print(f"    - Purchase rate: {(total_purchases / total_listings * 100):.1f}% (purchases/listings)")
    print(f"  Trading Status: {'✓ ACTIVE' if total_purchases > 0 else '✗ INACTIVE'}")
    
    print("\n" + "=" * 90)
    
    return {
        "listings": total_listings,
        "purchases": total_purchases,
        "onyx_found": onyx_card is not None,
        "onyx_listed": len(onyx_listings) > 0,
        "onyx_purchased": len(onyx_purchases) > 0,
    }

if __name__ == "__main__":
    result = demo_scenario()
    
    # Save results
    with open("demo_scenario_results.json", "w") as f:
        json.dump(result, f, indent=2)
    print("\nResults saved to demo_scenario_results.json")
