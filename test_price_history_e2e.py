#!/usr/bin/env python3
"""
Complete end-to-end test of price history visualization feature.
This test:
1. Runs a simulation
2. Starts the FastAPI server (in background)
3. Makes API calls to fetch agent cards
4. Verifies price history is in the response
5. Shows what the frontend will receive
"""

import subprocess
import time
import json
import requests
from simulation import run_simulation, SimulationConfig

print("=" * 70)
print("PRICE HISTORY END-TO-END TEST")
print("=" * 70)

print("\n[1/5] Running simulation...")
cfg = SimulationConfig(seed=42, initial_agents=5, ticks=30)
result = run_simulation(cfg)
print(f"✓ Simulation complete: {len(result['agents'])} agents, 30 ticks")

# Check simulation data has price history
agent = result['agents'][0]
cards_with_history = [c for c in agent.get('card_instances', []) if c.get('price_history')]
print(f"✓ Cards with price history: {len(cards_with_history)}")

print("\n[2/5] Starting FastAPI server...")
server_proc = subprocess.Popen(
    ["C:/Users/pmarj/OneDrive/Documents/Polydros/.venv/Scripts/python.exe", "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8000"],
    cwd="c:\\Users\\pmarj\\OneDrive\\Documents\\Polydros",
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
)

# Wait for server to start
time.sleep(3)
print("✓ Server started on http://127.0.0.1:8000")

try:
    print("\n[3/5] Testing API endpoints...")
    
    # Run simulation through API
    print("  - POST /run (execute simulation)")
    run_response = requests.post("http://127.0.0.1:8000/run", json={"seed": 42, "agents": 5, "ticks": 30})
    if run_response.status_code != 200:
        print(f"  ✗ Failed: {run_response.status_code}")
    else:
        print(f"  ✓ Simulation executed")
    
    # Get agents list
    print("  - GET /agents (list agents)")
    agents_response = requests.get("http://127.0.0.1:8000/agents")
    agents_data = agents_response.json()
    agent_count = len(agents_data.get('agents', []))
    print(f"  ✓ Retrieved {agent_count} agents")
    
    print("\n[4/5] Fetching agent cards with price history...")
    if agent_count > 0:
        agent_id = agents_data['agents'][0]['id']
        cards_response = requests.get(f"http://127.0.0.1:8000/agents/{agent_id}/cards")
        if cards_response.status_code == 200:
            cards_data = cards_response.json()
            cards = cards_data.get('cards', [])
            print(f"  ✓ Retrieved {len(cards)} cards from Agent {agent_id}")
            
            # Find first card with price history
            sample_card = None
            for card in cards:
                if card.get('price_history'):
                    sample_card = card
                    break
            
            if sample_card:
                print("\n[5/5] Sample Card Data (what frontend receives):")
                print(f"\n  Card: {sample_card['card_name']}")
                print(f"  Rarity: {sample_card['card_rarity']}")
                print(f"  Color: {sample_card['card_color']}")
                print(f"  Current Price: {sample_card['current_price']} Ⓟ")
                print(f"  Quality Score: {sample_card['quality_score']}")
                print(f"  Desirability: {sample_card['desirability']}")
                
                price_hist = sample_card['price_history']
                print(f"\n  Price History: {len(price_hist)} data points")
                print(f"    First: Tick {price_hist[0]['tick']}, Price {price_hist[0]['price']}")
                print(f"    Last: Tick {price_hist[-1]['tick']}, Price {price_hist[-1]['price']}")
                
                print("\n" + "=" * 70)
                print("✓ SUCCESS: Price history is flowing through the entire stack!")
                print("=" * 70)
                print("\nFrontend will render:")
                print("  - Card detail modal with all stats")
                print("  - SVG price history chart with:")
                print(f"    - {len(price_hist)} data points")
                print("    - Price trend line (green)")
                print("    - Current price indicator (red dot)")
                print("    - Grid lines and axes")
                
                # Show sample JSON for chart rendering
                print("\nSample JSON for chart:")
                print(json.dumps({
                    "cardName": sample_card['card_name'],
                    "currentPrice": sample_card['current_price'],
                    "priceHistory": price_hist[:3] + ["..."] + [price_hist[-1]]
                }, indent=2))
                
            else:
                print("  ✗ No cards with price history found")
        else:
            print(f"  ✗ Failed to fetch cards: {cards_response.status_code}")
    
finally:
    print("\n\nCleaning up...")
    server_proc.terminate()
    server_proc.wait(timeout=5)
    print("✓ Server stopped")

print("\n" + "=" * 70)
print("TEST COMPLETE")
print("=" * 70)
print("\nTo visualize price history in the UI:")
print("1. Run npm run dev (from frontend/)")
print("2. Use the 'Search All Card Collections' feature")
print("3. Search for a card name")
print("4. Click a result to see price history chart")
