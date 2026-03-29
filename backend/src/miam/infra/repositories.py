"""Handles all database-specific logic using SQLAlchemy."""

from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import ColumnElement, func, or_, select
from sqlalchemy.orm import Session, joinedload

from miam.domain.entities import (
    AuthProvider,
    ImageEntity,
    IngredientEntity,
    PaginatedResult,
    RecipeEntity,
    RecipeShareEntity,
    ShareRole,
    ShareStatus,
    SourceEntity,
    UserEntity,
)
from miam.domain.ports_secondary import (
    RecipeRepositoryPort,
    RecipeShareRepositoryPort,
    UserRepositoryPort,
)
from miam.domain.schemas import (
    IngredientCreate,
    RecipeCreate,
    RecipeUpdate,
    SourceCreate,
)
from miam.infra.db.base import (
    Image,
    Ingredient,
    Recipe,
    RecipeIngredient,
    RecipeShare,
    Source,
    User,
)


class RecipeRepository(RecipeRepositoryPort):
    """Concrete implementation of RecipeRepositoryPort using SQLAlchemy."""

    def __init__(self, session: Session):
        """Initialize with a database session."""
        self.session = session

    def _visible_recipe_filter(self, user_id: UUID) -> ColumnElement[bool]:
        """SQL filter: owned OR has an accepted share."""
        return or_(
            Recipe.owner_id == user_id,
            Recipe.id.in_(
                select(RecipeShare.recipe_id).where(
                    RecipeShare.shared_with_user_id == user_id,
                    RecipeShare.status == ShareStatus.accepted,
                )
            ),
        )

    def _resolve_user_role(self, recipe: Recipe, user_id: UUID) -> str:
        """Determine user's role for a recipe: owner, editor, or reader."""
        if recipe.owner_id == user_id:
            return "owner"
        for share in getattr(recipe, "shares", []):
            if (
                share.shared_with_user_id == user_id
                and share.status == ShareStatus.accepted
            ):
                return str(share.role.value)
        return "reader"

    def _to_entity(self, recipe: Recipe, user_role: str | None = None) -> RecipeEntity:
        """Convert a SQLAlchemy Recipe ORM model to a domain RecipeEntity."""
        return RecipeEntity(
            id=recipe.id,
            title=recipe.title,
            description=recipe.description,
            owner_id=recipe.owner_id,
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
                    display_order=ri.display_order,
                )
                for ri in sorted(recipe.ingredients, key=lambda ri: ri.display_order)
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
            created_at=recipe.created_at,
            user_role=user_role,
            owner_name=(
                recipe.owner.display_name
                if hasattr(recipe, "owner") and recipe.owner
                else None
            ),
        )

    def add_recipe(self, data: RecipeCreate, owner_id: UUID) -> RecipeEntity:
        """Persist a recipe from creation data and return a domain entity."""
        recipe = Recipe(
            owner_id=owner_id,
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
        ingredient_map = self._get_or_create_ingredients(
            {ing.name for ing in data.ingredients}
        )
        for ing in data.ingredients:
            ri = RecipeIngredient(
                ingredient=ingredient_map[ing.name],
                quantity=ing.quantity,
                unit=ing.unit,
                display_order=ing.display_order if ing.display_order is not None else 0,
            )
            recipe.ingredients.append(ri)

        # images
        for img in data.images:
            image = Image(
                caption=img.caption,
                display_order=img.display_order if img.display_order is not None else 0,
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

    def add_recipes(
        self, data: list[RecipeCreate], owner_id: UUID
    ) -> list[RecipeEntity]:
        """Persist multiple recipes in a single atomic transaction."""
        # Bulk-fetch/create all ingredients in one pass
        all_ingredient_names = {
            ing.name for recipe_data in data for ing in recipe_data.ingredients
        }
        ingredient_map = self._get_or_create_ingredients(all_ingredient_names)

        recipes = []
        for recipe_data in data:
            recipe = Recipe(
                owner_id=owner_id,
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
                ri = RecipeIngredient(
                    ingredient=ingredient_map[ing.name],
                    quantity=ing.quantity,
                    unit=ing.unit,
                    display_order=ing.display_order,
                )
                recipe.ingredients.append(ri)

            for img in recipe_data.images:
                image = Image(
                    caption=img.caption,
                    display_order=img.display_order,
                )
                recipe.images.append(image)

            for src in recipe_data.sources:
                source = Source(type=src.type, raw_content=src.raw_content)
                recipe.sources.append(source)

            self.session.add(recipe)
            recipes.append(recipe)

        self.session.commit()
        for recipe in recipes:
            self.session.refresh(recipe)
        return [self._to_entity(recipe) for recipe in recipes]

    def _get_or_create_ingredients(self, names: set[str]) -> dict[str, Ingredient]:
        """Bulk-fetch existing ingredients and create missing ones in a single pass."""
        if not names:
            return {}

        stmt = select(Ingredient).where(Ingredient.name.in_(names))
        existing = {ing.name: ing for ing in self.session.execute(stmt).scalars().all()}

        missing_names = names - existing.keys()
        for name in missing_names:
            ingredient = Ingredient(name=name)
            self.session.add(ingredient)
            existing[name] = ingredient

        if missing_names:
            self.session.flush()

        return existing

    def _load_recipe(self, recipe_id: UUID, user_id: UUID) -> Recipe | None:
        """Load a recipe ORM object with all relationships, visible to user."""
        stmt = (
            select(Recipe)
            .options(
                joinedload(Recipe.ingredients).joinedload(RecipeIngredient.ingredient),
                joinedload(Recipe.images),
                joinedload(Recipe.sources),
            )
            .where(Recipe.id == recipe_id, self._visible_recipe_filter(user_id))
        )
        return self.session.execute(stmt).unique().scalars().first()

    def _replace_ingredients(
        self, recipe: Recipe, ingredients: list[IngredientCreate]
    ) -> None:
        """Clear existing ingredients and re-create from data."""
        recipe.ingredients.clear()
        self.session.flush()
        ingredient_map = self._get_or_create_ingredients(
            {ing.name for ing in ingredients}
        )
        for ing in ingredients:
            ri = RecipeIngredient(
                ingredient=ingredient_map[ing.name],
                quantity=ing.quantity,
                unit=ing.unit,
                display_order=ing.display_order if ing.display_order is not None else 0,
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

    def update_recipe(
        self, recipe_id: UUID, data: RecipeUpdate, user_id: UUID
    ) -> RecipeEntity | None:
        recipe = self._load_recipe(recipe_id, user_id)
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

    def get_recipe_by_id(self, recipe_id: UUID, user_id: UUID) -> RecipeEntity | None:
        """Retrieve a recipe with all relationships loaded, visible to user."""
        stmt = (
            select(Recipe)
            .options(
                joinedload(Recipe.ingredients).joinedload(RecipeIngredient.ingredient),
                joinedload(Recipe.images),
                joinedload(Recipe.sources),
                joinedload(Recipe.owner),
            )
            .where(Recipe.id == recipe_id, self._visible_recipe_filter(user_id))
        )

        recipe = self.session.execute(stmt).scalars().first()
        if recipe is None:
            return None
        role = self._resolve_user_role(recipe, user_id)
        return self._to_entity(recipe, user_role=role)

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

    def _ownership_filter(
        self, user_id: UUID, ownership: str | None
    ) -> ColumnElement[bool]:
        """Return a SQL filter based on ownership parameter."""
        if ownership == "owned":
            return Recipe.owner_id == user_id
        if ownership == "shared":
            return Recipe.id.in_(
                select(RecipeShare.recipe_id).where(
                    RecipeShare.shared_with_user_id == user_id,
                    RecipeShare.status == ShareStatus.accepted,
                )
            )
        # "all" or None: show both owned and shared
        return self._visible_recipe_filter(user_id)

    def search_recipes(
        self,
        user_id: UUID,
        recipe_id: UUID | None = None,
        title: str | None = None,
        category: str | None = None,
        is_veggie: bool | None = None,
        season: str | None = None,
        limit: int | None = None,
        offset: int = 0,
        ownership: str | None = None,
    ) -> PaginatedResult:
        """Search recipes with dynamic filtering and pagination, visible to user."""
        visibility = self._ownership_filter(user_id, ownership)

        # Count total matching recipes
        count_stmt = select(func.count(Recipe.id)).where(visibility)
        count_stmt = self._apply_filters(
            count_stmt, recipe_id, title, category, is_veggie, season
        )
        total = self.session.execute(count_stmt).scalar_one()

        # Fetch recipes with eager loading
        stmt = (
            select(Recipe)
            .options(
                joinedload(Recipe.ingredients).joinedload(RecipeIngredient.ingredient),
                joinedload(Recipe.images),
                joinedload(Recipe.sources),
                joinedload(Recipe.owner),
            )
            .where(visibility)
        )
        stmt = self._apply_filters(stmt, recipe_id, title, category, is_veggie, season)
        stmt = stmt.order_by(Recipe.created_at.desc())
        if offset:
            stmt = stmt.offset(offset)
        if limit is not None:
            stmt = stmt.limit(limit)

        recipes = self.session.execute(stmt).unique().scalars().all()
        return PaginatedResult(
            items=[
                self._to_entity(r, user_role=self._resolve_user_role(r, user_id))
                for r in recipes
            ],
            total=total,
        )

    def add_image(
        self,
        recipe_id: UUID,
        user_id: UUID,
        caption: str | None = None,
        display_order: int | None = 0,
    ) -> ImageEntity:
        """Create and persist an Image linked to a recipe visible to user_id."""
        recipe = (
            self.session.execute(
                select(Recipe).where(
                    Recipe.id == recipe_id,
                    self._visible_recipe_filter(user_id),
                )
            )
            .scalars()
            .first()
        )
        if recipe is None:
            msg = f"Recipe {recipe_id} not found or not accessible by user"
            raise ValueError(msg)
        image = Image(
            recipe_id=recipe_id,
            caption=caption,
            display_order=display_order if display_order is not None else 0,
        )

        self.session.add(image)
        self.session.commit()
        self.session.refresh(image)
        return ImageEntity(
            id=image.id,
            caption=image.caption,
            display_order=image.display_order,
        )

    def delete_image(self, image_id: UUID, user_id: UUID) -> bool:
        """Delete an Image record by ID, only if its recipe is visible to user_id."""
        stmt = (
            select(Image)
            .join(Recipe, Image.recipe_id == Recipe.id)
            .where(Image.id == image_id, self._visible_recipe_filter(user_id))
        )
        image = self.session.execute(stmt).scalars().first()
        if image is None:
            return False
        self.session.delete(image)
        self.session.commit()
        return True

    def image_belongs_to_user(self, image_id: UUID, user_id: UUID) -> bool:
        """Check if an image belongs to a recipe visible to the given user."""
        stmt = (
            select(Image)
            .join(Recipe, Image.recipe_id == Recipe.id)
            .where(Image.id == image_id, self._visible_recipe_filter(user_id))
        )
        return self.session.execute(stmt).scalars().first() is not None

    def delete_recipe(self, recipe_id: UUID, user_id: UUID) -> bool:
        """Delete a recipe and all related entities, scoped to user."""
        recipe = self._load_recipe(recipe_id, user_id)
        if recipe is None:
            return False
        self.session.delete(recipe)
        self.session.commit()
        return True


class UserRepository(UserRepositoryPort):
    """Concrete implementation of UserRepositoryPort using SQLAlchemy."""

    def __init__(self, session: Session):
        self.session = session

    def _to_entity(self, user: User) -> UserEntity:
        return UserEntity(
            id=user.id,
            email=user.email,
            display_name=user.display_name,
            avatar_url=user.avatar_url,
            auth_provider=user.auth_provider,
            auth_provider_id=user.auth_provider_id,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )

    def create_user(
        self,
        email: str,
        display_name: str,
        auth_provider: AuthProvider,
        auth_provider_id: str,
        avatar_url: str | None = None,
    ) -> UserEntity:
        user = User(
            email=email,
            display_name=display_name,
            auth_provider=auth_provider,
            auth_provider_id=auth_provider_id,
            avatar_url=avatar_url,
        )
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return self._to_entity(user)

    def get_user_by_id(self, user_id: UUID) -> UserEntity | None:
        user = self.session.get(User, user_id)
        if user is None:
            return None
        return self._to_entity(user)

    def get_user_by_email(self, email: str) -> UserEntity | None:
        stmt = select(User).where(User.email == email)
        user = self.session.execute(stmt).scalars().first()
        if user is None:
            return None
        return self._to_entity(user)

    def get_user_by_provider(
        self, auth_provider: AuthProvider, auth_provider_id: str
    ) -> UserEntity | None:
        stmt = select(User).where(
            User.auth_provider == auth_provider,
            User.auth_provider_id == auth_provider_id,
        )
        user = self.session.execute(stmt).scalars().first()
        if user is None:
            return None
        return self._to_entity(user)


class RecipeShareRepository(RecipeShareRepositoryPort):
    """Concrete implementation of RecipeShareRepositoryPort using SQLAlchemy."""

    def __init__(self, session: Session):
        self.session = session

    def _to_entity(self, share: RecipeShare) -> RecipeShareEntity:
        return RecipeShareEntity(
            id=share.id,
            recipe_id=share.recipe_id,
            shared_by_user_id=share.shared_by_user_id,
            shared_with_user_id=share.shared_with_user_id,
            role=share.role,
            status=share.status,
            recipe_title=share.recipe.title if share.recipe else None,
            shared_by_name=share.shared_by.display_name if share.shared_by else None,
            shared_with_email=share.shared_with.email if share.shared_with else None,
            shared_with_name=(
                share.shared_with.display_name if share.shared_with else None
            ),
            created_at=share.created_at,
            updated_at=share.updated_at,
        )

    def _load_share(self, share_id: UUID) -> RecipeShare | None:
        stmt = (
            select(RecipeShare)
            .options(
                joinedload(RecipeShare.recipe),
                joinedload(RecipeShare.shared_by),
                joinedload(RecipeShare.shared_with),
            )
            .where(RecipeShare.id == share_id)
        )
        return self.session.execute(stmt).unique().scalars().first()

    def create_share(
        self,
        recipe_id: UUID,
        shared_by_user_id: UUID,
        shared_with_user_id: UUID,
        role: ShareRole,
    ) -> RecipeShareEntity:
        share = RecipeShare(
            recipe_id=recipe_id,
            shared_by_user_id=shared_by_user_id,
            shared_with_user_id=shared_with_user_id,
            role=role,
        )
        self.session.add(share)
        self.session.commit()
        self.session.refresh(share)
        loaded = self._load_share(share.id)
        return self._to_entity(loaded)  # type: ignore[arg-type]

    def get_share_by_id(self, share_id: UUID) -> RecipeShareEntity | None:
        share = self._load_share(share_id)
        if share is None:
            return None
        return self._to_entity(share)

    def get_pending_shares_for_user(self, user_id: UUID) -> list[RecipeShareEntity]:
        stmt = (
            select(RecipeShare)
            .options(
                joinedload(RecipeShare.recipe),
                joinedload(RecipeShare.shared_by),
                joinedload(RecipeShare.shared_with),
            )
            .where(
                RecipeShare.shared_with_user_id == user_id,
                RecipeShare.status == ShareStatus.pending,
            )
            .order_by(RecipeShare.created_at.desc())
        )
        shares = self.session.execute(stmt).unique().scalars().all()
        return [self._to_entity(s) for s in shares]

    def get_pending_shares_count(self, user_id: UUID) -> int:
        stmt = select(func.count(RecipeShare.id)).where(
            RecipeShare.shared_with_user_id == user_id,
            RecipeShare.status == ShareStatus.pending,
        )
        return self.session.execute(stmt).scalar_one()

    def get_shares_for_recipe(self, recipe_id: UUID) -> list[RecipeShareEntity]:
        stmt = (
            select(RecipeShare)
            .options(
                joinedload(RecipeShare.recipe),
                joinedload(RecipeShare.shared_by),
                joinedload(RecipeShare.shared_with),
            )
            .where(RecipeShare.recipe_id == recipe_id)
            .order_by(RecipeShare.created_at.desc())
        )
        shares = self.session.execute(stmt).unique().scalars().all()
        return [self._to_entity(s) for s in shares]

    def get_share_for_recipe_and_user(
        self, recipe_id: UUID, user_id: UUID
    ) -> RecipeShareEntity | None:
        stmt = (
            select(RecipeShare)
            .options(
                joinedload(RecipeShare.recipe),
                joinedload(RecipeShare.shared_by),
                joinedload(RecipeShare.shared_with),
            )
            .where(
                RecipeShare.recipe_id == recipe_id,
                RecipeShare.shared_with_user_id == user_id,
            )
        )
        share = self.session.execute(stmt).unique().scalars().first()
        if share is None:
            return None
        return self._to_entity(share)

    def update_share_status(
        self, share_id: UUID, status: ShareStatus
    ) -> RecipeShareEntity | None:
        share = self.session.get(RecipeShare, share_id)
        if share is None:
            return None
        share.status = status
        share.updated_at = datetime.now(UTC)
        self.session.commit()
        self.session.refresh(share)
        loaded = self._load_share(share.id)
        return self._to_entity(loaded)  # type: ignore[arg-type]

    def accept_all_pending_shares(self, user_id: UUID) -> list[RecipeShareEntity]:
        stmt = (
            select(RecipeShare)
            .options(
                joinedload(RecipeShare.recipe),
                joinedload(RecipeShare.shared_by),
                joinedload(RecipeShare.shared_with),
            )
            .where(
                RecipeShare.shared_with_user_id == user_id,
                RecipeShare.status == ShareStatus.pending,
            )
        )
        shares = self.session.execute(stmt).unique().scalars().all()
        now = datetime.now(UTC)
        for share in shares:
            share.status = ShareStatus.accepted
            share.updated_at = now
        self.session.commit()
        for share in shares:
            self.session.refresh(share)
        return [self._to_entity(s) for s in shares]

    def delete_share(self, share_id: UUID) -> bool:
        share = self.session.get(RecipeShare, share_id)
        if share is None:
            return False
        self.session.delete(share)
        self.session.commit()
        return True

    def get_user_role_for_recipe(self, recipe_id: UUID, user_id: UUID) -> str | None:
        """Return 'owner', 'editor', 'reader', or None."""
        recipe = (
            self.session.execute(select(Recipe).where(Recipe.id == recipe_id))
            .scalars()
            .first()
        )
        if recipe is None:
            return None
        if recipe.owner_id == user_id:
            return "owner"
        share = (
            self.session.execute(
                select(RecipeShare).where(
                    RecipeShare.recipe_id == recipe_id,
                    RecipeShare.shared_with_user_id == user_id,
                    RecipeShare.status == ShareStatus.accepted,
                )
            )
            .scalars()
            .first()
        )
        if share is not None:
            return share.role.value
        return None
