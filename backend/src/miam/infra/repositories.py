"""Handles all database-specific logic using SQLAlchemy."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from miam.domain.ports_secondary import RecipeRepositoryPort
from miam.infra.db.base import Ingredient, Recipe, RecipeIngredient


class RecipeRepository(RecipeRepositoryPort):
    """Concrete implementation of RecipeRepositoryPort using SQLAlchemy."""

    def __init__(self, session: Session):
        """Initialize with a database session."""
        self.session = session

    def add_recipe(self, recipe: Recipe) -> Recipe:
        """Persist a recipe and return it with generated IDs."""
        self.session.add(recipe)
        self.session.commit()
        self.session.refresh(recipe)
        return recipe

    def get_or_create_ingredient(self, name: str) -> Ingredient:
        """Get existing ingredient or create+flush in current transaction."""
        stmt = select(Ingredient).where(Ingredient.name == name)
        ingredient = self.session.execute(stmt).scalars().first()

        if ingredient is None:
            ingredient = Ingredient(name=name)
            self.session.add(ingredient)
            self.session.flush()  # still explicit execution

        return ingredient

    def get_recipe_by_id(self, recipe_id: UUID) -> Recipe | None:
        """Retrieve a recipe with all relationships loaded."""
        stmt = (
            select(Recipe)
            .options(
                joinedload(Recipe.ingredients).joinedload(RecipeIngredient.ingredient),
                joinedload(Recipe.images),
                joinedload(Recipe.sources),
            )
            .where(Recipe.id == recipe_id)
        )

        recipe = self.session.execute(stmt).scalars().first()
        return recipe

    def search_recipes(
        self,
        recipe_id: UUID | None = None,
        title: str | None = None,
        category: str | None = None,
        is_veggie: bool | None = None,
        season: str | None = None,
    ) -> list[Recipe]:
        """Search recipes with dynamic filtering."""
        stmt = select(Recipe).options(
            joinedload(Recipe.ingredients).joinedload(RecipeIngredient.ingredient),
            joinedload(Recipe.images),
            joinedload(Recipe.sources),
        )

        # Apply filters dynamically
        if recipe_id:
            stmt = stmt.where(Recipe.id == recipe_id)
        if title:
            stmt = stmt.where(Recipe.title.ilike(f"%{title}%"))
        if category:
            stmt = stmt.where(Recipe.category == category)
        if is_veggie is not None:
            stmt = stmt.where(Recipe.is_veggie == is_veggie)
        if season:
            stmt = stmt.where(Recipe.season == season)

        return list(self.session.execute(stmt).unique().scalars().all())
