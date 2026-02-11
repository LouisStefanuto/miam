from abc import ABC, abstractmethod
from uuid import UUID

from miam.domain.schemas import RecipeCreate
from miam.infra.db.base import Recipe


class RecipeServicePort(ABC):
    @abstractmethod
    def create_recipe(self, data: RecipeCreate) -> Recipe:
        pass

    @abstractmethod
    def get_recipe_by_id(self, recipe_id: UUID) -> Recipe | None:
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
        pass

    @abstractmethod
    def export_to_markdown(self) -> str:
        pass

    @abstractmethod
    def export_to_word(self) -> bytes:
        pass
