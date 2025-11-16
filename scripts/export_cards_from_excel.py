"""Export cards from the Excel master set to JSON.

This script reads polydros_master_set_v1.xlsx from the repo root and generates
simulation/data/cards.json with all card definitions.

Run this script whenever the Excel master set is updated to keep the simulation
data in sync.

Usage:
    python scripts/export_cards_from_excel.py
"""

import json
from pathlib import Path
from typing import Any, Dict, List

try:
    import openpyxl
except ImportError:
    print("ERROR: openpyxl not installed. Install it with:")
    print("  pip install openpyxl")
    exit(1)


def parse_excel_to_cards(excel_path: Path) -> List[Dict[str, Any]]:
    """Parse the Excel master set and return a list of card dictionaries."""
    wb = openpyxl.load_workbook(excel_path, data_only=True)
    sheet = wb.active

    # Read header row to find column indices
    headers = []
    for cell in sheet[1]:
        headers.append(cell.value)

    # Map expected column names to indices
    col_map = {}
    for idx, h in enumerate(headers):
        if h:
            col_map[h.strip()] = idx

    cards = []
    for row_idx, row in enumerate(sheet.iter_rows(min_row=2, values_only=True), start=2):
        # Skip empty rows
        if not row or not row[col_map.get("#", 0)]:
            continue

        card_id = row[col_map.get("#", 0)]
        name = row[col_map.get("Name", 1)]
        color = row[col_map.get("Color/Faction", 2)]
        card_type = row[col_map.get("Type", 3)]
        rarity = row[col_map.get("Rarity", 4)]
        gem_colored = row[col_map.get("Gem colored", 5)]
        gem_colorless = row[col_map.get("Gem Colorless", 6)]
        power = row[col_map.get("Power", 7)]
        health = row[col_map.get("Health", 8)]
        per_pack = row[col_map.get("Per-Pack Appearance %", 9)]
        holo_pct = row[col_map.get("Holo %", 10)]

        # Convert values to proper types
        try:
            gem_colored = int(gem_colored) if gem_colored is not None else 0
        except (ValueError, TypeError):
            gem_colored = 0

        try:
            gem_colorless = int(gem_colorless) if gem_colorless is not None else 0
        except (ValueError, TypeError):
            gem_colorless = 0

        try:
            power = int(power) if power is not None else 0
        except (ValueError, TypeError):
            power = 0

        try:
            health = int(health) if health is not None else 0
        except (ValueError, TypeError):
            health = 0

        try:
            per_pack = float(per_pack) if per_pack is not None else 1.0
        except (ValueError, TypeError):
            per_pack = 1.0

        try:
            holo_pct = float(holo_pct) if holo_pct is not None else 0.0
        except (ValueError, TypeError):
            holo_pct = 0.0

        # Compute derived fields
        pack_weight = per_pack  # Use per-pack % directly as weight
        quality_score = (power + health) / 2.0 if (power + health) > 0 else 0.5
        holo_chance = holo_pct / 100.0  # Convert percentage to probability

        # Map rarity letter to standard rarity name
        rarity_map = {
            "C": "COMMON",
            "U": "UNCOMMON",
            "R": "RARE",
            "M": "MYTHIC",
            "P": "PLAYER",
        }
        rarity_name = rarity_map.get(str(rarity).upper(), "COMMON")

        card = {
            "id": str(card_id),
            "name": str(name) if name else f"Card {card_id}",
            "color": str(color) if color else "",
            "type": str(card_type) if card_type else "",
            "rarity": rarity_name,
            "gem_colored": gem_colored,
            "gem_colorless": gem_colorless,
            "power": power,
            "health": health,
            "per_pack_appearance": per_pack,
            "holo_chance": holo_chance,
            "pack_weight": pack_weight,
            "quality_score": quality_score,
        }
        cards.append(card)

    return cards


def main() -> None:
    repo_root = Path(__file__).resolve().parent.parent
    excel_path = repo_root / "polydros_master_set_v1.xlsx"
    json_path = repo_root / "simulation" / "data" / "cards.json"

    if not excel_path.exists():
        print(f"ERROR: Excel file not found at {excel_path}")
        exit(1)

    print(f"Reading Excel file: {excel_path}")
    cards = parse_excel_to_cards(excel_path)
    print(f"Parsed {len(cards)} cards from Excel (including player cards)")

    # Ensure output directory exists
    json_path.parent.mkdir(parents=True, exist_ok=True)

    # Write JSON
    with json_path.open("w", encoding="utf-8") as f:
        json.dump(cards, f, indent=2, ensure_ascii=False)

    print(f"Exported cards to: {json_path}")
    print("Done!")


if __name__ == "__main__":
    main()
