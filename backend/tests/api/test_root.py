"""Tests for the root endpoint."""

from fastapi.testclient import TestClient

from miam.api.main import app

client = TestClient(app)


class TestRootEndpoint:
    def test_get_root_returns_200(self) -> None:
        response = client.get("/")
        assert response.status_code == 200

    def test_get_root_returns_app_name(self) -> None:
        response = client.get("/")
        assert response.json() == "Livre Recettes"
