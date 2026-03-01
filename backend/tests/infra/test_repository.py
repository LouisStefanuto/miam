"""Tests for RecipeRepository against an in-memory SQLite database."""

from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from miam.domain.entities import Category, Season, SourceType
from miam.domain.schemas import (
    IngredientCreate,
    RecipeUpdate,
    SourceCreate,
)
from miam.infra.db.base import Ingredient, Source
from miam.infra.repositories import RecipeRepository
from tests.infra.conftest import make_recipe_create

# ---------------------------------------------------------------------------
# Add recipe
# ---------------------------------------------------------------------------


class TestAddRecipe:
    def test_returns_entity_with_all_fields(self, repository: RecipeRepository) -> None:
        data = make_recipe_create(
            title="Full Recipe",
            description="All fields set",
            category=Category.dessert,
            season=Season.summer,
            is_veggie=True,
            difficulty=2,
            number_of_people=4,
            rate=5,
            tested=True,
            prep_time_minutes=10,
            cook_time_minutes=30,
            rest_time_minutes=5,
            tags=["sweet", "baking"],
            preparation=["Mix", "Bake"],
        )
        entity = repository.add_recipe(data)

        assert entity.title == "Full Recipe"
        assert entity.description == "All fields set"
        assert entity.category == "dessert"
        assert entity.season == "summer"
        assert entity.is_veggie is True
        assert entity.difficulty == 2
        assert entity.number_of_people == 4
        assert entity.rate == 5
        assert entity.tested is True
        assert entity.prep_time_minutes == 10
        assert entity.cook_time_minutes == 30
        assert entity.rest_time_minutes == 5
        assert entity.created_at is not None

    def test_with_ingredients(self, repository: RecipeRepository) -> None:
        data = make_recipe_create(
            ingredients=[
                IngredientCreate(name="Flour", quantity=200, unit="g"),
                IngredientCreate(name="Sugar", quantity=100, unit="g"),
            ]
        )
        entity = repository.add_recipe(data)

        assert len(entity.ingredients) == 2
        names = {i.name for i in entity.ingredients}
        assert names == {"Flour", "Sugar"}

    def test_with_sources(self, repository: RecipeRepository) -> None:
        data = make_recipe_create(
            sources=[SourceCreate(type=SourceType.manual, raw_content="Grandma")]
        )
        entity = repository.add_recipe(data)

        assert len(entity.sources) == 1
        assert entity.sources[0].type == "manual"
        assert entity.sources[0].raw_content == "Grandma"

    def test_minimal_recipe(self, repository: RecipeRepository) -> None:
        data = make_recipe_create(title="Minimal")
        entity = repository.add_recipe(data)

        assert entity.title == "Minimal"
        assert entity.ingredients == []
        assert entity.images == []
        assert entity.sources == []

    def test_ingredient_deduplication(
        self, repository: RecipeRepository, db_session: Session
    ) -> None:
        data1 = make_recipe_create(
            title="R1",
            ingredients=[IngredientCreate(name="Salt", quantity=1, unit="tsp")],
        )
        data2 = make_recipe_create(
            title="R2",
            ingredients=[IngredientCreate(name="Salt", quantity=2, unit="tsp")],
        )
        repository.add_recipe(data1)
        repository.add_recipe(data2)

        # Only one Ingredient row for "Salt"
        count = (
            db_session.execute(select(Ingredient).where(Ingredient.name == "Salt"))
            .scalars()
            .all()
        )
        assert len(count) == 1

    def test_tags_json_round_trip(self, repository: RecipeRepository) -> None:
        data = make_recipe_create(tags=["italian", "quick"])
        entity = repository.add_recipe(data)

        fetched = repository.get_recipe_by_id(entity.id)
        assert fetched is not None
        assert fetched.tags == ["italian", "quick"]

    def test_preparation_json_round_trip(self, repository: RecipeRepository) -> None:
        data = make_recipe_create(preparation=["Step 1", "Step 2"])
        entity = repository.add_recipe(data)

        fetched = repository.get_recipe_by_id(entity.id)
        assert fetched is not None
        assert fetched.preparation == ["Step 1", "Step 2"]


# ---------------------------------------------------------------------------
# Add recipes (batch)
# ---------------------------------------------------------------------------


