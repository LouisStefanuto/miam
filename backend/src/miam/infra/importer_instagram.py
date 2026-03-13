"""Instagram parser adapter — converts Instagram JSON into RecipeCreate schemas."""

import re

import requests

from miam.domain.entities import Category, SourceType
from miam.domain.exceptions import ImageDownloadError
from miam.domain.ports_secondary import InstagramParserPort
from miam.domain.schemas import (
    InstagramMedia,
    InstagramResponse,
    ParsedRecipe,
    RecipeCreate,
    SourceCreate,
)


def _clean_emojis_from_text(text: str) -> str:
    """Remove hashtags and emojis from text."""
    text = re.sub(r"#\w+", "", text)
    emoji_pattern = re.compile(
        "["
        "\U0001f600-\U0001f64f"
        "\U0001f300-\U0001f5ff"
        "\U0001f680-\U0001f6ff"
        "\U0001f1e0-\U0001f1ff"
        "\U00002700-\U000027bf"
        "\U0001f900-\U0001f9ff"
        "\U0001fa70-\U0001faff"
        "\U00002600-\U000026ff"
        "\U00002300-\U000023ff"
        "]+",
        flags=re.UNICODE,
    )
    return emoji_pattern.sub("", text)


def _extract_title(caption_text: str) -> str:
    """Extract a short title from the caption text."""
    lines = [line for line in re.split(r"[!\.\n]", caption_text) if line.strip()]
    if lines:
        return lines[0].strip()[:50]
    words = caption_text.split()
    if words:
        return words[0][:4]
    return "Instagram Recipe"


class InstagramParser(InstagramParserPort):
    """Infra adapter that parses Instagram JSON and downloads images."""

    def parse(self, data: InstagramResponse) -> list[ParsedRecipe]:
        """Parse validated Instagram data, download images, return ParsedRecipe list."""
        results: list[ParsedRecipe] = []

        for item in data.items:
            media = item.media

            caption_text = _clean_emojis_from_text(media.caption.text)
            title = _extract_title(caption_text)

            recipe = RecipeCreate(
                title=title,
                preparation=[caption_text],
                category=Category.plat,
                sources=[
                    SourceCreate(
                        type=SourceType.instagram,
                        raw_content=media.owner.username,
                    )
                ],
                tags=["instagram"],
                is_veggie="vegetarian" in caption_text.lower(),
            )

            image_url = self._get_best_image_url(media)
            image_bytes = self._download_image(image_url) if image_url else None
            results.append(ParsedRecipe(recipe=recipe, image=image_bytes))

        return results

    @staticmethod
    def _get_best_image_url(media: InstagramMedia) -> str | None:
        """Get the URL of the first image candidate."""
        if media.image_versions2 is None:
            return None
        candidates = media.image_versions2.candidates
        if not candidates:
            return None
        return candidates[0].url

    @staticmethod
    def _download_image(url: str) -> bytes:
        """Download image bytes from an Instagram CDN URL."""
        headers = {
            "User-Agent": "Mozilla/5.0",
            "Referer": "https://www.instagram.com/",
        }
        try:
            resp = requests.get(url, headers=headers, timeout=30)
            resp.raise_for_status()
        except requests.RequestException as exc:
            raise ImageDownloadError(f"Failed to download image from {url}") from exc
        return resp.content
