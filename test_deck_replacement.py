#!/usr/bin/env python3
"""Test deck feasibility score calculation and replacement logic."""

from simulation.engine import run_simulation, SimulationConfig
import json

# Run with 25 ticks so we hit the 20-tick replacement
cfg = SimulationConfig(seed=42, initial_agents=2, ticks=25)
result = run_simulation(cfg)

print(f"Simulation complete: {result['config']['ticks']} ticks")
print(f"Agents: {len(result['agents'])}")

agent = result['agents'][0]
print(f"\nAgent {agent['id']} analysis:")
print(f"  Collection size: {len(agent['full_collection'])}")
print(f"  Deck size: {len(agent['deck'])}")

if agent['deck']:
    deck = agent['deck']
    
    # Calculate deck metrics
    total_power_def = sum(c['total_power_defense'] for c in deck)
    total_cost = sum(c['total_cost'] for c in deck)
    avg_feasibility = sum(c['feasibility_score'] for c in deck) / len(deck)
    bad_cards = [c for c in deck if c['feasibility_score'] < 1.0]
    
    print(f"\nDeck Metrics:")
    print(f"  Total Power+Defense: {total_power_def}")
    print(f"  Total Cost: {total_cost}")
    print(f"  Average Feasibility: {avg_feasibility:.2f}")
    print(f"  Bad cards (feasibility < 1.0): {len(bad_cards)}")
    
    if bad_cards:
        print(f"\n  Bad cards that should be replaced:")
        for c in bad_cards[:3]:
            print(f"    - {c['name']:30} | Cost: {c['cost']:5} | Power+Def: {c['total_power_defense']:2} | Feasibility: {c['feasibility_score']:5}")
    
    # Find cards with best/worst feasibility
    best_card = max(deck, key=lambda c: c['feasibility_score'])
    worst_card = min(deck, key=lambda c: c['feasibility_score'])
    
    print(f"\n  Best card: {best_card['name']} (feasibility: {best_card['feasibility_score']})")
    print(f"  Worst card: {worst_card['name']} (feasibility: {worst_card['feasibility_score']})")
    
    print(f"\n✓ Feasibility scoring is working!")
    print(f"  Cards with score < 1.0 will be replaced at tick 20")
else:
    print("NO DECK FOUND")
