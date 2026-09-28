"""HTTP routes for the card set: the card list and card pictures.

The backend includes these with `app.include_router(create_router(...))`.
Pictures live in the `images/` folder at the repo root (not in git; see
README.md), named `<card id>.png`.
"""

import os
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from PIL import Image

from .cards import CardSet

DEFAULT_IMAGES_DIR = Path(
    os.environ.get("POLYDROS_IMAGES", Path(__file__).resolve().parent.parent / "images")
)

# The originals are 1536x1024 and about 3 MB each, far too big for a grid of
# 120 cards. Thumbnails are about 15 KB, and take about 0.3 s each to make
# the first time they are asked for.
THUMB_WIDTH = 384


def create_router(cards: CardSet, images_dir: Path = DEFAULT_IMAGES_DIR) -> APIRouter:
    router = APIRouter()

    @router.get("/cards")
    def list_cards() -> dict:
        return {"cards": [card.to_dict() for card in cards]}

    @router.get("/cards/{card_id}/image")
    def card_image(card_id: str) -> FileResponse:
        return FileResponse(_original(card_id), media_type="image/png")

    @router.get("/cards/{card_id}/thumb")
    def card_thumb(card_id: str) -> FileResponse:
        original = _original(card_id)
        thumb = images_dir / "thumbs" / f"{card_id}.webp"
        if not thumb.exists() or thumb.stat().st_mtime < original.stat().st_mtime:
            _make_thumbnail(original, thumb)
        return FileResponse(thumb, media_type="image/webp")

    def _original(card_id: str) -> Path:
        # Only IDs from the card set reach the file system, so a request
        # can't ask for a path outside images_dir.
        if card_id not in cards:
            raise HTTPException(status_code=404, detail=f"No card {card_id!r}")
        path = images_dir / f"{card_id}.png"
        if not path.is_file():
            raise HTTPException(status_code=404, detail=f"No picture for {card_id}")
        return path

    return router


def _make_thumbnail(original: Path, thumb: Path) -> None:
    thumb.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(original) as image:
        height = round(image.height * THUMB_WIDTH / image.width)
        small = image.convert("RGB").resize((THUMB_WIDTH, height), Image.LANCZOS)
    # Write to a temporary file first, so a request that arrives while the
    # thumbnail is being made never gets a half-written file.
    partial = thumb.with_suffix(".partial")
    small.save(partial, format="WEBP", quality=80)
    partial.replace(thumb)