class TestAddRecipes:
    def test_bulk_returns_all(self, repository: RecipeRepository) -> None:
        recipes = [
            make_recipe_create(title="A"),
            make_recipe_create(title="B"),
            make_recipe_create(title="C"),
        ]
        entities = repository.add_recipes(recipes)

        assert len(entities) == 3
        titles = {e.title for e in entities}
        assert titles == {"A", "B", "C"}

    def test_shared_ingredient_dedup(
        self, repository: RecipeRepository, db_session: Session
    ) -> None:
        recipes = [
            make_recipe_create(
                title="R1",
                ingredients=[IngredientCreate(name="Butter", quantity=50, unit="g")],
            ),
            make_recipe_create(
                title="R2",
                ingredients=[IngredientCreate(name="Butter", quantity=100, unit="g")],
            ),
        ]
        repository.add_recipes(recipes)

        count = (
            db_session.execute(select(Ingredient).where(Ingredient.name == "Butter"))
            .scalars()
            .all()
        )
        assert len(count) == 1

    def test_empty_list(self, repository: RecipeRepository) -> None:
        entities = repository.add_recipes([])
        assert entities == []


# ---------------------------------------------------------------------------
# Get recipe by ID
# ---------------------------------------------------------------------------


class TestGetRecipeById:
    def test_existing_recipe_with_relationships(
        self, repository: RecipeRepository
    ) -> None:
        data = make_recipe_create(
            title="Full",
            ingredients=[IngredientCreate(name="Egg", quantity=3)],
            sources=[
                SourceCreate(type=SourceType.url, raw_content="https://example.com")
            ],
        )
        created = repository.add_recipe(data)

        fetched = repository.get_recipe_by_id(created.id)

        assert fetched is not None
        assert fetched.title == "Full"
        assert len(fetched.ingredients) == 1
        assert fetched.ingredients[0].name == "Egg"
        assert len(fetched.sources) == 1

    def test_not_found_returns_none(self, repository: RecipeRepository) -> None:
        assert repository.get_recipe_by_id(uuid4()) is None


# ---------------------------------------------------------------------------
# Search recipes
# ---------------------------------------------------------------------------


class TestSearchRecipes:
    def _seed(self, repo: RecipeRepository) -> None:
        repo.add_recipe(
            make_recipe_create(
                title="Apple Pie",
                category=Category.dessert,
                is_veggie=True,
                season=Season.autumn,
            )
        )
        repo.add_recipe(
            make_recipe_create(
                title="Beef Stew",
                category=Category.plat,
                is_veggie=False,
                season=Season.winter,
            )
        )
        repo.add_recipe(
            make_recipe_create(
                title="Apple Tart",
                category=Category.dessert,
                is_veggie=True,
                season=Season.summer,
            )
        )

    def test_no_filters(self, repository: RecipeRepository) -> None:
        self._seed(repository)
        result = repository.search_recipes()
        assert result.total == 3
        assert len(result.items) == 3

    def test_by_title(self, repository: RecipeRepository) -> None:
        self._seed(repository)
        result = repository.search_recipes(title="Apple")
        assert result.total == 2
        titles = {r.title for r in result.items}
        assert titles == {"Apple Pie", "Apple Tart"}

    def test_by_title_case_insensitive(self, repository: RecipeRepository) -> None:
        self._seed(repository)
        result = repository.search_recipes(title="apple")
        assert result.total == 2

    def test_by_category(self, repository: RecipeRepository) -> None:
        self._seed(repository)
        result = repository.search_recipes(category="dessert")
        assert result.total == 2

    def test_by_is_veggie(self, repository: RecipeRepository) -> None:
        self._seed(repository)
        result = repository.search_recipes(is_veggie=True)
        assert result.total == 2

    def test_by_season(self, repository: RecipeRepository) -> None:
        self._seed(repository)
        result = repository.search_recipes(season="winter")
        assert result.total == 1
        assert result.items[0].title == "Beef Stew"

    def test_with_limit(self, repository: RecipeRepository) -> None:
        self._seed(repository)
        result = repository.search_recipes(limit=2)
        assert result.total == 3
        assert len(result.items) == 2

    def test_with_offset(self, repository: RecipeRepository) -> None:
        self._seed(repository)
        result = repository.search_recipes(offset=1)
        assert result.total == 3
        assert len(result.items) == 2

    def test_limit_and_offset(self, repository: RecipeRepository) -> None:
        self._seed(repository)
        result = repository.search_recipes(limit=1, offset=1)
        assert result.total == 3
        assert len(result.items) == 1

    def test_combined_filters(self, repository: RecipeRepository) -> None:
        self._seed(repository)
        result = repository.search_recipes(category="dessert", is_veggie=True)
        assert result.total == 2

    def test_no_results(self, repository: RecipeRepository) -> None:
        self._seed(repository)
        result = repository.search_recipes(title="Nonexistent")
        assert result.total == 0
        assert result.items == []


# ---------------------------------------------------------------------------
# Update recipe
# ---------------------------------------------------------------------------


