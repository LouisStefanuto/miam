from sqlalchemy.orm import Session

from miam.infra.db.base import Ingredient, Recipe


class RecipeRepository:
    def __init__(self, session: Session):
        self.session = session

    def add_recipe(self, recipe: Recipe) -> Recipe:
        self.session.add(recipe)
        self.session.commit()
        self.session.refresh(recipe)
        return recipe

    def get_or_create_ingredient(self, name: str) -> Ingredient:
        ingredient = self.session.query(Ingredient).filter_by(name=name).first()
        if ingredient is None:
            ingredient = Ingredient(name=name)
            self.session.add(ingredient)
            self.session.flush()  # so we can reference id
        return ingredient
