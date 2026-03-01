"""Tests for domain entities and enums."""

from datetime import datetime, timezone
from uuid import uuid4

from miam.domain.entities import (
    Category,
    ImageEntity,
    IngredientEntity,
    PaginatedResult,
    RecipeEntity,
    Season,
    SourceEntity,
    SourceType,
)


class TestSeason:
    def test_values(self) -> None:
        assert Season.winter.value == "winter"
        assert Season.spring.value == "spring"
        assert Season.summer.value == "summer"
        assert Season.autumn.value == "autumn"

    def test_member_count(self) -> None:
        assert len(Season) == 4


class TestCategory:
    def test_values(self) -> None:
        assert Category.apero.value == "apero"
        assert Category.entree.value == "entree"
        assert Category.plat.value == "plat"
        assert Category.dessert.value == "dessert"
        assert Category.boisson.value == "boisson"
        assert Category.gouter.value == "gouter"
        assert Category.pates.value == "pâtes"

    def test_member_count(self) -> None:
        assert len(Category) == 7


class TestSourceType:
    def test_values(self) -> None:
        assert SourceType.manual.value == "manual"
        assert SourceType.instagram.value == "instagram"
        assert SourceType.url.value == "url"
        assert SourceType.photo.value == "photo"

    def test_member_count(self) -> None:
        assert len(SourceType) == 4


class TestIngredientEntity:
    def test_required_fields(self) -> None:
        ing = IngredientEntity(name="Flour")
        assert ing.name == "Flour"
        assert ing.quantity is None
        assert ing.unit is None
        assert ing.display_order == 0

    def test_all_fields(self) -> None:
        ing = IngredientEntity(name="Sugar", quantity=200.0, unit="g", display_order=3)
        assert ing.name == "Sugar"
        assert ing.quantity == 200.0
        assert ing.unit == "g"
        assert ing.display_order == 3


class TestImageEntity:
    def test_defaults(self) -> None:
        uid = uuid4()
        img = ImageEntity(id=uid)
        assert img.id == uid
        assert img.caption is None
        assert img.display_order == 0

    def test_all_fields(self) -> None:
        uid = uuid4()
        img = ImageEntity(id=uid, caption="Plated dish", display_order=2)
        assert img.caption == "Plated dish"
        assert img.display_order == 2


class TestSourceEntity:
    def test_fields(self) -> None:
        src = SourceEntity(type="url", raw_content="https://example.com/recipe")
        assert src.type == "url"
        assert src.raw_content == "https://example.com/recipe"


class TestRecipeEntity:
    def test_minimal(self) -> None:
        uid = uuid4()
        recipe = RecipeEntity(id=uid, title="Pasta", description="Simple pasta", category="plat")
        assert recipe.id == uid
        assert recipe.title == "Pasta"
        assert recipe.description == "Simple pasta"
        assert recipe.category == "plat"
        assert recipe.prep_time_minutes is None
        assert recipe.cook_time_minutes is None
        assert recipe.rest_time_minutes is None
        assert recipe.season is None
        assert recipe.is_veggie is False
        assert recipe.difficulty is None
        assert recipe.number_of_people is None
        assert recipe.rate is None
        assert recipe.tested is False
        assert recipe.tags == []
        assert recipe.preparation == []
        assert recipe.ingredients == []
        assert recipe.images == []
        assert recipe.sources == []
        assert recipe.created_at is None

    def test_full(self) -> None:
        uid = uuid4()
        img_id = uuid4()
        now = datetime.now(tz=timezone.utc)
        recipe = RecipeEntity(
            id=uid,
            title="Ratatouille",
            description="French classic",
            category="plat",
            prep_time_minutes=30,
            cook_time_minutes=60,
            rest_time_minutes=10,
            season="summer",
            is_veggie=True,
            difficulty=2,
            number_of_people=4,
            rate=5,
            tested=True,
            tags=["french", "vegetable"],
            preparation=["Chop vegetables", "Layer in dish"],
            ingredients=[IngredientEntity(name="Eggplant", quantity=2, unit="pcs")],
            images=[ImageEntity(id=img_id, caption="Final dish")],
            sources=[SourceEntity(type="manual", raw_content="Family recipe")],
            created_at=now,
        )
        assert recipe.prep_time_minutes == 30
        assert recipe.cook_time_minutes == 60
        assert recipe.rest_time_minutes == 10
        assert recipe.season == "summer"
        assert recipe.is_veggie is True
        assert recipe.difficulty == 2
        assert recipe.number_of_people == 4
        assert recipe.rate == 5
        assert recipe.tested is True
        assert len(recipe.tags) == 2
        assert len(recipe.preparation) == 2
        assert len(recipe.ingredients) == 1
        assert len(recipe.images) == 1
        assert len(recipe.sources) == 1
        assert recipe.created_at == now

    def test_list_fields_are_independent(self) -> None:
        """Each instance should have its own list (no shared mutable defaults)."""
        r1 = RecipeEntity(id=uuid4(), title="A", description="", category="plat")
        r2 = RecipeEntity(id=uuid4(), title="B", description="", category="plat")
        r1.tags.append("tag1")
        assert r2.tags == []


class TestPaginatedResult:
    def test_fields(self) -> None:
        recipes = [
            RecipeEntity(id=uuid4(), title="A", description="", category="plat"),
            RecipeEntity(id=uuid4(), title="B", description="", category="dessert"),
        ]
        result = PaginatedResult(items=recipes, total=10)
        assert len(result.items) == 2
        assert result.total == 10

    def test_empty(self) -> None:
        result = PaginatedResult(items=[], total=0)
        assert result.items == []
        assert result.total == 0
