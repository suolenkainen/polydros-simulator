#!/usr/bin/env python3
"""Test that agents data is properly returned in simulation response."""

from simulation.engine import run_simulation, SimulationConfig

# Run simulation
res = run_simulation(SimulationConfig(
    seed=42,
    initial_agents=2,
    ticks=1
))

print(f"Response keys: {list(res.keys())}")
print(f"Has 'agents' key: {'agents' in res}")

if 'agents' in res:
    print(f"Number of agents: {len(res['agents'])}")
    if res['agents']:
        agent = res['agents'][0]
        print(f"\nFirst agent keys: {list(agent.keys())}")
        print(f"First agent has 'card_instances': {'card_instances' in agent}")
        if 'card_instances' in agent and agent['card_instances']:
            instance = agent['card_instances'][0]
            print(f"\nFirst card instance keys: {list(instance.keys())}")
            print(f"Has 'price_history': {'price_history' in instance}")
            if 'price_history' in instance:
                print(f"Price history points: {len(instance['price_history'])}")
                if instance['price_history']:
                    print(f"First price point: {instance['price_history'][0]}")
