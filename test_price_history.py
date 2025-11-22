#!/usr/bin/env python3
"""Quick test to verify price history is populated."""

from simulation import run_simulation, SimulationConfig

# Run a short simulation
print("Running 10-tick simulation with 3 agents...")
cfg = SimulationConfig(seed=42, initial_agents=3, ticks=10)
result = run_simulation(cfg)

# Find a card instance and check its price history
agents = result.get('agents', [])
if agents:
    agent = agents[0]
    card_instances = agent.get('card_instances', [])
    if card_instances:
        # Find the first card with price history
        for i, card in enumerate(card_instances):
            price_history = card.get('price_history', [])
            if price_history:
                print(f"\n✓ Found card with price history!")
                print(f"  Card #{i}: {card.get('card_name')}")
                print(f"  Price History entries: {len(price_history)}")
                print(f"  First entry: {price_history[0]}")
                print(f"  Last entry: {price_history[-1]}")
                break
        else:
            print("\n✗ No cards with price history found")
    else:
        print("✗ No card instances found")
else:
    print("✗ No agents found")
