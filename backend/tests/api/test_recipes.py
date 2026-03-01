"""Tests for recipe API routes."""

from unittest.mock import MagicMock
from uuid import uuid4

from fastapi.testclient import TestClient

from miam.domain.entities import (
    ImageEntity,
    IngredientEntity,
    SourceEntity,
)
from tests.api.conftest import make_paginated_result, make_recipe


class TestCreateRecipe:
    def test_returns_201_with_id(
        self, client: TestClient, mock_recipe_service: MagicMock
    ) -> None:
        recipe = make_recipe(title="Soup")
        mock_recipe_service.create_recipe.return_value = recipe

        response = client.post(
            "/api/recipes", json={"title": "Soup", "category": "plat"}
        )

        assert response.status_code == 201
        assert response.json()["id"] == str(recipe.id)

    def test_returns_400_on_value_error(
        self, client: TestClient, mock_recipe_service: MagicMock
    ) -> None:
        mock_recipe_service.create_recipe.side_effect = ValueError("bad data")

        response = client.post("/api/recipes", json={"title": "X", "category": "plat"})

        assert response.status_code == 400
        assert "bad data" in response.json()["detail"]

    def test_returns_422_on_invalid_body(self, client: TestClient) -> None:
        response = client.post("/api/recipes", json={})

        assert response.status_code == 422


class TestCreateRecipesBatch:
    def test_returns_201_with_ids(
        self, client: TestClient, mock_recipe_service: MagicMock
    ) -> None:
        r1, r2 = make_recipe(title="A"), make_recipe(title="B")
        mock_recipe_service.create_recipes.return_value = [r1, r2]

        response = client.post(
            "/api/recipes/batch",
            json={
                "recipes": [
                    {"title": "A", "category": "plat"},
                    {"title": "B", "category": "dessert"},
                ]
            },
        )

        assert response.status_code == 201
        ids = response.json()["ids"]
        assert len(ids) == 2
        assert ids[0] == str(r1.id)
        assert ids[1] == str(r2.id)

    def test_returns_400_on_value_error(
        self, client: TestClient, mock_recipe_service: MagicMock
    ) -> None:
        mock_recipe_service.create_recipes.side_effect = ValueError("batch error")

        response = client.post(
            "/api/recipes/batch",
            json={"recipes": [{"title": "A", "category": "plat"}]},
        )

        assert response.status_code == 400
        assert "batch error" in response.json()["detail"]

    def test_returns_422_on_invalid_body(self, client: TestClient) -> None:
        response = client.post("/api/recipes/batch", json={"recipes": [{}]})

        assert response.status_code == 422


class TestSearchRecipes:
    def test_returns_results(
        self, client: TestClient, mock_recipe_service: MagicMock
    ) -> None:
        r1, r2 = make_recipe(title="Soup"), make_recipe(title="Cake")
        mock_recipe_service.search_recipes.return_value = make_paginated_result(
            [r1, r2]
        )

        response = client.get("/api/recipes/search")

        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert len(data["items"]) == 2

    def test_passes_title_filter(
        self, client: TestClient, mock_recipe_service: MagicMock
    ) -> None:
        mock_recipe_service.search_recipes.return_value = make_paginated_result()

        client.get("/api/recipes/search?title=Soup")

        mock_recipe_service.search_recipes.assert_called_once_with(
            recipe_id=None,
            title="Soup",
            category=None,
            is_veggie=None,
            season=None,
            limit=None,
            offset=0,
        )

    def test_passes_pagination(
        self, client: TestClient, mock_recipe_service: MagicMock
    ) -> None:
        mock_recipe_service.search_recipes.return_value = make_paginated_result()

        response = client.get("/api/recipes/search?limit=10&offset=5")

        assert response.status_code == 200
        data = response.json()
        assert data["limit"] == 10
        assert data["offset"] == 5

    def test_returns_empty_list(
        self, client: TestClient, mock_recipe_service: MagicMock
    ) -> None:
        mock_recipe_service.search_recipes.return_value = make_paginated_result()

        response = client.get("/api/recipes/search")

        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0


