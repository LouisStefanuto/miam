"""Handles all database-specific logic using SQLAlchemy."""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from miam.domain.entities import (
    ImageEntity,
    IngredientEntity,
    RecipeEntity,
    SourceEntity,
)
from miam.domain.ports_secondary import RecipeRepositoryPort
from miam.domain.schemas import RecipeCreate
from miam.infra.db.base import Image, Ingredient, Recipe, RecipeIngredient, Source


class RecipeRepository(RecipeRepositoryPort):
    """Concrete implementation of RecipeRepositoryPort using SQLAlchemy."""

    def __init__(self, session: Session):
        """Initialize with a database session."""
        self.session = session

    def _to_entity(self, recipe: Recipe) -> RecipeEntity:
        """Convert a SQLAlchemy Recipe ORM model to a domain RecipeEntity."""
        return RecipeEntity(
            id=recipe.id,
            title=recipe.title,
            description=recipe.description,
            prep_time_minutes=recipe.prep_time_minutes,
            cook_time_minutes=recipe.cook_time_minutes,
            rest_time_minutes=recipe.rest_time_minutes,
            season=recipe.season.value if recipe.season else None,
            category=recipe.category.value,
            is_veggie=recipe.is_veggie,
            difficulty=recipe.difficulty,
            number_of_people=recipe.number_of_people,
            rate=recipe.rate,
            tested=recipe.tested,
            tags=recipe.tags or [],
            preparation=recipe.preparation or [],
            ingredients=[
                IngredientEntity(
                    name=ri.ingredient.name,
                    quantity=ri.quantity,
                    unit=ri.unit,
                )
                for ri in recipe.ingredients
            ],
            images=[
                ImageEntity(
                    id=img.id,
                    caption=img.caption,
                    display_order=img.display_order,
                )
                for img in recipe.images
            ],
            sources=[
                SourceEntity(
                    type=src.type.value,
                    raw_content=src.raw_content,
                )
                for src in recipe.sources
            ],
        )

    def add_recipe(self, data: RecipeCreate) -> RecipeEntity:
        """Persist a recipe from creation data and return a domain entity."""
        recipe = Recipe(
            title=data.title,
            description=data.description,
            prep_time_minutes=data.prep_time_minutes,
            cook_time_minutes=data.cook_time_minutes,
            rest_time_minutes=data.rest_time_minutes,
            season=data.season,
            category=data.category,
            is_veggie=data.is_veggie,
            difficulty=data.difficulty,
            number_of_people=data.number_of_people,
            rate=data.rate,
            tested=data.tested,
            tags=data.tags,
            preparation=data.preparation,
        )

        # ingredients
        for ing in data.ingredients:
            ingredient = self._get_or_create_ingredient(ing.name)
            ri = RecipeIngredient(
                ingredient=ingredient, quantity=ing.quantity, unit=ing.unit
            )
            recipe.ingredients.append(ri)

        # images
        for img in data.images:
            image = Image(
                caption=img.caption,
                display_order=img.display_order or 0,
            )
            recipe.images.append(image)

        # sources
        for src in data.sources:
            source = Source(type=src.type, raw_content=src.raw_content)
            recipe.sources.append(source)

        self.session.add(recipe)
        self.session.commit()
        self.session.refresh(recipe)
        return self._to_entity(recipe)

    def _get_or_create_ingredient(self, name: str) -> Ingredient:
        """Get existing ingredient or create+flush in current transaction."""
        stmt = select(Ingredient).where(Ingredient.name == name)
        ingredient = self.session.execute(stmt).scalars().first()

        if ingredient is None:
            ingredient = Ingredient(name=name)
            self.session.add(ingredient)
            self.session.flush()

        return ingredient

    def get_recipe_by_id(self, recipe_id: UUID) -> RecipeEntity | None:
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
        if recipe is None:
            return None
        return self._to_entity(recipe)

    def search_recipes(
        self,
        recipe_id: UUID | None = None,
        title: str | None = None,
        category: str | None = None,
        is_veggie: bool | None = None,
        season: str | None = None,
    ) -> list[RecipeEntity]:
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

        recipes = self.session.execute(stmt).unique().scalars().all()
        return [self._to_entity(r) for r in recipes]

    def add_image(
        self,
        recipe_id: UUID,
        caption: str | None = None,
        display_order: int | None = 0,
    ) -> ImageEntity:
        """Create and persist an Image linked to a recipe."""
        image = Image(
            recipe_id=recipe_id,
            caption=caption,
            display_order=display_order or 0,
        )

        self.session.add(image)
        self.session.commit()
        self.session.refresh(image)
        return ImageEntity(
            id=image.id,
            caption=image.caption,
            display_order=image.display_order,
        )
