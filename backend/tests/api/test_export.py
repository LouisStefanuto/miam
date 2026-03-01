"""Tests for export API routes."""

from unittest.mock import MagicMock

from fastapi.testclient import TestClient


class TestExportMarkdown:
    def test_returns_zip(
        self, client: TestClient, mock_export_service: MagicMock
    ) -> None:
        mock_export_service.export_recipes_to_markdown.return_value = b"PK-zip-content"

        response = client.post("/api/export/markdown")

        assert response.status_code == 200
        assert response.headers["content-type"] == "application/zip"
        assert "recipes.zip" in response.headers["content-disposition"]
        assert response.content == b"PK-zip-content"


class TestExportWord:
    def test_returns_docx(
        self, client: TestClient, mock_export_service: MagicMock
    ) -> None:
        mock_export_service.export_recipes_to_word.return_value = b"PK-docx-content"

        response = client.post("/api/export/word")

        assert response.status_code == 200
        assert "wordprocessingml" in response.headers["content-type"]
        assert "recipes.docx" in response.headers["content-disposition"]
        assert response.content == b"PK-docx-content"