class TestUpdateRecipe:
    def test_scalar_fields(self, repository: RecipeRepository) -> None:
        created = repository.add_recipe(
            make_recipe_create(title="Old", description="Old desc")
        )
        update = RecipeUpdate(
            title="New",
            description="New desc",
            category=Category.dessert,
            is_veggie=True,
            tags=["updated"],
            preparation=["New step"],
        )
        updated = repository.update_recipe(created.id, update)

        assert updated is not None
        assert updated.title == "New"
        assert updated.description == "New desc"
        assert updated.category == "dessert"
        assert updated.is_veggie is True
        assert updated.tags == ["updated"]
        assert updated.preparation == ["New step"]

    def test_replaces_ingredients(self, repository: RecipeRepository) -> None:
        created = repository.add_recipe(
            make_recipe_create(
                ingredients=[IngredientCreate(name="Flour", quantity=200, unit="g")]
            )
        )
        update = RecipeUpdate(
            title=created.title,
            description=created.description,
            category=Category.plat,
            ingredients=[IngredientCreate(name="Rice", quantity=300, unit="g")],
        )
        updated = repository.update_recipe(created.id, update)

        assert updated is not None
        assert len(updated.ingredients) == 1
        assert updated.ingredients[0].name == "Rice"

    def test_replaces_sources(self, repository: RecipeRepository) -> None:
        created = repository.add_recipe(
            make_recipe_create(
                sources=[SourceCreate(type=SourceType.manual, raw_content="Old")]
            )
        )
        update = RecipeUpdate(
            title=created.title,
            description=created.description,
            category=Category.plat,
            sources=[SourceCreate(type=SourceType.url, raw_content="https://new.com")],
        )
        updated = repository.update_recipe(created.id, update)

        assert updated is not None
        assert len(updated.sources) == 1
        assert updated.sources[0].type == "url"

    def test_not_found(self, repository: RecipeRepository) -> None:
        update = RecipeUpdate(title="X", description="Y", category=Category.plat)
        assert repository.update_recipe(uuid4(), update) is None

    def test_clears_ingredients(self, repository: RecipeRepository) -> None:
        created = repository.add_recipe(
            make_recipe_create(
                ingredients=[IngredientCreate(name="Flour", quantity=200, unit="g")]
            )
        )
        update = RecipeUpdate(
            title=created.title,
            description=created.description,
            category=Category.plat,
            ingredients=[],
        )
        updated = repository.update_recipe(created.id, update)

        assert updated is not None
        assert updated.ingredients == []


# ---------------------------------------------------------------------------
# Delete recipe
# ---------------------------------------------------------------------------


class TestDeleteRecipe:
    def test_existing_returns_true_and_gone(self, repository: RecipeRepository) -> None:
        created = repository.add_recipe(make_recipe_create())
        assert repository.delete_recipe(created.id) is True
        assert repository.get_recipe_by_id(created.id) is None

    def test_not_found_returns_false(self, repository: RecipeRepository) -> None:
        assert repository.delete_recipe(uuid4()) is False

    def test_cascades_images(self, repository: RecipeRepository) -> None:
        created = repository.add_recipe(make_recipe_create())
        repository.add_image(created.id, caption="photo")
        repository.delete_recipe(created.id)

        # Image should be gone (FK CASCADE)
        fetched = repository.get_recipe_by_id(created.id)
        assert fetched is None

    def test_source_gets_recipe_id_null(
        self, repository: RecipeRepository, db_session: Session
    ) -> None:
        created = repository.add_recipe(
            make_recipe_create(
                sources=[SourceCreate(type=SourceType.manual, raw_content="Keep me")]
            )
        )
        source_before = db_session.execute(select(Source)).scalars().first()
        assert source_before is not None
        source_id = source_before.id

        repository.delete_recipe(created.id)

        # Source should still exist but with recipe_id = NULL
        source_after = db_session.get(Source, source_id)
        assert source_after is not None
        assert source_after.recipe_id is None


# ---------------------------------------------------------------------------
# Add / delete image
# ---------------------------------------------------------------------------


class TestAddImage:
    def test_creates_linked_image(self, repository: RecipeRepository) -> None:
        created = repository.add_recipe(make_recipe_create())
        img = repository.add_image(created.id, caption="My photo", display_order=1)

        assert img.caption == "My photo"
        assert img.display_order == 1

        fetched = repository.get_recipe_by_id(created.id)
        assert fetched is not None
        assert len(fetched.images) == 1
        assert fetched.images[0].id == img.id

    def test_default_display_order(self, repository: RecipeRepository) -> None:
        created = repository.add_recipe(make_recipe_create())
        img = repository.add_image(created.id)
        assert img.display_order == 0


class TestDeleteImage:
    def test_existing(self, repository: RecipeRepository) -> None:
        created = repository.add_recipe(make_recipe_create())
        img = repository.add_image(created.id, caption="to delete")
        assert repository.delete_image(img.id) is True

    def test_not_found(self, repository: RecipeRepository) -> None:
        assert repository.delete_image(uuid4()) is False
