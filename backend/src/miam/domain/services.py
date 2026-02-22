"""Domain services that orchestrate recipe operations."""

from uuid import UUID

from miam.domain.entities import ImageEntity, RecipeEntity
from miam.domain.ports_primary import RecipeExportServicePort, RecipeServicePort
from miam.domain.ports_secondary import (
    ImageStoragePort,
    MarkdownExporterPort,
    RecipeRepositoryPort,
    WordExporterPort,
)
from miam.domain.schemas import ImageResponse, RecipeCreate, RecipeUpdate


class RecipeManagementService(RecipeServicePort):
    """Service for recipe creation, retrieval, and search operations."""

    def __init__(
        self,
        repository: RecipeRepositoryPort,
        image_storage: ImageStoragePort,
    ):
        self.repository = repository
        self.image_storage = image_storage

    def create_recipe(self, data: RecipeCreate) -> RecipeEntity:
        """Create a new recipe with ingredients, images, and sources."""
        return self.repository.add_recipe(data)

    def create_recipes(self, data: list[RecipeCreate]) -> list[RecipeEntity]:
        """Create multiple recipes in a single atomic transaction."""
        return self.repository.add_recipes(data)

    def get_recipe_by_id(self, recipe_id: UUID) -> RecipeEntity | None:
        """Retrieve a recipe by ID via the persistence abstraction."""
        return self.repository.get_recipe_by_id(recipe_id)

    def search_recipes(
        self,
        recipe_id: UUID | None = None,
        title: str | None = None,
        category: str | None = None,
        is_veggie: bool | None = None,
        season: str | None = None,
    ) -> list[RecipeEntity]:
        """Search/filter recipes via the repository abstraction."""
        return self.repository.search_recipes(
            recipe_id=recipe_id,
            title=title,
            category=category,
            is_veggie=is_veggie,
            season=season,
        )

    def update_recipe(self, recipe_id: UUID, data: RecipeUpdate) -> RecipeEntity | None:
        return self.repository.update_recipe(recipe_id, data)

    def delete_recipe(self, recipe_id: UUID) -> bool:
        recipe = self.repository.get_recipe_by_id(recipe_id)
        if recipe is None:
            return False
        for image in recipe.images:
            self.image_storage.delete_image(image.id)
        return self.repository.delete_recipe(recipe_id)

    def add_recipe_image(self, recipe_id: UUID, content: bytes, filename: str) -> UUID:
        """Add an image to a recipe and return its image ID."""
        img: ImageEntity = self.repository.add_image(
            recipe_id=recipe_id,
            caption=None,
            display_order=0,
        )

        self.image_storage.add_recipe_image(recipe_id, content, filename, img.id)
        return img.id

    def get_recipe_image(self, image_id: UUID) -> ImageResponse | None:
        """Retrieve image bytes from storage by image ID."""
        return self.image_storage.get_recipe_image(image_id)


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

    def export_recipes_to_markdown(self) -> bytes:
        """Export all recipes as a ZIP archive containing Markdown and images."""
        recipes = self.repository.search_recipes()
        return self.markdown_exporter.to_zip_bytes(recipes)

    def export_recipes_to_word(self) -> bytes:
        """Export all recipes as Word binary format (in-memory)."""
        recipes = self.repository.search_recipes()
        return self.word_exporter.to_bytes(recipes)
