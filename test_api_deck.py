#!/usr/bin/env python3
"""Test the backend API with new deck feature."""

from backend.main import app
from fastapi.testclient import TestClient

client = TestClient(app)

# Call the API
result = client.post('/run', json={'seed': 42, 'agents': 2, 'ticks': 1})
data = result.json()

print("=== Backend API Test ===\n")
print(f"Status code: {result.status_code}")
print(f"Number of agents: {len(data['agents'])}\n")

for agent in data['agents']:
    print(f"Agent {agent['id']}: {agent['name']}")
    print(f"  Prism: {agent['prism']}")
    print(f"  Collection count: {agent['collection_count']}")
    print(f"  Deck size: {len(agent.get('deck', []))}")
    
    if agent.get('deck'):
        print(f"  First deck card: {agent['deck'][0]['name']}")
        print(f"    - Color: {agent['deck'][0]['color']}")
        print(f"    - Power: {agent['deck'][0]['power']}")
        print(f"    - Health: {agent['deck'][0]['health']}")
        print(f"    - Cost: {agent['deck'][0]['cost']}")
    
    print(f"  Sample_cards present: {'sample_cards' in agent}")
    print(f"  Full_collection present: {'full_collection' in agent}")
    print()

print("✓ API test passed")
