#!/usr/bin/env python3
"""Test that 100 ticks runs successfully without errors."""

from simulation.engine import run_simulation, SimulationConfig

print("Running 100-tick simulation with 10 agents...")
cfg = SimulationConfig(seed=42, initial_agents=10, ticks=100)
result = run_simulation(cfg)

print(f"✓ Simulation completed successfully!")
print(f"  Ticks: {result['config']['ticks']}")
print(f"  Agents: {len(result['agents'])}")
print(f"  Final tick: {result['final'].get('tick')}")
print(f"  Total events: {len(result['events'])}")

# Check data size
import json
data_json = json.dumps(result)
data_size_mb = len(data_json) / (1024 * 1024)
print(f"  Total data size: {data_size_mb:.2f} MB")

if data_size_mb > 5:
    print(f"  ⚠ Warning: Data exceeds typical sessionStorage limit (5MB)")
    print(f"    This is why sessionStorage persistence was removed from App.tsx")
else:
    print(f"  ✓ Data size within sessionStorage limit")
