from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from miam.infra.db.base import Ingredient, Recipe


class RecipeRepositoryPort(ABC):
    @abstractmethod
    def add_recipe(self, recipe: Recipe) -> Recipe:
        pass

    @abstractmethod
    def get_or_create_ingredient(self, name: str) -> Ingredient:
        pass

    @abstractmethod
    def get_recipe_by_id(self, recipe_id: UUID) -> Recipe | None:
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
        pass


class WordExporterPort(ABC):
    @abstractmethod
    def export(self, recipes: list[Recipe], output_path: str) -> None:
        pass

    @abstractmethod
    def to_bytes(self, recipes: list[Recipe]) -> bytes:
        pass


class MarkdownExporterPort(ABC):
    @abstractmethod
    def to_string(self, recipes: list[Recipe]) -> str:
        pass

    @abstractmethod
    def to_markdown(self, recipes: list[Recipe], output_file: str) -> None:
        pass
