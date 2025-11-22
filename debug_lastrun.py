#!/usr/bin/env python3
"""Debug what's in LAST_RUN."""

import requests  # type: ignore[import-untyped]
import json

BASE_URL = "http://127.0.0.1:8000"

# First, run a simulation
print("1. Running simulation...")
run_response = requests.post(f"{BASE_URL}/run", json={"seed": 42, "agents": 2, "ticks": 1})

if run_response.status_code == 200:
    result = run_response.json()
    agent = result['agents'][0]
    print(f"\n   Agent ID: {agent.get('id')}")
    print(f"   Has card_instances: {'card_instances' in agent}")
    
    if agent.get('card_instances'):
        card = agent['card_instances'][0]
        print(f"\n   First card from run_simulation():")
        print(f"   Type: {type(card)}")
        print(f"   Keys: {list(card.keys()) if isinstance(card, dict) else 'NOT A DICT'}")
        
        if isinstance(card, dict):
            print(f"\n   Card data:")
            for key in ['card_name', 'gem_colored', 'gem_colorless', 'quality_score', 'desirability', 'current_price']:
                print(f"     {key}: {card.get(key, 'MISSING')}")
