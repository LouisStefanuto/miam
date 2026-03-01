"""Define how services can be used by external consumers (e.g., HTTP API, CLI)."""

from abc import ABC, abstractmethod
from uuid import UUID

from miam.domain.entities import PaginatedResult, RecipeEntity
from miam.domain.schemas import ImageResponse, RecipeCreate, RecipeUpdate


class RecipeServicePort(ABC):
    @abstractmethod
    def create_recipe(self, data: RecipeCreate) -> RecipeEntity:
        """Persist a new recipe with all related entities and return the created Recipe."""

    @abstractmethod
    def create_recipes(self, data: list[RecipeCreate]) -> list[RecipeEntity]:
        """Persist multiple recipes atomically and return all created Recipe entities."""

    @abstractmethod
    def get_recipe_by_id(self, recipe_id: UUID) -> RecipeEntity | None:
        """Retrieve a recipe by its ID, including all related entities."""

    @abstractmethod
    def search_recipes(
        self,
        recipe_id: UUID | None = None,
        title: str | None = None,
        category: str | None = None,
        is_veggie: bool | None = None,
        season: str | None = None,
        limit: int | None = None,
        offset: int = 0,
    ) -> PaginatedResult:
        """Search for recipes using dynamic filters with pagination."""

    @abstractmethod
    def update_recipe(self, recipe_id: UUID, data: RecipeUpdate) -> RecipeEntity | None:
        """Full replacement of a recipe (PUT semantics). Returns None if not found."""

    @abstractmethod
    def delete_recipe(self, recipe_id: UUID) -> bool:
        """Delete a recipe by ID. Returns True if deleted, False if not found."""

    @abstractmethod
    def add_recipe_image(self, recipe_id: UUID, content: bytes, filename: str) -> UUID:
        """Add an image to a recipe and return its image ID."""

    @abstractmethod
    def get_recipe_image(self, image_id: UUID) -> ImageResponse | None:
        """Retrieve image bytes for a given image ID."""

    @abstractmethod
    def delete_recipe_image(self, image_id: UUID) -> bool:
        """Delete an image from storage and database. Returns True if deleted, False if not found."""


class RecipeExportServicePort(ABC):
    @abstractmethod
    def export_recipes_to_markdown(self) -> bytes:
        """Export all recipes as a ZIP archive containing Markdown and images."""

    @abstractmethod
    def export_recipes_to_word(self) -> bytes:
        """Export all recipes as Word document."""
