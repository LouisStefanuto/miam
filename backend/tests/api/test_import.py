"""Tests for import API routes."""

import base64
from collections.abc import Generator
from unittest.mock import create_autospec

from fastapi.testclient import TestClient

from miam.api.deps import get_recipe_import_service
from miam.api.main import app
from miam.domain.entities import Category, SourceType
from miam.domain.schemas import ParsedRecipe, RecipeCreate, SourceCreate
from miam.domain.services import RecipeImportService


class TestParseInstagram:
    def _make_client(self, mock_service: RecipeImportService) -> Generator[TestClient]:
        app.dependency_overrides[get_recipe_import_service] = lambda: mock_service
        yield TestClient(app)
        app.dependency_overrides.clear()

    def test_returns_parsed_recipes_with_images(self) -> None:
        mock_service = create_autospec(RecipeImportService, instance=True)
        recipe = RecipeCreate(
            title="Test",
            category=Category.plat,
            sources=[SourceCreate(type=SourceType.instagram, raw_content="chef")],
            tags=["instagram"],
        )
        mock_service.parse_instagram.return_value = [
            ParsedRecipe(recipe=recipe, image=b"image-bytes")
        ]

        for client in self._make_client(mock_service):
            response = client.post(
                "/api/import/instagram/parse",
                json={
                    "items": [
                        {
                            "media": {
                                "owner": {"username": "chef"},
                                "caption": {"text": "Test"},
                            }
                        }
                    ]
                },
            )

        assert response.status_code == 200
        data = response.json()
        assert len(data["recipes"]) == 1
        assert data["recipes"][0]["recipe"]["title"] == "Test"
        assert (
            data["recipes"][0]["image_base64"]
            == base64.b64encode(b"image-bytes").decode()
        )

    def test_returns_null_image_when_no_image(self) -> None:
        mock_service = create_autospec(RecipeImportService, instance=True)
        recipe = RecipeCreate(title="No Image", category=Category.plat)
        mock_service.parse_instagram.return_value = [ParsedRecipe(recipe=recipe)]

        for client in self._make_client(mock_service):
            response = client.post(
                "/api/import/instagram/parse",
                json={"items": []},
            )

        assert response.status_code == 200
        assert response.json()["recipes"][0]["image_base64"] is None

    def test_returns_502_on_download_failure(self) -> None:
        from miam.domain.exceptions import ImageDownloadError

        mock_service = create_autospec(RecipeImportService, instance=True)
        mock_service.parse_instagram.side_effect = ImageDownloadError(
            "Failed to download image from https://cdn.instagram.com/expired"
        )

        for client in self._make_client(mock_service):
            response = client.post(
                "/api/import/instagram/parse",
                json={"items": []},
            )

        assert response.status_code == 502
        assert "Failed to download image" in response.json()["detail"]

    def test_returns_422_on_invalid_structure(self) -> None:
        mock_service = create_autospec(RecipeImportService, instance=True)

        for client in self._make_client(mock_service):
            response = client.post(
                "/api/import/instagram/parse",
                json={"items": [{}]},
            )

        assert response.status_code == 422
