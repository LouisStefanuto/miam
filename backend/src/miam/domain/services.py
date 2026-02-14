"""Domain services that orchestrate recipe operations."""

from uuid import UUID

from miam.domain.ports_primary import RecipeExportServicePort, RecipeServicePort
from miam.domain.ports_secondary import (
    ImageStoragePort,
    MarkdownExporterPort,
    RecipeRepositoryPort,
    WordExporterPort,
)
from miam.domain.schemas import RecipeCreate
from miam.infra.db.base import Image, Recipe, RecipeIngredient, Source


class RecipeManagementService(RecipeServicePort):
    """Service for recipe creation, retrieval, and search operations."""

    def __init__(
        self,
        repository: RecipeRepositoryPort,
        image_storage: ImageStoragePort,
    ):
        self.repository = repository
        self.image_storage = image_storage

    def create_recipe(self, data: RecipeCreate) -> Recipe:
        """Create a new recipe with ingredients, images, and sources."""
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
        """Retrieve a recipe by ID via the persistence abstraction."""
        return self.repository.get_recipe_by_id(recipe_id)

    def search_recipes(
        self,
        recipe_id: UUID | None = None,
        title: str | None = None,
        category: str | None = None,
        is_veggie: bool | None = None,
        season: str | None = None,
    ) -> list[Recipe]:
        """Search/filter recipes via the repository abstraction."""
        return self.repository.search_recipes(
            recipe_id=recipe_id,
            title=title,
            category=category,
            is_veggie=is_veggie,
            season=season,
        )

    def add_recipe_image(self, recipe_id: UUID, image: bytes, filename: str) -> UUID:
        """Add an image to a recipe and return its image ID."""
        # Persist image record in DB and return DB-generated image id
        img = self.repository.add_image(
            recipe_id=recipe_id, caption=None, display_order=0
        )

        # Save bytes to storage and get a storage path suitable for DB
        self.image_storage.add_recipe_image(recipe_id, image, filename)

        return img.id


class RecipeExportService(RecipeExportServicePort):
    """Service for exporting recipes to different formats."""

    def __init__(
        self,
        repository: RecipeRepositoryPort,
        word_exporter: WordExporterPort,
        markdown_exporter: MarkdownExporterPort,
    ):
        self.repository = repository
        self.word_exporter = word_exporter
        self.markdown_exporter = markdown_exporter

    def export_recipes_to_markdown(self) -> str:
        """Export all recipes as Markdown string."""
        recipes = self.repository.search_recipes()
        return self.markdown_exporter.to_string(recipes)

    def export_recipes_to_word(self) -> bytes:
        """Export all recipes as Word binary format (in-memory)."""
        recipes = self.repository.search_recipes()
        return self.word_exporter.to_bytes(recipes)
