"""The card routes return the card set, pictures and thumbnails.

The routes are tested on their own FastAPI app with a one-card set and a
made-up picture in a temporary folder, so the tests don't need the real
images/ folder.
"""

from pathlib import Path

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from PIL import Image

from polydros.api import THUMB_WIDTH, create_router
from polydros.cards import parse_cards
from polydros.tests.test_cards import good_card


@pytest.fixture
def images_dir(tmp_path: Path) -> Path:
    Image.new("RGB", (1536, 1024), "red").save(tmp_path / "T001.png")
    return tmp_path


@pytest.fixture
def client(images_dir: Path) -> TestClient:
    cards = parse_cards([good_card(), good_card(id="T002")])
    app = FastAPI()
    app.include_router(create_router(cards, images_dir))
    return TestClient(app)


def test_cards_returns_every_card(client: TestClient) -> None:
    response = client.get("/cards")
    assert response.status_code == 200
    cards = response.json()["cards"]
    assert [c["id"] for c in cards] == ["T001", "T002"]
    assert cards[0]["labels"] == ["Ruby", "Creature"]


def test_image_returns_the_original_picture(client: TestClient) -> None:
    response = client.get("/cards/T001/image")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"


def test_thumb_is_made_small_and_saved(client: TestClient, images_dir: Path) -> None:
    response = client.get("/cards/T001/thumb")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/webp"
    saved = images_dir / "thumbs" / "T001.webp"
    with Image.open(saved) as thumb:
        assert thumb.size == (THUMB_WIDTH, 256)


def test_unknown_card_gives_404(client: TestClient) -> None:
    assert client.get("/cards/NOPE/image").status_code == 404
    assert client.get("/cards/NOPE/thumb").status_code == 404


def test_card_without_a_picture_gives_404(client: TestClient) -> None:
    response = client.get("/cards/T002/image")
    assert response.status_code == 404
    assert response.json()["detail"] == "No picture for T002"


def test_path_tricks_give_404(client: TestClient) -> None:
    assert client.get("/cards/..%2F..%2Fsecret/image").status_code == 404
