"""Tests for API route helpers."""

from types import SimpleNamespace

import pytest

from miam.api.routes.helpers import get_filename


class TestGetFilename:
    def test_returns_original_filename(self) -> None:
        image = SimpleNamespace(filename="photo.jpg", content_type="image/jpeg")
        assert get_filename(image) == "photo.jpg"

    def test_generates_name_from_content_type(self) -> None:
        image = SimpleNamespace(filename="", content_type="image/png")
        result = get_filename(image)
        assert result.endswith(".png")
        assert len(result) > len(".png")

    def test_generates_name_from_jpeg_content_type(self) -> None:
        image = SimpleNamespace(filename="", content_type="image/jpeg")
        result = get_filename(image)
        assert result.endswith(".jpeg")

    def test_raises_when_no_filename_and_no_content_type(self) -> None:
        image = SimpleNamespace(filename="", content_type=None)
        with pytest.raises(ValueError, match="Cannot determine filename"):
            get_filename(image)

    def test_raises_when_filename_is_none_and_no_content_type(self) -> None:
        image = SimpleNamespace(filename=None, content_type=None)
        with pytest.raises(ValueError, match="Cannot determine filename"):
            get_filename(image)

    def test_returns_original_even_with_content_type(self) -> None:
        image = SimpleNamespace(filename="custom.webp", content_type="image/png")
        assert get_filename(image) == "custom.webp"

    def test_generated_names_are_unique(self) -> None:
        image = SimpleNamespace(filename="", content_type="image/png")
        names = {get_filename(image) for _ in range(10)}
        assert len(names) == 10
