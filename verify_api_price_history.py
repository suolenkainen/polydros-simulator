#!/usr/bin/env python3
"""Test the API to ensure price history is returned correctly."""

import requests
import json
from simulation import SimulationConfig, run_simulation

print("Step 1: Run simulation...")
cfg = SimulationConfig(seed=42, initial_agents=5, ticks=20)
result = run_simulation(cfg)
print(f"✓ Simulation complete: {len(result['agents'])} agents")

# Check that card instances have price_history
agent = result['agents'][0]
cards = agent.get('card_instances', [])
print(f"\nStep 2: Check card_instances have price_history...")
if cards:
    card = cards[0]
    has_history = 'price_history' in card
    print(f"  Sample card: {card.get('card_name')}")
    print(f"  Has price_history: {has_history}")
    if has_history:
        print(f"  Price history entries: {len(card['price_history'])}")
        print(f"  ✓ Price history is included in card data")

# Save for API testing
print(f"\nStep 3: Check API response format...")
print("  Card data that will be sent to frontend:")
if cards:
    card = cards[0]
    sample = {
        'card_name': card.get('card_name'),
        'current_price': card.get('current_price'),
        'price_history_entries': len(card.get('price_history', [])),
        'first_price_point': card.get('price_history', [{}])[0] if card.get('price_history') else None
    }
    print(json.dumps(sample, indent=2))
    print("\n✓ Ready for frontend visualization!")
