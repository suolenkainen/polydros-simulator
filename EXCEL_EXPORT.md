# Excel Master Set Export - Quick Start

## Current Status

✅ **Export script created**: `scripts/export_cards_from_excel.py`
✅ **Placeholder data in place**: `simulation/data/cards.json` (8 sample cards)
✅ **All tests passing**: 12/12 tests pass with placeholder data
⏳ **Excel file locked**: Close `polydros_master_set_v1.xlsx` to enable export

## Next Step: Export Real Master Data

### 1. Close Excel
If `polydros_master_set_v1.xlsx` is open in Excel, **close it** (or close Excel entirely).

### 2. Run the Export Script

From the repo root in Command Prompt:
```cmd
.venv\Scripts\python.exe scripts\export_cards_from_excel.py
```

Or in PowerShell:
```powershell
.\.venv\Scripts\python.exe scripts\export_cards_from_excel.py
```

### 3. Expected Output
```
Reading Excel file: C:\Users\pmarj\...\polydros_master_set_v1.xlsx
Parsed 150+ cards from Excel (excluding player cards)
Exported cards to: C:\Users\pmarj\...\simulation\data\cards.json
Done!
```

### 4. Verify
Run tests to confirm the full card set loaded correctly:
```cmd
.venv\Scripts\python.exe -m pytest -q
```

All 12 tests should still pass.

### 5. Restart Backend (if running)
If the backend is already running, restart it to pick up the new card data:
- Kill the backend terminal window
- Re-run: `.venv\Scripts\python.exe -m uvicorn backend.main:app --reload`

Or use the convenience script:
```cmd
powershell -ExecutionPolicy Bypass -File run_all.ps1
```

## What the Export Does

The script reads your Excel master set with these columns:
- **#**: Card ID
- **Name**: Card name
- **Color/Faction**: Card color
- **Type**: creature, spell, mine, golem, player
- **Rarity**: C/U/R/M/P → COMMON/UNCOMMON/RARE/MYTHIC/PLAYER
- **Gem colored**: Cost in faction-specific gems
- **Gem Colorless**: Cost in any gem
- **Power**: Attack bonus
- **Health**: Defense bonus
- **Per-Pack Appearance %**: Pack weight (higher = more common in boosters)
- **Holo %**: Chance this card appears as hologram

It generates `simulation/data/cards.json` with all these fields plus derived values:
- `pack_weight`: From Per-Pack Appearance %
- `quality_score`: Computed as (power + health) / 2
- `holo_chance`: Converted from Holo % to probability (0.0-1.0)

## Troubleshooting

**Still getting PermissionError?**
- OneDrive might be syncing the file. Pause OneDrive sync temporarily.
- Check Task Manager for Excel processes and end them.
- Copy the file to a local folder (outside OneDrive) and update the script path.

**Wrong column names?**
- The script expects exact column headers. Check the Excel sheet row 1.
- Edit `scripts/export_cards_from_excel.py` in the `col_map` section if your headers differ.

**No cards exported?**
- Verify data starts in row 2 (row 1 should be headers)
- Player cards (rarity "P") are intentionally skipped

## After Export: What Changes

Once you run the export:
- ✅ Simulation uses **150+ real cards** from your master set
- ✅ Booster packing uses **per-card appearance %** and **holo chance**
- ✅ Card metadata (color, type, gem costs, power, health) available for future features
- ✅ Easy to update: just edit Excel and re-run the export script

No code changes needed! The simulation automatically loads from `cards.json`.
