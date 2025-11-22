#!/usr/bin/env python3
"""Verify AgentCardInstance serialization includes all required fields."""

from simulation.engine import run_simulation, SimulationConfig
import json

cfg = SimulationConfig(seed=42, initial_agents=1, ticks=1)
result = run_simulation(cfg)

agent = result['agents'][0]
card_instances = agent['card_instances']

if card_instances:
    card = card_instances[0]
    print("Card serialization check:")
    print(f"  Type: {type(card)}")
    
    # Required fields for frontend display
    required_fields = {
        'card_name': str,
        'card_id': str,
        'card_color': str,
        'card_rarity': str,
        'flavor_text': str,
        'gem_colored': int,
        'gem_colorless': int,
        'quality_score': (int, float),
        'desirability': (int, float),
        'current_price': (int, float),
    }
    
    print("\\n  Field Check:")
    all_good = True
    for field, expected_type in required_fields.items():
        if field in card:
            value = card[field]
            if isinstance(expected_type, tuple):
                is_correct_type = isinstance(value, expected_type)  # type: ignore[arg-type]
            else:
                is_correct_type = isinstance(value, expected_type)  # type: ignore[arg-type]
            status = "✓" if is_correct_type else "✗"
            print(f"    {status} {field}: {value} ({type(value).__name__})")
            if not is_correct_type:
                all_good = False
        else:
            print(f"    ✗ {field}: MISSING")
            all_good = False
    
    if all_good:
        print("\n✓ ALL FIELDS PRESENT AND CORRECT TYPE!")
        print("\n  Full card data:")
        print(f"    {json.dumps(card, indent=4)}")
    else:
        print("\n✗ SOME FIELDS MISSING OR WRONG TYPE")
else:
    print("NO CARDS FOUND")
