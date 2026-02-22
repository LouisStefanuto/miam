"""Define how the domain interacts with infrastructure."""

from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from miam.domain.entities import ImageEntity, RecipeEntity
from miam.domain.schemas import ImageResponse, RecipeCreate, RecipeUpdate


class RecipeRepositoryPort(ABC):
    """Secondary port for recipe persistence.

    Abstraction for database operations. The domain doesn't care if it's
    SQLAlchemy, MongoDB, or any other persistence mechanism.
    """

    @abstractmethod
    def add_recipe(self, data: RecipeCreate) -> RecipeEntity:
        """Persist a new recipe and return it as a domain entity."""
        pass

    @abstractmethod
    def get_recipe_by_id(self, recipe_id: UUID) -> RecipeEntity | None:
        """Retrieve a recipe by ID with all relationships loaded."""
        pass

    @abstractmethod
    def search_recipes(
        self,
        recipe_id: Optional[UUID] = None,
        title: Optional[str] = None,
        category: Optional[str] = None,
        is_veggie: Optional[bool] = None,
        season: Optional[str] = None,
    ) -> list[RecipeEntity]:
        """Query recipes with dynamic filtering."""
        pass

    @abstractmethod
    def update_recipe(self, recipe_id: UUID, data: RecipeUpdate) -> RecipeEntity | None:
        """Full replacement of a recipe. Returns None if not found."""
        pass

    @abstractmethod
    def delete_recipe(self, recipe_id: UUID) -> bool:
        """Delete a recipe by ID. Returns True if deleted, False if not found."""
        pass

    @abstractmethod
    def add_image(
        self,
        recipe_id: UUID,
        caption: Optional[str] = None,
        display_order: int | None = 0,
    ) -> ImageEntity:
        """Persist an Image record for a recipe and return the created ImageEntity."""
        pass


class ImageStoragePort(ABC):
    @abstractmethod
    def add_recipe_image(
        self,
        recipe_id: UUID,
        image: bytes,
        filename: str,
        image_id: UUID,
    ) -> UUID:
        """Add an image to storage and return its image ID."""
        pass

    @abstractmethod
    def get_recipe_image(self, image_id: UUID) -> ImageResponse | None:
        """Retrieve image bytes from storage by image ID."""
        pass

    @abstractmethod
    def delete_image(self, image_id: UUID) -> bool:
        """Delete an image file from storage. Returns True if deleted, False if not found."""
        pass


class WordExporterPort(ABC):
    """Secondary port for Word format export."""

    @abstractmethod
    def save(self, recipes: list[RecipeEntity], output_path: str) -> None:
        """Save recipes to a Word file."""
        pass

    @abstractmethod
    def to_bytes(self, recipes: list[RecipeEntity]) -> bytes:
        """Serialize recipes to Word binary format."""
        pass


class MarkdownExporterPort(ABC):
    """Secondary port for Markdown format export."""

    @abstractmethod
    def save(self, recipes: list[RecipeEntity], output_file: str) -> None:
        """Save recipes to a Markdown file (includes I/O side effect)."""
        pass

    @abstractmethod
    def to_string(self, recipes: list[RecipeEntity]) -> str:
        """Serialize recipes to Markdown string format."""
        pass
