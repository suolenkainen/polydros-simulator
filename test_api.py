#!/usr/bin/env python3
"""Test the API to see if agents data is returned."""

import requests
import json

# Run a simulation via the API
response = requests.post('http://127.0.0.1:8000/run', json={
    'seed': 42,
    'agents': [{'name': 'Agent 1'}, {'name': 'Agent 2'}],
    'ticks': 2
})

if response.status_code == 200:
    result = response.json()
    print(f"Response keys: {list(result.keys())}")
    
    if 'agents' in result:
        print(f"\nNumber of agents: {len(result['agents'])}")
        
        if result['agents']:
            agent = result['agents'][0]
            print(f"\nFirst agent keys: {list(agent.keys())}")
            print(f"Agent ID: {agent['id']}")
            print(f"Agent collection count: {agent['collection_count']}")
            
            if 'card_instances' in agent:
                print(f"Number of card instances: {len(agent['card_instances'])}")
                
                if agent['card_instances']:
                    instance = agent['card_instances'][0]
                    print(f"\nFirst card instance keys: {list(instance.keys())}")
                    print(f"Card name: {instance.get('card_name', 'N/A')}")
                    print(f"Card flavor text: {instance.get('flavor_text', 'N/A')[:50]}...")
                    
                    if 'price_history' in instance:
                        history = instance['price_history']
                        print(f"\nPrice history points: {len(history)}")
                        for point in history[:3]:
                            print(f"  Tick {point.get('tick')}: Price {point.get('price')} Prisms")
else:
    print(f"Error: {response.status_code}")
    print(response.text)
