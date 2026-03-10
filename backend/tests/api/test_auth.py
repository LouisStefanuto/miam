"""Tests for auth API routes."""

from collections.abc import Generator
from typing import Any
from unittest.mock import create_autospec

import pytest
from fastapi.testclient import TestClient

from miam.api.deps import get_auth_service
from miam.api.main import app
from miam.domain.services import AuthService


@pytest.fixture
def mock_auth_service() -> Any:
    return create_autospec(AuthService, instance=True)


@pytest.fixture
def auth_client(mock_auth_service: Any) -> Generator[TestClient]:
    app.dependency_overrides[get_auth_service] = lambda: mock_auth_service
    yield TestClient(app)
    app.dependency_overrides.clear()


class TestGoogleLogin:
    def test_success(self, auth_client: TestClient, mock_auth_service: Any) -> None:
        mock_auth_service.login_with_google.return_value = "jwt-token-123"

        response = auth_client.post(
            "/api/auth/google", json={"id_token": "valid-google-token"}
        )

        assert response.status_code == 200
        body = response.json()
        assert body["access_token"] == "jwt-token-123"
        assert body["token_type"] == "bearer"
        mock_auth_service.login_with_google.assert_called_once_with(
            "valid-google-token"
        )

    def test_invalid_google_token(
        self, auth_client: TestClient, mock_auth_service: Any
    ) -> None:
        mock_auth_service.login_with_google.side_effect = ValueError(
            "Invalid Google token"
        )

        response = auth_client.post("/api/auth/google", json={"id_token": "bad-token"})

        assert response.status_code == 401
        assert "Invalid Google token" in response.json()["detail"]

    def test_missing_id_token(self, auth_client: TestClient) -> None:
        response = auth_client.post("/api/auth/google", json={})
        assert response.status_code == 422


class TestProtectedRoutes:
    """Verify that protected routes reject unauthenticated requests."""

    def test_create_recipe_requires_auth(self) -> None:
        client = TestClient(app)
        # Clear any overrides to test real auth
        app.dependency_overrides.clear()
        response = client.post(
            "/api/recipes", json={"title": "Test", "category": "plat"}
        )
        # Should get 403 (no bearer token) or 401
        assert response.status_code in (401, 403)

    def test_batch_create_requires_auth(self) -> None:
        client = TestClient(app)
        app.dependency_overrides.clear()
        response = client.post(
            "/api/recipes/batch",
            json={"recipes": [{"title": "Test", "category": "plat"}]},
        )
        assert response.status_code in (401, 403)
