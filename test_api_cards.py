#!/usr/bin/env python3
"""Test the complete API flow for agent cards."""

import requests  # type: ignore[import-untyped]
import json

BASE_URL = "http://127.0.0.1:8000"

# First, run a simulation
print("1. Running simulation...")
run_response = requests.post(f"{BASE_URL}/run", json={"seed": 42, "agents": 2, "ticks": 1})
print(f"   Status: {run_response.status_code}")

if run_response.status_code != 200:
    print(f"   Error: {run_response.text}")
    exit(1)

result = run_response.json()
print(f"   Created {len(result['agents'])} agents")

# Get the first agent's cards
agent_id = result['agents'][0]['id']
print(f"\n2. Fetching cards for Agent {agent_id}...")
cards_response = requests.get(f"{BASE_URL}/agents/{agent_id}/cards")
print(f"   Status: {cards_response.status_code}")

if cards_response.status_code != 200:
    print(f"   Error: {cards_response.text}")
    exit(1)

cards_data = cards_response.json()
print(f"   Agent has {len(cards_data.get('cards', []))} cards")

if cards_data.get('cards'):
    first_card = cards_data['cards'][0]
    print(f"\n3. First card details:")
    print(f"   Name: {first_card.get('card_name', 'MISSING')}")
    print(f"   Gem Colored: {first_card.get('gem_colored', 'MISSING')}")
    print(f"   Gem Colorless: {first_card.get('gem_colorless', 'MISSING')}")
    print(f"   Cost: {first_card.get('gem_colored', 0)}/{first_card.get('gem_colorless', 0)}")
    print(f"   Quality: {first_card.get('quality_score', 'MISSING')}")
    print(f"   Desirability: {first_card.get('desirability', 'MISSING')}")
    print(f"   Current Price: {first_card.get('current_price', 'MISSING')}")
    print(f"   Flavor Text: {first_card.get('flavor_text', 'MISSING')[:50]}...")
    
    # Check all required fields
    required_fields = ['card_name', 'gem_colored', 'gem_colorless', 'quality_score', 'desirability', 'current_price', 'flavor_text', 'card_color', 'card_rarity']
    print(f"\n4. Field validation:")
    all_present = True
    for field in required_fields:
        present = field in first_card
        status = "✓" if present else "✗"
        print(f"   {status} {field}")
        if not present:
            all_present = False
    
    if all_present:
        print("\n✓ ALL FIELDS PRESENT - Agent cards display should work!")
    else:
        print("\n✗ SOME FIELDS MISSING - Check implementation")
else:
    print("   No cards found!")
