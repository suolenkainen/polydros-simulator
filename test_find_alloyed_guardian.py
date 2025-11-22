#!/usr/bin/env python3
"""Check if Alloyed Guardian card exists and show its details."""

from simulation import SimulationConfig, run_simulation

# Run a longer simulation to get more chances of finding Alloyed Guardian
print("Running 50-tick simulation with 10 agents to find Alloyed Guardian...")
cfg = SimulationConfig(seed=42, initial_agents=10, ticks=50)
result = run_simulation(cfg)

# Search for Alloyed Guardian
found_cards = []
agents = result.get('agents', [])
for agent in agents:
    card_instances = agent.get('card_instances', [])
    for card in card_instances:
        if 'alloyed guardian' in card.get('card_name', '').lower():
            found_cards.append({
                'card': card,
                'agent_id': agent.get('id')
            })

if found_cards:
    print(f"\n✓ Found {len(found_cards)} instance(s) of Alloyed Guardian!\n")
    for i, entry in enumerate(found_cards[:3]):  # Show first 3
        card = entry['card']
        agent_id = entry['agent_id']
        price_hist = card.get('price_history', [])
        
        print(f"Instance #{i+1} (Agent {agent_id}):")
        print(f"  Card ID: {card.get('card_id')}")
        print(f"  Current Price: {card.get('current_price')}")
        print(f"  Quality Score: {card.get('quality_score')}")
        print(f"  Rarity: {card.get('card_rarity')}")
        print(f"  Price History Points: {len(price_hist)}")
        if price_hist:
            print(f"    First: Tick {price_hist[0]['tick']}, Price {price_hist[0]['price']}")
            print(f"    Last: Tick {price_hist[-1]['tick']}, Price {price_hist[-1]['price']}")
        print()
else:
    print("\n✗ Alloyed Guardian not found in this run")
    print("\nShowing all unique cards found:")
    all_cards = set()
    for agent in agents:
        for card in agent.get('card_instances', []):
            all_cards.add(card.get('card_name'))
    for card_name in sorted(all_cards)[:10]:
        print(f"  - {card_name}")
