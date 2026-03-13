"""Tests for Instagram parser adapter."""

from typing import Any
from unittest.mock import patch

import pytest
import requests
from pydantic import ValidationError

from miam.domain.entities import Category, SourceType
from miam.domain.exceptions import ImageDownloadError
from miam.domain.schemas import (
    InstagramCaption,
    InstagramImageCandidate,
    InstagramImageVersions,
    InstagramItem,
    InstagramMedia,
    InstagramOwner,
    InstagramResponse,
    ParsedRecipe,
)
from miam.infra.importer_instagram import (
    InstagramParser,
    _clean_emojis_from_text,
    _extract_title,
)


def _make_instagram_item(
    *,
    caption: str = "My recipe\nStep 1\nStep 2",
    username: str = "chef_john",
    image_url: str | None = "https://cdn.instagram.com/image.jpg",
) -> InstagramItem:
    """Build a minimal Instagram item for testing."""
    image_versions2 = None
    if image_url:
        image_versions2 = InstagramImageVersions(
            candidates=[InstagramImageCandidate(url=image_url, width=1080, height=1080)]
        )
    return InstagramItem(
        media=InstagramMedia(
            owner=InstagramOwner(username=username),
            caption=InstagramCaption(text=caption),
            image_versions2=image_versions2,
        )
    )


def _make_instagram_response(*items: InstagramItem) -> InstagramResponse:
    return InstagramResponse(items=list(items))


class TestCleanEmojisFromText:
    def test_removes_hashtags(self) -> None:
        assert _clean_emojis_from_text("hello #world #food") == "hello  "

    def test_removes_emojis(self) -> None:
        assert _clean_emojis_from_text("hello 🍕 world") == "hello  world"

    def test_plain_text_unchanged(self) -> None:
        assert _clean_emojis_from_text("plain text") == "plain text"


class TestExtractTitle:
    def test_splits_on_newline(self) -> None:
        assert _extract_title("First line\nSecond line") == "First line"

    def test_splits_on_period(self) -> None:
        assert _extract_title("First sentence. Second.") == "First sentence"

    def test_splits_on_exclamation(self) -> None:
        assert _extract_title("Wow! Great recipe") == "Wow"

    def test_falls_back_to_first_word_when_no_lines(self) -> None:
        # All split results are empty/whitespace → fallback to first word[:4]
        assert _extract_title("!.\n") == "!."

    def test_falls_back_to_default_when_empty(self) -> None:
        assert _extract_title("") == "Instagram Recipe"


class TestInstagramResponseValidation:
    def test_validates_valid_data(self) -> None:
        data = {
            "items": [
                {"media": {"owner": {"username": "chef"}, "caption": {"text": "Hello"}}}
            ]
        }
        response = InstagramResponse.model_validate(data)
        assert len(response.items) == 1
        assert response.items[0].media.owner.username == "chef"
        assert response.items[0].media.caption.text == "Hello"

    def test_ignores_extra_fields(self) -> None:
        data = {
            "num_results": 1,
            "more_available": True,
            "items": [
                {
                    "media": {
                        "owner": {"username": "x", "pk": "123"},
                        "caption": {"text": "hi"},
                    }
                }
            ],
        }
        response = InstagramResponse.model_validate(data)
        assert response.items[0].media.owner.username == "x"

    def test_defaults_when_optional_fields_missing(self) -> None:
        data: dict[str, Any] = {"items": [{"media": {}}]}
        response = InstagramResponse.model_validate(data)
        assert response.items[0].media.owner.username == "unknown"
        assert response.items[0].media.caption.text == ""
        assert response.items[0].media.image_versions2 is None

    def test_rejects_missing_media(self) -> None:
        with pytest.raises(ValidationError):
            InstagramResponse.model_validate({"items": [{}]})

    def test_validates_image_candidate_fields(self) -> None:
        data = {
            "items": [
                {
                    "media": {
                        "image_versions2": {
                            "candidates": [
                                {
                                    "url": "https://example.com/img.jpg",
                                    "width": 1080,
                                    "height": 1080,
                                }
                            ]
                        }
                    }
                }
            ]
        }
        response = InstagramResponse.model_validate(data)
        assert response.items[0].media.image_versions2 is not None
        candidate = response.items[0].media.image_versions2.candidates[0]
        assert candidate.url == "https://example.com/img.jpg"
        assert candidate.width == 1080