class TestGetRecipe:
    def test_returns_recipe_with_full_details(
        self, client: TestClient, mock_recipe_service: MagicMock
    ) -> None:
        recipe_id = uuid4()
        recipe = make_recipe(
            recipe_id=recipe_id,
            title="Pasta",
            description="Yummy pasta",
            category="plat",
            is_veggie=True,
            tags=["italian"],
            preparation=["Boil water", "Cook pasta"],
            ingredients=[IngredientEntity(name="Pasta", quantity=200.0, unit="g")],
            images=[ImageEntity(id=uuid4(), caption="Photo")],
            sources=[SourceEntity(type="manual", raw_content="Family recipe")],
        )
        mock_recipe_service.get_recipe_by_id.return_value = recipe

        response = client.get(f"/api/recipes/{recipe_id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(recipe_id)
        assert data["title"] == "Pasta"
        assert data["is_veggie"] is True
        assert data["tags"] == ["italian"]
        assert data["preparation"] == ["Boil water", "Cook pasta"]
        assert len(data["ingredients"]) == 1
        assert data["ingredients"][0]["name"] == "Pasta"
        assert data["ingredients"][0]["quantity"] == 200.0
        assert len(data["images"]) == 1
        assert data["images"][0]["caption"] == "Photo"
        assert len(data["sources"]) == 1
        assert data["sources"][0]["type"] == "manual"

    def test_returns_404_when_not_found(
        self, client: TestClient, mock_recipe_service: MagicMock
    ) -> None:
        mock_recipe_service.get_recipe_by_id.return_value = None

        response = client.get(f"/api/recipes/{uuid4()}")

        assert response.status_code == 404


class TestGetRecipes:
    def test_returns_paginated_list(
        self, client: TestClient, mock_recipe_service: MagicMock
    ) -> None:
        r1 = make_recipe(title="A")
        mock_recipe_service.search_recipes.return_value = make_paginated_result([r1])

        response = client.get("/api/recipes")

        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["total"] == 1

    def test_passes_pagination_params(
        self, client: TestClient, mock_recipe_service: MagicMock
    ) -> None:
        mock_recipe_service.search_recipes.return_value = make_paginated_result()

        response = client.get("/api/recipes?limit=5&offset=10")

        assert response.status_code == 200
        data = response.json()
        assert data["limit"] == 5
        assert data["offset"] == 10

    def test_returns_empty_list(
        self, client: TestClient, mock_recipe_service: MagicMock
    ) -> None:
        mock_recipe_service.search_recipes.return_value = make_paginated_result()

        response = client.get("/api/recipes")

        assert response.json()["items"] == []


class TestUpdateRecipe:
    def test_returns_updated_recipe(
        self, client: TestClient, mock_recipe_service: MagicMock
    ) -> None:
        recipe_id = uuid4()
        updated = make_recipe(
            recipe_id=recipe_id, title="New Title", category="dessert"
        )
        mock_recipe_service.update_recipe.return_value = updated

        response = client.put(
            f"/api/recipes/{recipe_id}",
            json={"title": "New Title", "description": "desc", "category": "dessert"},
        )

        assert response.status_code == 200
        assert response.json()["title"] == "New Title"

    def test_returns_404_when_not_found(
        self, client: TestClient, mock_recipe_service: MagicMock
    ) -> None:
        mock_recipe_service.update_recipe.return_value = None

        response = client.put(
            f"/api/recipes/{uuid4()}",
            json={"title": "X", "description": "Y", "category": "plat"},
        )

        assert response.status_code == 404

    def test_returns_400_on_value_error(
        self, client: TestClient, mock_recipe_service: MagicMock
    ) -> None:
        mock_recipe_service.update_recipe.side_effect = ValueError("invalid")

        response = client.put(
            f"/api/recipes/{uuid4()}",
            json={"title": "X", "description": "Y", "category": "plat"},
        )

        assert response.status_code == 400
        assert "invalid" in response.json()["detail"]


class TestDeleteRecipe:
    def test_returns_204_on_success(
        self, client: TestClient, mock_recipe_service: MagicMock
    ) -> None:
        mock_recipe_service.delete_recipe.return_value = True

        response = client.delete(f"/api/recipes/{uuid4()}")

        assert response.status_code == 204

    def test_returns_404_when_not_found(
        self, client: TestClient, mock_recipe_service: MagicMock
    ) -> None:
        mock_recipe_service.delete_recipe.return_value = False

        response = client.delete(f"/api/recipes/{uuid4()}")

        assert response.status_code == 404
