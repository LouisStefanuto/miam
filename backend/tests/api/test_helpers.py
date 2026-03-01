"""Tests for API route helpers."""

import io

import pytest
from fastapi import UploadFile
from starlette.datastructures import Headers

from miam.api.routes.helpers import get_filename


def _upload(filename: str | None = "", content_type: str | None = None) -> UploadFile:
    """Create an UploadFile with the given filename and content type."""
    raw = {"content-type": content_type} if content_type else {}
    return UploadFile(file=io.BytesIO(), filename=filename or "", headers=Headers(raw))


class TestGetFilename:
    def test_returns_original_filename(self) -> None:
        assert get_filename(_upload("photo.jpg", "image/jpeg")) == "photo.jpg"

    def test_generates_name_from_content_type(self) -> None:
        result = get_filename(_upload("", "image/png"))
        assert result.endswith(".png")
        assert len(result) > len(".png")

    def test_generates_name_from_jpeg_content_type(self) -> None:
        result = get_filename(_upload("", "image/jpeg"))
        assert result.endswith(".jpeg")

    def test_raises_when_no_filename_and_no_content_type(self) -> None:
        image = UploadFile(file=io.BytesIO(), filename="")
        with pytest.raises(ValueError, match="Cannot determine filename"):
            get_filename(image)

    def test_returns_original_even_with_content_type(self) -> None:
        assert get_filename(_upload("custom.webp", "image/png")) == "custom.webp"

    def test_generated_names_are_unique(self) -> None:
        names = {get_filename(_upload("", "image/png")) for _ in range(10)}
        assert len(names) == 10
