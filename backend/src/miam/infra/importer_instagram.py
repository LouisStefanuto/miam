import re

import requests


def clean_emojis_from_text(text) -> str:
    text = re.sub(r"#\w+", "", text)  # remove hashtags
    emoji_pattern = re.compile(
        "["
        "\U0001f600-\U0001f64f"  # emoticons
        "\U0001f300-\U0001f5ff"  # symbols & pictographs
        "\U0001f680-\U0001f6ff"  # transport & map symbols
        "\U0001f1e0-\U0001f1ff"  # flags
        "\U00002700-\U000027bf"  # dingbats
        "\U0001f900-\U0001f9ff"  # supplemental symbols & pictographs
        "\U0001fa70-\U0001faff"  # symbols & pictographs extended-A
        "\U00002600-\U000026ff"  # miscellaneous symbols
        "\U00002300-\U000023ff"  # miscellaneous technical
        "]+",
        flags=re.UNICODE,
    )
    return emoji_pattern.sub("", text)


# ---- Factory Pattern ----
class RecipeExtractor:
    """Abstract base class for recipe extraction from different sources."""

    def extract(self, item):
        raise NotImplementedError("Extractor must implement 'extract' method.")


class InstagramRecipeExtractor(RecipeExtractor):
    """Extractor for Instagram recipe posts."""

    def extract(self, instagram_response):
        recipe_json_list = []
        image_bytes_list = []
        instagram_item_list = instagram_response["items"]

        for instagram_item in instagram_item_list:
            media = instagram_item.get("media", {})

            # Owner extraction
            owner_username = media.get("owner", {}).get("username", "unknown")

            # Title and Description
            caption_text = media.get("caption", {}).get("text", "")
            caption_text = clean_emojis_from_text(caption_text)

            lines = [l for l in re.split(r"[!\.\n]", caption_text) if l.strip()]
            if lines:
                title = lines[0][:50]
            else:
                words = caption_text.split()
                if words:
                    title = words[0][:4]
                else:
                    title = "Instagram Recipe"

            recipe_json = {
                "title": title,
                "preparation": [caption_text],
                "category": "plat",
                "sources": [{"type": "instagram", "raw_content": owner_username}],
                "tags": ["instagram"],
                "is_veggie": "vegetarian" in caption_text.lower(),
            }

            image_bytes = None
            if "image_versions2" in media:
                candidates = media["image_versions2"].get("candidates", [])
                if candidates:
                    image_url = candidates[0].get("url")
                    headers = {
                        "User-Agent": "Mozilla/5.0",
                        "Referer": "https://www.instagram.com/",
                    }
                    with requests.get(image_url, headers=headers, stream=True) as r:
                        r.raise_for_status()
                        image_bytes = r.content
            recipe_json_list.append(recipe_json)
            image_bytes_list.append(image_bytes)
        return recipe_json_list, image_bytes_list


# ---- Factory Function ----
def get_recipe_extractor(source: str) -> RecipeExtractor:
    """Factory function returning the right extractor for a source."""
    if source.lower() == "instagram":
        return InstagramRecipeExtractor()
    # elif source.lower() == "marmiton":
    #     return MarmitonRecipeExtractor()
    # elif source.lower() == "kikoodo":
    #     return KikoodoRecipeExtractor()
    else:
        raise ValueError(f"Unknown source: {source}")


def post_recipe_to_api(recipe_json):
    # Instantiate recipe
    response_recipe = requests.post(
        "http://localhost:3000/api/recipes", json=recipe_json
    )
    if response_recipe.status_code == 201:
        print("yeay recipe")
        return response_recipe.json().get("id")
    else:
        raise Exception(f"Failed to create recipe: {response_recipe.text}")


def post_image_to_api(image_bytes, recipe_id):
    # Instantiate image
    response_image = requests.post(
        "http://localhost:3000/api/images",
        data={"recipe_id": str(recipe_id)},
        files={"image": ("image.jpg", image_bytes, "image/jpeg")},
    )
    if response_image.status_code == 201:
        print("yeay image")
        return response_image.json().get("image_id")
    else:
        raise Exception(f"Failed to create image: {response_image.text}")


def create_recipe_from_source(source_response, source="instagram"):
    extractor = get_recipe_extractor(source)
    recipe_json_list, image_bytes_list = extractor.extract(source_response)

    for recipe_json, image_bytes in zip(
        recipe_json_list, image_bytes_list, strict=False
    ):
        # Instantiate recipe and image in the database
        recipe_id = post_recipe_to_api(recipe_json)
        if image_bytes:
            post_image_to_api(image_bytes, recipe_id)
