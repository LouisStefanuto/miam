"""Handles all database-specific logic using SQLAlchemy."""

from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from miam.domain.entities import (
    ImageEntity,
    IngredientEntity,
    PaginatedResult,
    RecipeEntity,
    SourceEntity,
)
from miam.domain.ports_secondary import RecipeRepositoryPort
from miam.domain.schemas import (
    IngredientCreate,
    RecipeCreate,
    RecipeUpdate,
    SourceCreate,
)
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

    def add_recipes(self, data: list[RecipeCreate]) -> list[RecipeEntity]:
        """Persist multiple recipes in a single atomic transaction."""
        recipes = []
        for recipe_data in data:
            recipe = Recipe(
                title=recipe_data.title,
                description=recipe_data.description,
                prep_time_minutes=recipe_data.prep_time_minutes,
                cook_time_minutes=recipe_data.cook_time_minutes,
                rest_time_minutes=recipe_data.rest_time_minutes,
                season=recipe_data.season,
                category=recipe_data.category,
                is_veggie=recipe_data.is_veggie,
                difficulty=recipe_data.difficulty,
                number_of_people=recipe_data.number_of_people,
                rate=recipe_data.rate,
                tested=recipe_data.tested,
                tags=recipe_data.tags,
                preparation=recipe_data.preparation,
            )

            for ing in recipe_data.ingredients:
                ingredient = self._get_or_create_ingredient(ing.name)
                ri = RecipeIngredient(
                    ingredient=ingredient, quantity=ing.quantity, unit=ing.unit
                )
                recipe.ingredients.append(ri)

            for img in recipe_data.images:
                image = Image(
                    caption=img.caption,
                    display_order=img.display_order or 0,
                )
                recipe.images.append(image)

            for src in recipe_data.sources:
                source = Source(type=src.type, raw_content=src.raw_content)
                recipe.sources.append(source)

            self.session.add(recipe)
            self.session.flush()
            recipes.append(recipe)

        self.session.commit()
        for recipe in recipes:
            self.session.refresh(recipe)
        return [self._to_entity(recipe) for recipe in recipes]

    def _get_or_create_ingredient(self, name: str) -> Ingredient:
        """Get existing ingredient or create+flush in current transaction."""
        stmt = select(Ingredient).where(Ingredient.name == name)
        ingredient = self.session.execute(stmt).scalars().first()

        if ingredient is None:
            ingredient = Ingredient(name=name)
            self.session.add(ingredient)
            self.session.flush()

        return ingredient

    def _load_recipe(self, recipe_id: UUID) -> Recipe | None:
        """Load a recipe ORM object with all relationships eagerly loaded."""
        stmt = (
            select(Recipe)
            .options(
                joinedload(Recipe.ingredients).joinedload(RecipeIngredient.ingredient),
                joinedload(Recipe.images),
                joinedload(Recipe.sources),
            )
            .where(Recipe.id == recipe_id)
        )
        return self.session.execute(stmt).unique().scalars().first()

    def _replace_ingredients(
        self, recipe: Recipe, ingredients: list[IngredientCreate]
    ) -> None:
        """Clear existing ingredients and re-create from data."""
        recipe.ingredients.clear()
        self.session.flush()
        for ing in ingredients:
            ingredient = self._get_or_create_ingredient(ing.name)
            ri = RecipeIngredient(
                ingredient=ingredient, quantity=ing.quantity, unit=ing.unit
            )
            recipe.ingredients.append(ri)

    def _replace_sources(self, recipe: Recipe, sources: list[SourceCreate]) -> None:
        """Delete existing sources and re-create from data."""
        for src in list(recipe.sources):
            self.session.delete(src)
        recipe.sources.clear()
        self.session.flush()
        for src in sources:
            source = Source(type=src.type, raw_content=src.raw_content)
            recipe.sources.append(source)

    def update_recipe(self, recipe_id: UUID, data: RecipeUpdate) -> RecipeEntity | None:
        recipe = self._load_recipe(recipe_id)
        if recipe is None:
            return None

        recipe.title = data.title
        recipe.description = data.description
        recipe.prep_time_minutes = data.prep_time_minutes
        recipe.cook_time_minutes = data.cook_time_minutes
        recipe.rest_time_minutes = data.rest_time_minutes
        recipe.season = data.season
        recipe.category = data.category
        recipe.is_veggie = data.is_veggie or False
        recipe.difficulty = data.difficulty
        recipe.number_of_people = data.number_of_people
        recipe.rate = data.rate
        recipe.tested = data.tested
        recipe.tags = data.tags
        recipe.preparation = data.preparation

        self._replace_ingredients(recipe, data.ingredients)
        self._replace_sources(recipe, data.sources)

        self.session.commit()
        self.session.refresh(recipe)
        return self._to_entity(recipe)

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

    def _apply_filters(
        self,
        stmt: Any,
        recipe_id: UUID | None,
        title: str | None,
        category: str | None,
        is_veggie: bool | None,
        season: str | None,
    ) -> Any:
        """Apply dynamic filters to a query statement."""
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
        return stmt

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
        """Search recipes with dynamic filtering and pagination."""
        # Count total matching recipes
        count_stmt = select(func.count(Recipe.id))
        count_stmt = self._apply_filters(
            count_stmt, recipe_id, title, category, is_veggie, season
        )
        total = self.session.execute(count_stmt).scalar_one()

        # Fetch recipes with eager loading
        stmt = select(Recipe).options(
            joinedload(Recipe.ingredients).joinedload(RecipeIngredient.ingredient),
            joinedload(Recipe.images),
            joinedload(Recipe.sources),
        )
        stmt = self._apply_filters(stmt, recipe_id, title, category, is_veggie, season)
        stmt = stmt.order_by(Recipe.id)
        if offset:
            stmt = stmt.offset(offset)
        if limit is not None:
            stmt = stmt.limit(limit)

        recipes = self.session.execute(stmt).unique().scalars().all()
        return PaginatedResult(
            items=[self._to_entity(r) for r in recipes],
            total=total,
        )

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

    def delete_recipe(self, recipe_id: UUID) -> bool:
        """Delete a recipe and all related entities (via cascade)."""
        recipe = self._load_recipe(recipe_id)
        if recipe is None:
            return False
        self.session.delete(recipe)
        self.session.commit()
        return True
