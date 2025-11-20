#!/usr/bin/env python3
"""Check if card metadata is being included in the response."""

import json
from simulation.engine import run_simulation, SimulationConfig

cfg = SimulationConfig(seed=42, initial_agents=2, ticks=1)
result = run_simulation(cfg)

# Check first agent's card instances
if result['agents']:
    agent = result['agents'][0]
    if agent['card_instances']:
        instance = agent['card_instances'][0]
        print("Card Instance (first):")
        print(json.dumps(instance, indent=2, default=str))
