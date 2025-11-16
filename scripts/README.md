# Card Export Script

This directory contains a utility script to export card data from the Excel master set to JSON.

## Script: `export_cards_from_excel.py`

Reads `polydros_master_set_v1.xlsx` from the repo root and generates `simulation/data/cards.json` with all card definitions for the simulation.

### Prerequisites

The script requires the `openpyxl` package (already installed in your virtual environment).

### Usage

From the repo root, run:

```cmd
.venv\Scripts\python.exe scripts\export_cards_from_excel.py
```

Or from PowerShell:

```powershell
.\.venv\Scripts\python.exe scripts\export_cards_from_excel.py
```

### Important Notes

1. **Close Excel before running**: If `polydros_master_set_v1.xlsx` is open in Excel, you'll get a `PermissionError`. Close the file first.
2. **OneDrive sync**: If the file is syncing, wait for OneDrive to finish or temporarily pause sync.
3. **Player cards excluded**: Cards with rarity "P" (player cards) are skipped since they don't appear in booster packs.

### Output

The script generates `simulation/data/cards.json` with the following fields for each card:

- `id`: Card ID from the # column
- `name`: Card name
- `color`: Color/Faction
- `type`: Card type (creature, spell, mine, golem, player)
- `rarity`: COMMON, UNCOMMON, RARE, MYTHIC, or PLAYER (converted from C/U/R/M/P)
- `gem_colored`: Cost in colored gems of the same faction
- `gem_colorless`: Cost in any colored gem
- `power`: Attack bonus
- `health`: Defense bonus
- `per_pack_appearance`: Percentage chance to appear in a booster pack
- `holo_chance`: Probability of this card appearing as hologram (converted from Holo %)
- `pack_weight`: Derived from per_pack_appearance (used by booster packing logic)
- `quality_score`: Derived from (power + health) / 2 (used for card value assessment)

### Workflow

Whenever you update the Excel master set:

1. Save and close the Excel file
2. Run the export script: `.venv\Scripts\python.exe scripts\export_cards_from_excel.py`
3. The JSON file will be regenerated automatically
4. Restart the backend if it's running to pick up the new card data

### Troubleshooting

**PermissionError: [Errno 13] Permission denied**
- Close Excel if the file is open
- Check if OneDrive is syncing the file (pause sync temporarily)
- Make sure no other process has the file locked

**Import "openpyxl" could not be resolved**
- Install it: `.venv\Scripts\python.exe -m pip install openpyxl`
- The package should already be installed if you ran the export script creation step

**No cards exported**
- Check that the Excel file has data starting from row 2
- Verify column headers match the expected names (see script for column mapping)
- All card types including player cards (rarity "P") are now included
