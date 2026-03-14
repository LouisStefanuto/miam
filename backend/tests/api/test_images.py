"""Tests for image API routes."""

from unittest.mock import MagicMock
from uuid import uuid4

from fastapi.testclient import TestClient

from miam.domain.schemas import ImageResponse


class TestUploadImage:
    def test_returns_201_on_success(
        self, client: TestClient, mock_recipe_service: MagicMock
    ) -> None:
        recipe_id = uuid4()
        image_id = uuid4()
        mock_recipe_service.add_recipe_image.return_value = image_id

        response = client.post(
            "/api/images",
            data={"recipe_id": str(recipe_id)},
            files={"image": ("photo.jpg", b"fake-jpeg-bytes", "image/jpeg")},
        )

        assert response.status_code == 201
        data = response.json()
        assert data["image_id"] == str(image_id)
        assert data["recipe"] == str(recipe_id)
        assert data["title"] == "photo.jpg"

    def test_returns_error_when_no_filename(
        self, client: TestClient, mock_recipe_service: MagicMock
    ) -> None:
        response = client.post(
            "/api/images",
            data={"recipe_id": str(uuid4())},
            files={"image": ("", b"data", "image/jpeg")},
        )

        # FastAPI rejects empty filename at the validation layer (422)
        assert response.status_code == 422

    def test_returns_413_when_too_large(
        self, client: TestClient, mock_recipe_service: MagicMock
    ) -> None:
        large_content = b"x" * (5 * 1024 * 1024 + 1)

        response = client.post(
            "/api/images",
            data={"recipe_id": str(uuid4())},
            files={"image": ("big.jpg", large_content, "image/jpeg")},
        )

        assert response.status_code == 413


class TestGetImage:
    def test_returns_image_bytes(
        self, client: TestClient, mock_recipe_service: MagicMock
    ) -> None:
        mock_recipe_service.get_recipe_image.return_value = ImageResponse(
            media_type="image/png", content=b"\x89PNG-data"
        )

        response = client.get(f"/api/images/{uuid4()}")

        assert response.status_code == 200
        assert response.headers["content-type"] == "image/png"
        assert response.content == b"\x89PNG-data"

    def test_returns_404_when_not_found(
        self, client: TestClient, mock_recipe_service: MagicMock
    ) -> None:
        mock_recipe_service.get_recipe_image.return_value = None

        response = client.get(f"/api/images/{uuid4()}")

        assert response.status_code == 404


class TestDeleteImage:
    def test_returns_204_on_success(
        self, client: TestClient, mock_recipe_service: MagicMock
    ) -> None:
        mock_recipe_service.delete_recipe_image.return_value = True

        response = client.delete(f"/api/images/{uuid4()}")

        assert response.status_code == 204

    def test_returns_404_when_not_found(
        self, client: TestClient, mock_recipe_service: MagicMock
    ) -> None:
        mock_recipe_service.delete_recipe_image.return_value = False

        response = client.delete(f"/api/images/{uuid4()}")

        assert response.status_code == 404
