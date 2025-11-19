#!/usr/bin/env python3
from simulation import SimulationConfig, run_simulation

cfg = SimulationConfig(seed=42, initial_agents=3, ticks=1)
result = run_simulation(cfg)

print("Agents:")
for agent in result['agents']:
    prism = agent['prism']
    boosters = agent['booster_count']
    cards = agent['collection_count']
    print(
        f"  Agent {agent['id']}: Prism={prism:.1f}, "
        f"Boosters={boosters}, Cards={cards}"
    )

print("\nEvents:")
for event in result['events']:
    print(f"  T{event['tick']}: {event['description']}")
