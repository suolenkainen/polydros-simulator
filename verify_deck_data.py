#!/usr/bin/env python3
"""Verify deck card data includes cost and total power-defence."""

from simulation.engine import run_simulation, SimulationConfig
import json

cfg = SimulationConfig(seed=42, initial_agents=1, ticks=1)
result = run_simulation(cfg)

agent = result['agents'][0]
deck = agent.get('deck', [])

print(f"Deck size: {len(deck)}")

if deck:
    card = deck[0]
    print(f"\nFirst card in deck:")
    print(f"  Name: {card.get('name')}")
    print(f"  Power: {card.get('power')}")
    print(f"  Health: {card.get('health')}")
    print(f"  Gem Colored: {card.get('gem_colored')}")
    print(f"  Gem Colorless: {card.get('gem_colorless')}")
    print(f"  Cost (formatted): {card.get('cost')}")
    print(f"  Total Power+Defense: {card.get('total_power_defense')}")
    print(f"  Total Cost: {card.get('total_cost')}")
    print(f"  Win Count: {card.get('win_count')}")
    print(f"  Loss Count: {card.get('loss_count')}")
    print(f"  Feasibility Score: {card.get('feasibility_score')}")
    
    # Check all required fields
    required_fields = ['card_id', 'name', 'type', 'color', 'power', 'health', 'gem_colored', 'gem_colorless', 'cost', 'total_power_defense', 'total_cost', 'win_count', 'loss_count', 'feasibility_score']
    print(f"\n  Field validation:")
    all_present = True
    for field in required_fields:
        present = field in card
        status = "✓" if present else "✗"
        print(f"    {status} {field}")
        if not present:
            all_present = False
    
    if all_present:
        print("\n✓ ALL FIELDS PRESENT!")
        
        # Show a few more cards to verify consistency
        print(f"\nSample of 5 cards:")
        for i, c in enumerate(deck[:5]):
            print(f"  {i+1}. {c['name']:30} | Cost: {c['cost']:5} | Power+Def: {c['total_power_defense']:2} | Feasibility: {c['feasibility_score']:5}")
    else:
        print("\n✗ SOME FIELDS MISSING")
else:
    print("NO DECK FOUND")
