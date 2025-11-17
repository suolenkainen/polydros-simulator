#!/usr/bin/env python3
from simulation import SimulationConfig, run_simulation

cfg = SimulationConfig(seed=42, initial_agents=3, ticks=1)
result = run_simulation(cfg)

print("Agents:")
for agent in result['agents']:
    print(f"  Agent {agent['id']}: Prism={agent['prism']:.1f}, Boosters={agent['booster_count']}, Cards={agent['collection_count']}")

print("\nEvents:")
for event in result['events']:
    print(f"  T{event['tick']}: {event['description']}")
