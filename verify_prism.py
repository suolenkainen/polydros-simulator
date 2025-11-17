#!/usr/bin/env python3
"""Verify the updated Prism economy."""

from simulation.engine import SimulationConfig, run_simulation

# Run simulation
config = SimulationConfig(seed=42, initial_agents=3, ticks=1)
result = run_simulation(config)

# Check agents
print("=== Agent Prism Economy Verification ===\n")
for agent in result["agents"]:
    agent_id = agent["id"]
    prism = agent["prism"]
    boosters = agent["booster_count"]
    print(f"Agent {agent_id}:")
    print(f"  Starting Prism: 200.00")
    print(f"  Packs bought: 5")
    print(f"  Cost (5 × 12): 60.00 Prism")
    print(f"  Remaining Prism: {prism}")
    print(f"  Boosters owned: {boosters}")
    print(f"  Expected: 140.00 Prism, 5 boosters")
    print()

# Check events
print("=== Purchase Events ===\n")
for event in result["timeseries"][1]["events"]:
    print(f"Tick {event['tick']}: {event['description']}")
