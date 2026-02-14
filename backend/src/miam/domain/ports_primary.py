"""Define how services can be used by external consumers (e.g., HTTP API, CLI)."""

from abc import ABC, abstractmethod
from uuid import UUID

from miam.domain.schemas import RecipeCreate
from miam.infra.db.base import Recipe


class RecipeServicePort(ABC):
    @abstractmethod
    def create_recipe(self, data: RecipeCreate) -> Recipe:
        """Persist a new recipe with all related entities and return the created Recipe."""
        pass

    @abstractmethod
    def get_recipe_by_id(self, recipe_id: UUID) -> Recipe | None:
        """Retrieve a recipe by its ID, including all related entities."""
        pass

    @abstractmethod
    def search_recipes(
        self,
        recipe_id: UUID | None = None,
        title: str | None = None,
        category: str | None = None,
        is_veggie: bool | None = None,
        season: str | None = None,
    ) -> list[Recipe]:
        """Search for recipes using dynamic filters and return matching Recipe objects."""
        pass

    @abstractmethod
    def add_recipe_image(self, recipe_id: UUID, image: bytes, filename: str) -> UUID:
        """Add an image to a recipe and return its image ID."""
        pass


class RecipeExportServicePort(ABC):
    @abstractmethod
    def export_recipes_to_markdown(self) -> str:
        """Export all recipes as Markdown"""
        pass

    @abstractmethod
    def export_recipes_to_word(self) -> bytes:
        """Export all recipes as Word document"""
        pass
