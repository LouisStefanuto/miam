"""Handles exporting recipes to Markdown format."""

import io
import mimetypes
import zipfile
from pathlib import Path

from loguru import logger

from miam.domain.entities import RecipeEntity
from miam.domain.ports_secondary import ImageStoragePort, MarkdownExporterPort


class MarkdownExporter(MarkdownExporterPort):
    """Secondary adapter that implements MarkdownExporterPort."""

    def __init__(self, image_storage: ImageStoragePort | None = None):
        self.image_storage = image_storage

    def _recipe_md(
        self,
        recipe: RecipeEntity,
        image_filenames: dict[str, str] | None = None,
    ) -> str:
        """Build markdown for a single recipe.

        Args:
            image_filenames: mapping of image ID -> filename in the ZIP
                             (e.g. "uuid.png"). When provided, image references
                             use ``images/{filename}``; otherwise bare UUIDs.
        """

        def _table(headers: list[str], values: list[str]) -> list[str]:
            return [
                "| " + " | ".join(headers) + " |",
                "| " + " | ".join(":---:" for _ in headers) + " |",
                "| " + " | ".join(values) + " |",
            ]

        lines = [f"# {recipe.title}"]

        # Classification: category, season, vegetarian, tested, rating
        cls_h = ["Category", "Season", "Vegetarian", "Tested"]
        cls_v = [
            recipe.category.capitalize(),
            (recipe.season or "Any").capitalize(),
            "🥬🥬🥬" if recipe.is_veggie else "🥩🥩🥩",
            "YES" if recipe.tested else "NO",
        ]
        if recipe.rate is not None:
            cls_h.append("Rating")
            cls_v.append("⭐" * recipe.rate + "☆" * (5 - recipe.rate))
        lines.extend(["", *_table(cls_h, cls_v)])

        # Times & servings: prep, cook, rest, servings, difficulty
        time_h = ["Prep", "Cook", "Rest"]
        time_v = [
            f"{recipe.prep_time_minutes or '-'} min",
            f"{recipe.cook_time_minutes or '-'} min",
            f"{recipe.rest_time_minutes or '-'} min",
        ]
        if recipe.number_of_people is not None:
            time_h.append("Serves")
            time_v.append(str(recipe.number_of_people))
        if recipe.difficulty is not None:
            time_h.append("Difficulty")
            time_v.append("●" * recipe.difficulty + "○" * (3 - recipe.difficulty))
        lines.extend(["", *_table(time_h, time_v)])

        # Tags
        if recipe.tags:
            lines.append(f"\n*Tags:* {', '.join(recipe.tags)}")

        lines.extend(["", recipe.description, "", "## Ingredients"])

        for ing in recipe.ingredients:
            quantity = f"{ing.quantity} " if ing.quantity else ""
            unit = f"{ing.unit} " if ing.unit else ""
            lines.append(f"- {quantity}{unit}{ing.name}")

        if recipe.preparation:
            lines.append("\n## Preparation")
            for i, step in enumerate(recipe.preparation, 1):
                lines.append(f"{i}. {step}")

        if recipe.images:
            lines.append("\n## Images")
            sorted_images = sorted(recipe.images, key=lambda img: img.display_order)
            for img in sorted_images:
                caption = img.caption or "Image"
                img_id_str = str(img.id)
                if image_filenames and img_id_str in image_filenames:
                    lines.append(f"![{caption}](images/{image_filenames[img_id_str]})")
                else:
                    lines.append(f"![{caption}]({img.id})")

        if recipe.sources:
            lines.append("\n## Sources")
            for src in recipe.sources:
                lines.append(f"- [{src.type}] {src.raw_content}")

        lines.append("\n---\n")
        return "\n".join(lines)

    def to_string(self, recipes: list[RecipeEntity]) -> str:
        """Convert a list of RecipeEntity objects to a Markdown string."""
        return "\n".join(self._recipe_md(r) for r in recipes)

    def to_zip_bytes(self, recipes: list[RecipeEntity]) -> bytes:
        """Create a ZIP archive containing the Markdown file and image files."""
        # First pass: collect image bytes and resolve filenames (id + extension)
        image_filenames: dict[str, str] = {}  # image_id -> "uuid.ext"
        image_data: dict[str, bytes] = {}  # "uuid.ext" -> raw bytes

        if self.image_storage:
            seen_ids: set[str] = set()
            for recipe in recipes:
                for img in recipe.images:
                    img_id_str = str(img.id)
                    if img_id_str in seen_ids:
                        continue
                    seen_ids.add(img_id_str)
                    try:
                        resp = self.image_storage.get_recipe_image(img.id)
                        if resp is None:
                            continue
                        ext = mimetypes.guess_extension(resp.media_type) or ""
                        filename = f"{img.id}{ext}"
                        image_filenames[img_id_str] = filename
                        image_data[filename] = resp.content
                    except Exception:
                        logger.warning(
                            f"Failed to include image {img.id} in ZIP, skipping"
                        )

        # Second pass: build the ZIP with correct image references in markdown
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            md_content = "\n".join(
                self._recipe_md(r, image_filenames=image_filenames) for r in recipes
            )
            zf.writestr("recipes.md", md_content)

            for filename, content in image_data.items():
                zf.writestr(f"images/{filename}", content)

        return buf.getvalue()

    def save(self, recipes: list[RecipeEntity], output_file: str) -> None:
        """Export a list of RecipeEntity objects to a Markdown file."""
        content = self.to_string(recipes)
        Path(output_file).write_text(content, encoding="utf-8")
