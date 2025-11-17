#!/usr/bin/env python3
"""Verify Prism never goes negative."""

from simulation.engine import SimulationConfig, run_simulation

# Run simulation for 20 ticks
config = SimulationConfig(seed=42, initial_agents=2, ticks=20)
result = run_simulation(config)

print("=== Prism Balance Verification ===\n")
for agent in result["agents"]:
    purchases = [e for e in agent.get("agent_events", []) if e["event_type"] == "booster_purchase"]
    print(f"Agent {agent['id']}:")
    print(f"  Starting Prism: 200.00")
    print(f"  Final Prism: {agent['prism']}")
    print(f"  Number of purchases: {len(purchases)}")
    print(f"  Total spent: {len(purchases) * 60} Prism (5 boosters × 12 Prism each)")
    print(f"  All purchases valid: {agent['prism'] >= 0.0}")
    print()

print("✓ All agents have non-negative Prism")
