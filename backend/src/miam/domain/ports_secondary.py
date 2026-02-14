"""Define how the domain interacts with infrastructure."""

from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from miam.domain.schemas import ImageResponse
from miam.infra.db.base import Image, Ingredient, Recipe


class RecipeRepositoryPort(ABC):
    """Secondary port for recipe persistence.

    Abstraction for database operations. The domain doesn't care if it's
    SQLAlchemy, MongoDB, or any other persistence mechanism.
    """

    @abstractmethod
    def add_recipe(self, recipe: Recipe) -> Recipe:
        """Persist a new recipe and return it with generated IDs."""
        pass

    @abstractmethod
    def get_or_create_ingredient(self, name: str) -> Ingredient:
        """Get existing ingredient or create new one if it doesn't exist."""
        pass

    @abstractmethod
    def get_recipe_by_id(self, recipe_id: UUID) -> Recipe | None:
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
    ) -> list[Recipe]:
        """Query recipes with dynamic filtering."""
        pass

    @abstractmethod
    def add_image(
        self,
        recipe_id: UUID,
        caption: Optional[str] = None,
        display_order: int | None = 0,
    ) -> Image:
        """Persist an Image record for a recipe and return the created Image.

        Implementations should commit the change and return the ORM Image instance
        (or at least its identifier).
        """
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
        """Add an image to storage and return its image ID.

        The `filename` argument is a string that the caller provides (for example
        derived from the original filename or content-type). Implementations can use it
        to choose the stored filename.
        """
        pass

    @abstractmethod
    def get_recipe_image(self, image_id: UUID) -> ImageResponse | None:
        """Retrieve image bytes from storage by image ID."""
        pass


class WordExporterPort(ABC):
    """Secondary port for Word format export."""

    @abstractmethod
    def save(self, recipes: list[Recipe], output_path: str) -> None:
        """Save recipes to a Word file."""
        pass

    @abstractmethod
    def to_bytes(self, recipes: list[Recipe]) -> bytes:
        """Serialize recipes to Word binary format."""
        pass


class MarkdownExporterPort(ABC):
    """Secondary port for Markdown format export."""

    @abstractmethod
    def save(self, recipes: list[Recipe], output_file: str) -> None:
        """Save recipes to a Markdown file (includes I/O side effect)."""
        pass

    @abstractmethod
    def to_string(self, recipes: list[Recipe]) -> str:
        """Serialize recipes to Markdown string format."""
        pass
