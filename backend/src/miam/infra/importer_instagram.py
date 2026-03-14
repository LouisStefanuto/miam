"""Instagram parser adapter — converts Instagram JSON into RecipeCreate schemas."""

import re

from miam.domain.entities import Category, SourceType
from miam.domain.ports_secondary import InstagramParserPort
from miam.domain.schemas import (
    InstagramMedia,
    InstagramResponse,
    ParsedRecipe,
    RecipeCreate,
    SourceCreate,
)


def _clean_emojis_from_text(text: str) -> str:
    """Remove hashtags and emojis/symbols from text.

    Uses an allowlist approach: keeps letters, digits, common punctuation,
    and whitespace. Everything else (emojis, dingbats, symbols) is stripped.
    """
    text = re.sub(r"#\w+", "", text)
    return re.sub(r"[^\w\s.,;:!?'\"()\-–—/&@°€$£%+*=\n]", "", text)


def _extract_title(caption_text: str) -> str:
    """Extract a short title from the caption text.

    Splits on newlines or sentence-ending punctuation followed by whitespace
    (e.g. ". " or "! ") so that numbers like "2.5" are not broken.
    """
    lines = [line for line in re.split(r"\n|[!.]\s", caption_text) if line.strip()]
    if lines:
        return lines[0].strip()[:50]
    words = caption_text.split()
    if words and re.search(r"\w", words[0]):
        return words[0][:50]
    return "Instagram Recipe"


class InstagramParser(InstagramParserPort):
    """Infra adapter that parses Instagram JSON into RecipeCreate schemas."""

    def parse(self, data: InstagramResponse) -> list[ParsedRecipe]:
        """Parse validated Instagram data, return ParsedRecipe list with image URLs."""
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
            results.append(ParsedRecipe(recipe=recipe, image_url=image_url))

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
