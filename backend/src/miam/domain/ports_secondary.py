"""Define how the domain interacts with infrastructure."""

from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from miam.infra.db.base import Ingredient, Recipe


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
