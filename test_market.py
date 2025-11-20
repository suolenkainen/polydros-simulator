#!/usr/bin/env python3
"""Quick test of market functionality."""

from simulation.engine import run_simulation, SimulationConfig

config = SimulationConfig(seed=42, initial_agents=2, ticks=1)
result = run_simulation(config)

agent = result['agents'][0]
print(f"Agent 1 name: {agent['name']}")
print(f"Agent 1 card_instances: {len(agent.get('card_instances', []))}")

if agent.get('card_instances'):
    first_card = agent['card_instances'][0]
    print(f"\nFirst card instance:")
    print(f"  ID: {first_card['card_instance_id']}")
    print(f"  Card ID: {first_card['card_id']}")
    print(f"  Quality: {first_card['quality_score']}")
    print(f"  Desirability: {first_card['desirability']}")
    print(f"  Condition: {first_card['condition']}")
    print(f"  Price History Points: {len(first_card.get('price_history', []))}")

# Check market snapshot
if result['timeseries']:
    tick = result['timeseries'][0]
    if 'market_snapshot' in tick:
        snapshot = tick['market_snapshot']
        print(f"\nMarket Snapshot (Tick 0):")
        print(f"  Total Instances: {snapshot['total_card_instances']}")
        print(f"  Unique Cards: {snapshot['unique_cards_in_circulation']}")
        print(f"  Price Index: {snapshot['price_index']:.2f}")

print("\nTest completed successfully!")
