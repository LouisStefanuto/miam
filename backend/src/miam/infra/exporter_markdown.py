"""Handles exporting recipes to Markdown format."""

from pathlib import Path

from miam.domain.entities import RecipeEntity
from miam.domain.ports_secondary import MarkdownExporterPort


class MarkdownExporter(MarkdownExporterPort):
    """Secondary adapter that implements MarkdownExporterPort."""

    def to_string(self, recipes: list[RecipeEntity]) -> str:
        """Convert a list of RecipeEntity objects to a Markdown string."""

        def recipe_md(recipe: RecipeEntity) -> str:
            lines = [
                f"# {recipe.title}",
                f"*Category:* {recipe.category}",
                f"*Season:* {recipe.season or 'Any'}",
                f"*Vegetarian:* {'Yes' if recipe.is_veggie else 'No'}",
                f"*Prep Time:* {recipe.prep_time_minutes or '-'} min",
                f"*Cook Time:* {recipe.cook_time_minutes or '-'} min",
                f"*Rest Time:* {recipe.rest_time_minutes or '-'} min",
            ]

            if recipe.difficulty is not None:
                lines.append(f"*Difficulty:* {recipe.difficulty}/3")
            if recipe.number_of_people is not None:
                lines.append(f"*Serves:* {recipe.number_of_people}")
            if recipe.rate is not None:
                lines.append(f"*Rating:* {recipe.rate}/5")
            lines.append(f"*Tested:* {'Yes' if recipe.tested else 'No'}")

            if recipe.tags:
                lines.append(f"*Tags:* {', '.join(recipe.tags)}")

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
                for img in recipe.images:
                    lines.append(f"![{img.caption or 'Image'}]({img.id})")

            if recipe.sources:
                lines.append("\n## Sources")
                for src in recipe.sources:
                    lines.append(f"- [{src.type}] {src.raw_content}")

            lines.append("\n---\n")
            return "\n".join(lines)

        return "\n".join(recipe_md(r) for r in recipes)

    def save(self, recipes: list[RecipeEntity], output_file: str) -> None:
        """Export a list of RecipeEntity objects to a Markdown file."""
        content = self.to_string(recipes)
        Path(output_file).write_text(content, encoding="utf-8")
