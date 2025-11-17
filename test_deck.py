#!/usr/bin/env python3
"""Verify the deck structure."""

from simulation.engine import SimulationConfig, run_simulation
import json

# Run simulation
config = SimulationConfig(seed=42, initial_agents=1, ticks=1)
result = run_simulation(config)

# Check agent and deck
agent = result["agents"][0]
deck = agent.get("deck", [])

print("=== Agent Deck Verification ===\n")
print(f"Agent: {agent['name']}")
print(f"Prism: {agent['prism']}")
print(f"Collection count: {agent['collection_count']}")
print(f"Deck size: {len(deck)}\n")

print("=== First 10 Deck Cards ===\n")
for i, card in enumerate(deck[:10]):
    print(f"{i+1}. {card['name']:30} | Color: {card['color']:8} | Power: {card['power']} | Health: {card['health']} | Cost: {card['cost']}")

print(f"\n... ({len(deck) - 10} more cards in deck)")

print("\n=== Full Collection (first 3 cards) ===\n")
for i, card in enumerate(agent['full_collection'][:3]):
    print(f"{i+1}. {card['name']:30} | Rarity: {card['rarity']:12} | Price: {card['price']:.2f}")

print("\n✓ Deck successfully created with:")
print(f"  - {len(deck)} total cards")
print(f"  - Name, Color, Power, Health, Cost fields")
print(f"  - Collection preserved with full details")
