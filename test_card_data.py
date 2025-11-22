#!/usr/bin/env python3
"""Test that card data is being properly populated."""

from simulation.engine import run_simulation, SimulationConfig

cfg = SimulationConfig(seed=42, initial_agents=2, ticks=1)
result = run_simulation(cfg)

# Check if agent has card_instances
agent = result['agents'][0]
print(f'Agent 1 card count: {len(agent["card_instances"])}')
if agent['card_instances']:
    card = agent['card_instances'][0]
    print(f'First card name: {card.get("card_name", "MISSING")}')
    print(f'Gem colored: {card.get("gem_colored", "MISSING")}')
    print(f'Gem colorless: {card.get("gem_colorless", "MISSING")}')
    print(f'Cost format: {card.get("gem_colored", 0)}/{card.get("gem_colorless", 0)}')
    print(f'Flavor text: {card.get("flavor_text", "MISSING")[:50]}...')
    print(f'Desirability: {card.get("desirability", "MISSING")}')
    print(f'Quality score: {card.get("quality_score", "MISSING")}')
    print(f'Current price: {card.get("current_price", "MISSING")}')
else:
    print("NO CARDS FOUND!")
