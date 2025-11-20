#!/usr/bin/env python3
"""Test market snapshot."""

from simulation.engine import run_simulation, SimulationConfig

config = SimulationConfig(seed=42, initial_agents=2, ticks=1)
result = run_simulation(config)

for i, tick in enumerate(result['timeseries']):
    print(f"\nTick {i}:")
    print(f"  Keys: {list(tick.keys())}")
    if 'market_snapshot' in tick:
        snapshot = tick['market_snapshot']
        print(f"  Market Snapshot:")
        print(f"    Total Instances: {snapshot['total_card_instances']}")
        print(f"    Unique Cards: {snapshot['unique_cards_in_circulation']}")
        print(f"    Price Index: {snapshot['price_index']:.2f}")
    else:
        print(f"  NO MARKET SNAPSHOT")

print("\n\nAgent card instances count:")
for agent in result['agents']:
    print(f"  Agent {agent['id']}: {len(agent.get('card_instances', []))} instances")
