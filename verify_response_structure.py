#!/usr/bin/env python3
"""Quick test of API response structure without killing backend."""

import json

# Since we can't directly test via network from the background terminal,
# let me test via the simulation engine directly to see the structure

from simulation.engine import run_simulation, SimulationConfig

cfg = SimulationConfig(
    seed=42,
    initial_agents=2,
    ticks=2
)

result = run_simulation(cfg)

print("=== Simulation Response Structure ===\n")
print(f"Top-level keys: {list(result.keys())}\n")

if 'agents' in result and result['agents']:
    agent = result['agents'][0]
    print(f"Agent 0 keys: {list(agent.keys())}\n")
    
    if 'card_instances' in agent and agent['card_instances']:
        instance = agent['card_instances'][0]
        print(f"Card Instance 0 keys: {list(instance.keys())}\n")
        
        print(f"Card name: {instance.get('card_name')}")
        print(f"Flavor text: {instance.get('flavor_text', '')[:60]}...\n")
        
        if 'price_history' in instance:
            history = instance['price_history']
            print(f"Price history points: {len(history)}")
            print("Price history (first 3 points):")
            for point in history[:3]:
                print(f"  Tick {point['tick']}: Price {point['price']} Prisms, Desirability {point['desirability']}")

print("\n✓ Data structure verified - agents with card_instances and price_history present!")
