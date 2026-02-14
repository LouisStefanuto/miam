"""Handles exporting recipes to Markdown format."""

from pathlib import Path

from miam.domain.ports_secondary import MarkdownExporterPort
from miam.infra.db.base import Recipe


class MarkdownExporter(MarkdownExporterPort):
    """Secondary adapter that implements MarkdownExporterPort."""

    def to_string(self, recipes: list[Recipe]) -> str:
        """Convert a list of Recipe objects to a Markdown string."""

        def recipe_md(recipe: Recipe) -> str:
            lines = [
                f"# {recipe.title}",
                f"*Category:* {recipe.category.value}",
                f"*Season:* {recipe.season.value if recipe.season else 'Any'}",
                f"*Vegetarian:* {'Yes' if recipe.is_veggie else 'No'}",
                f"*Prep Time:* {recipe.prep_time_minutes or '-'} min",
                f"*Cook Time:* {recipe.cook_time_minutes or '-'} min",
                f"*Rest Time:* {recipe.rest_time_minutes or '-'} min",
                "",
                recipe.description,
                "",
                "## Ingredients",
            ]
            for ri in recipe.ingredients:
                quantity = f"{ri.quantity} " if ri.quantity else ""
                unit = f"{ri.unit} " if ri.unit else ""
                lines.append(f"- {quantity}{unit}{ri.ingredient.name}")

            if recipe.images:
                lines.append("\n## Images")
                for img in recipe.images:
                    lines.append(f"![{img.caption or 'Image'}]({img.id})")

            if recipe.sources:
                lines.append("\n## Sources")
                for src in recipe.sources:
                    lines.append(f"- [{src.type.value}] {src.raw_content}")

            lines.append("\n---\n")
            return "\n".join(lines)

        return "\n".join(recipe_md(r) for r in recipes)

    def save(self, recipes: list[Recipe], output_file: str) -> None:
        """Export a list of Recipe objects to a Markdown file."""
        content = self.to_string(recipes)
        Path(output_file).write_text(content, encoding="utf-8")