class TestInstagramParser:
    def _parse_with_mocked_download(
        self, data: InstagramResponse, image_bytes: bytes = b"fake-image"
    ) -> list[ParsedRecipe]:
        parser = InstagramParser()
        with patch.object(parser, "_download_image", return_value=image_bytes):
            return parser.parse(data)

    def test_parses_single_item(self) -> None:
        data = _make_instagram_response(
            _make_instagram_item(caption="Pasta recipe\nBoil water", username="chef")
        )

        result = self._parse_with_mocked_download(data)

        assert len(result) == 1
        parsed = result[0]
        assert parsed.recipe.title == "Pasta recipe"
        assert parsed.recipe.preparation == ["Pasta recipe\nBoil water"]
        assert parsed.recipe.category == Category.plat
        assert parsed.recipe.tags == ["instagram"]
        assert len(parsed.recipe.sources) == 1
        assert parsed.recipe.sources[0].type == SourceType.instagram
        assert parsed.recipe.sources[0].raw_content == "chef"
        assert parsed.image == b"fake-image"

    def test_parses_multiple_items(self) -> None:
        data = _make_instagram_response(
            _make_instagram_item(caption="Recipe A"),
            _make_instagram_item(caption="Recipe B"),
        )

        result = self._parse_with_mocked_download(data)

        assert len(result) == 2

    def test_no_image_returns_none_bytes(self) -> None:
        data = _make_instagram_response(_make_instagram_item(image_url=None))

        parser = InstagramParser()
        result = parser.parse(data)

        assert result[0].image is None

    def test_title_truncated_to_50_chars(self) -> None:
        long_title = "A" * 100
        data = _make_instagram_response(_make_instagram_item(caption=long_title))

        result = self._parse_with_mocked_download(data)

        assert len(result[0].recipe.title) == 50

    def test_vegetarian_detected(self) -> None:
        data = _make_instagram_response(
            _make_instagram_item(caption="A vegetarian dish")
        )

        result = self._parse_with_mocked_download(data)

        assert result[0].recipe.is_veggie is True

    def test_empty_items(self) -> None:
        parser = InstagramParser()
        assert parser.parse(InstagramResponse(items=[])) == []

    def test_empty_candidates_returns_no_image(self) -> None:
        item = InstagramItem(
            media=InstagramMedia(
                caption=InstagramCaption(text="Hello"),
                image_versions2=InstagramImageVersions(candidates=[]),
            )
        )
        data = _make_instagram_response(item)
        parser = InstagramParser()
        result = parser.parse(data)
        assert result[0].image is None

    def test_non_vegetarian_default(self) -> None:
        data = _make_instagram_response(_make_instagram_item(caption="A meat dish"))

        result = self._parse_with_mocked_download(data)

        assert result[0].recipe.is_veggie is False


class TestInstagramParserDownloadImage:
    def test_download_image_success(self) -> None:
        with patch("miam.infra.importer_instagram.requests.get") as mock_get:
            mock_get.return_value.content = b"image-data"
            mock_get.return_value.raise_for_status = lambda: None

            result = InstagramParser._download_image("https://example.com/img.jpg")

        assert result == b"image-data"
        mock_get.assert_called_once_with(
            "https://example.com/img.jpg",
            headers={
                "User-Agent": "Mozilla/5.0",
                "Referer": "https://www.instagram.com/",
            },
            timeout=30,
        )

    def test_download_image_raises_domain_error_on_connection_error(self) -> None:
        with patch("miam.infra.importer_instagram.requests.get") as mock_get:
            mock_get.side_effect = requests.ConnectionError("timeout")

            with pytest.raises(ImageDownloadError, match="Failed to download image"):
                InstagramParser._download_image("https://example.com/img.jpg")

    def test_download_image_raises_domain_error_on_http_error(self) -> None:
        with patch("miam.infra.importer_instagram.requests.get") as mock_get:
            mock_get.return_value.raise_for_status.side_effect = requests.HTTPError(
                "404"
            )

            with pytest.raises(ImageDownloadError, match="Failed to download image"):
                InstagramParser._download_image("https://example.com/img.jpg")
