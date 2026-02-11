from uuid import UUID

from miam.domain.ports_primary import RecipeServicePort
from miam.domain.ports_secondary import (
    MarkdownExporterPort,
    RecipeRepositoryPort,
    WordExporterPort,
)
from miam.domain.schemas import RecipeCreate
from miam.infra.db.base import Image, Recipe, RecipeIngredient, Source


class RecipeService(RecipeServicePort):
    def __init__(
        self,
        repository: RecipeRepositoryPort,
        word_exporter: WordExporterPort,
        markdown_exporter: MarkdownExporterPort,
    ):
        self.repository = repository
        self.word_exporter = word_exporter
        self.markdown_exporter = markdown_exporter

    def create_recipe(self, data: RecipeCreate) -> Recipe:
        recipe = Recipe(
            title=data.title,
            description=data.description,
            prep_time_minutes=data.prep_time_minutes,
            cook_time_minutes=data.cook_time_minutes,
            rest_time_minutes=data.rest_time_minutes,
            season=data.season,
            category=data.category,
            is_veggie=data.is_veggie,
        )

        # ingredients
        for ing in data.ingredients:
            ingredient = self.repository.get_or_create_ingredient(ing.name)
            ri = RecipeIngredient(
                ingredient=ingredient, quantity=ing.quantity, unit=ing.unit
            )
            recipe.ingredients.append(ri)

        # images
        for img in data.images:
            image = Image(
                storage_path=img.storage_path,
                caption=img.caption,
                display_order=img.display_order or 0,
            )
            recipe.images.append(image)

        # sources
        for src in data.sources:
            source = Source(type=src.type, raw_content=src.raw_content)
            recipe.sources.append(source)

        return self.repository.add_recipe(recipe)

    def get_recipe_by_id(self, recipe_id: UUID) -> Recipe | None:
        return self.repository.get_recipe_by_id(recipe_id)

    def search_recipes(
        self,
        recipe_id: UUID | None = None,
        title: str | None = None,
        category: str | None = None,
        is_veggie: bool | None = None,
        season: str | None = None,
    ) -> list[Recipe]:
        return self.repository.search_recipes(
            recipe_id=recipe_id,
            title=title,
            category=category,
            is_veggie=is_veggie,
            season=season,
        )

    def export_to_markdown(self) -> str:
        recipes = self.search_recipes()
        return self.markdown_exporter.to_string(recipes)

    def export_to_word(self) -> bytes:
        recipes = self.search_recipes()
        return self.word_exporter.to_bytes(recipes)
