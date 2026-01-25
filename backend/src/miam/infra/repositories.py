from uuid import UUID

from miam.infra.db.base import Ingredient, Recipe, RecipeIngredient
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload


class RecipeRepository:
    def __init__(self, session: Session):
        self.session = session

    def add_recipe(self, recipe: Recipe) -> Recipe:
        self.session.add(recipe)
        self.session.commit()
        self.session.refresh(recipe)
        return recipe

    def get_or_create_ingredient(self, name: str) -> Ingredient:
        stmt = select(Ingredient).where(Ingredient.name == name)
        ingredient = self.session.execute(stmt).scalars().first()

        if ingredient is None:
            ingredient = Ingredient(name=name)
            self.session.add(ingredient)
            self.session.flush()  # still explicit execution

        return ingredient

    def get_recipe_by_id(self, recipe_id: UUID) -> Recipe | None:
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
