"""Tests for import API routes."""

from collections.abc import Iterator
from contextlib import contextmanager
from unittest.mock import create_autospec
from uuid import uuid4

from fastapi.testclient import TestClient

from miam.api.deps import get_current_user_id, get_recipe_import_service
from miam.api.main import app
from miam.domain.entities import Category, SourceType
from miam.domain.schemas import ParsedRecipe, RecipeCreate, SourceCreate
from miam.domain.services import RecipeImportService

TEST_USER_ID = uuid4()


@contextmanager
def _make_client(mock_service: RecipeImportService) -> Iterator[TestClient]:
    app.dependency_overrides[get_recipe_import_service] = lambda: mock_service
    app.dependency_overrides[get_current_user_id] = lambda: TEST_USER_ID
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.clear()


class TestParseInstagram:
    def test_returns_parsed_recipes_with_image_urls(self) -> None:
        mock_service = create_autospec(RecipeImportService, instance=True)
        recipe = RecipeCreate(
            title="Test",
            category=Category.plat,
            sources=[SourceCreate(type=SourceType.instagram, raw_content="chef")],
            tags=["instagram"],
        )
        mock_service.parse_instagram.return_value = [
            ParsedRecipe(recipe=recipe, image_url="https://cdn.instagram.com/image.jpg")
        ]

        with _make_client(mock_service) as client:
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
        assert data["recipes"][0]["image_url"] == "https://cdn.instagram.com/image.jpg"

    def test_returns_null_image_url_when_no_image(self) -> None:
        mock_service = create_autospec(RecipeImportService, instance=True)
        recipe = RecipeCreate(title="No Image", category=Category.plat)
        mock_service.parse_instagram.return_value = [ParsedRecipe(recipe=recipe)]

        with _make_client(mock_service) as client:
            response = client.post(
                "/api/import/instagram/parse",
                json={"items": []},
            )

        assert response.status_code == 200
        assert response.json()["recipes"][0]["image_url"] is None

    def test_returns_422_on_invalid_structure(self) -> None:
        mock_service = create_autospec(RecipeImportService, instance=True)

        with _make_client(mock_service) as client:
            response = client.post(
                "/api/import/instagram/parse",
                json={"items": [{}]},
            )

        assert response.status_code == 422

    def test_returns_401_without_auth(self) -> None:
        """Endpoint requires authentication."""
        mock_service = create_autospec(RecipeImportService, instance=True)
        app.dependency_overrides[get_recipe_import_service] = lambda: mock_service
        try:
            client = TestClient(app)
            response = client.post(
                "/api/import/instagram/parse",
                json={"items": []},
            )
            assert response.status_code == 401
        finally:
            app.dependency_overrides.clear()
