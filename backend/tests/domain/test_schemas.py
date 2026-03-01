"""Tests for domain Pydantic schemas and validators."""

import pytest
from pydantic import ValidationError

from miam.domain.entities import Category, Season, SourceType
from miam.domain.schemas import (
    BatchRecipeCreate,
    ImageCreate,
    ImageResponse,
    IngredientCreate,
    RecipeCreate,
    RecipeUpdate,
    SourceCreate,
)


class TestIngredientCreate:
    def test_minimal(self) -> None:
        ing = IngredientCreate(name="flour")
        assert ing.name == "Flour"
        assert ing.quantity is None
        assert ing.unit is None
        assert ing.display_order is None

    def test_capitalize_name(self) -> None:
        assert IngredientCreate(name="sugar").name == "Sugar"
        assert IngredientCreate(name="Salt").name == "Salt"
        assert IngredientCreate(name="PEPPER").name == "PEPPER"

    def test_empty_name_no_error(self) -> None:
        ing = IngredientCreate(name="")
        assert ing.name == ""

    def test_all_fields(self) -> None:
        ing = IngredientCreate(name="butter", quantity=100.5, unit="g", display_order=2)
        assert ing.name == "Butter"
        assert ing.quantity == 100.5
        assert ing.unit == "g"
        assert ing.display_order == 2


class TestImageCreate:
    def test_defaults(self) -> None:
        img = ImageCreate()
        assert img.caption is None
        assert img.display_order is None

    def test_with_values(self) -> None:
        img = ImageCreate(caption="Main photo", display_order=1)
        assert img.caption == "Main photo"
        assert img.display_order == 1


class TestSourceCreate:
    def test_valid(self) -> None:
        src = SourceCreate(type=SourceType.url, raw_content="https://example.com")
        assert src.type == SourceType.url
        assert src.raw_content == "https://example.com"

    def test_invalid_type(self) -> None:
        with pytest.raises(ValidationError):
            SourceCreate(type="invalid", raw_content="content")


class TestRecipeCreate:
    def test_minimal(self) -> None:
        recipe = RecipeCreate(title="Cake", category=Category.dessert)
        assert recipe.title == "Cake"
        assert recipe.description == ""
        assert recipe.category == Category.dessert
        assert recipe.season is None
        assert recipe.is_veggie is False
        assert recipe.difficulty is None
        assert recipe.tested is False
        assert recipe.tags == []
        assert recipe.preparation == []
        assert recipe.ingredients == []
        assert recipe.images == []
        assert recipe.sources == []

    def test_coerce_season_empty_string(self) -> None:
        recipe = RecipeCreate(title="Cake", category=Category.dessert, season="")
        assert recipe.season is None

    def test_season_valid_value(self) -> None:
        recipe = RecipeCreate(
            title="Cake", category=Category.dessert, season=Season.winter
        )
        assert recipe.season == Season.winter

    def test_season_none(self) -> None:
        recipe = RecipeCreate(title="Cake", category=Category.dessert, season=None)
        assert recipe.season is None

    def test_assign_ingredient_display_orders(self) -> None:
        recipe = RecipeCreate(
            title="Cake",
            category=Category.dessert,
            ingredients=[
                IngredientCreate(name="flour"),
                IngredientCreate(name="sugar"),
                IngredientCreate(name="eggs"),
            ],
        )
        assert recipe.ingredients[0].display_order == 0
        assert recipe.ingredients[1].display_order == 1
        assert recipe.ingredients[2].display_order == 2

    def test_preserve_explicit_display_orders(self) -> None:
        recipe = RecipeCreate(
            title="Cake",
            category=Category.dessert,
            ingredients=[
                IngredientCreate(name="flour", display_order=5),
                IngredientCreate(name="sugar"),
            ],
        )
        assert recipe.ingredients[0].display_order == 5
        assert recipe.ingredients[1].display_order == 1

    def test_assign_image_display_orders(self) -> None:
        recipe = RecipeCreate(
            title="Cake",
            category=Category.dessert,
            images=[ImageCreate(), ImageCreate()],
        )
        assert recipe.images[0].display_order == 0
        assert recipe.images[1].display_order == 1

    def test_difficulty_bounds(self) -> None:
        RecipeCreate(title="A", category=Category.plat, difficulty=1)
        RecipeCreate(title="A", category=Category.plat, difficulty=3)
        with pytest.raises(ValidationError):
            RecipeCreate(title="A", category=Category.plat, difficulty=0)
        with pytest.raises(ValidationError):
            RecipeCreate(title="A", category=Category.plat, difficulty=4)

    def test_rate_bounds(self) -> None:
        RecipeCreate(title="A", category=Category.plat, rate=1)
        RecipeCreate(title="A", category=Category.plat, rate=5)
        with pytest.raises(ValidationError):
            RecipeCreate(title="A", category=Category.plat, rate=0)
        with pytest.raises(ValidationError):
            RecipeCreate(title="A", category=Category.plat, rate=6)

    def test_number_of_people_min(self) -> None:
        RecipeCreate(title="A", category=Category.plat, number_of_people=1)
        with pytest.raises(ValidationError):
            RecipeCreate(title="A", category=Category.plat, number_of_people=0)

    def test_invalid_category(self) -> None:
        with pytest.raises(ValidationError):
            RecipeCreate(title="A", category="not_a_category")

    def test_full_recipe(self) -> None:
        recipe = RecipeCreate(
            title="Full Recipe",
            description="A complete recipe",
            prep_time_minutes=15,
            cook_time_minutes=30,
            rest_time_minutes=5,
            season=Season.autumn,
            category=Category.plat,
            is_veggie=True,
            difficulty=2,
            number_of_people=4,
            rate=4,
            tested=True,
            tags=["comfort", "easy"],
            preparation=["Step 1", "Step 2"],
            ingredients=[IngredientCreate(name="salt", quantity=1, unit="tsp")],
            sources=[SourceCreate(type=SourceType.manual, raw_content="Me")],
        )
        assert recipe.title == "Full Recipe"
        assert recipe.season == Season.autumn
        assert recipe.is_veggie is True
        assert len(recipe.tags) == 2
        assert len(recipe.preparation) == 2
        assert recipe.ingredients[0].name == "Salt"


class TestRecipeUpdate:
    def test_minimal(self) -> None:
        update = RecipeUpdate(
            title="Updated", description="Desc", category=Category.entree
        )
        assert update.title == "Updated"
        assert update.description == "Desc"
        assert update.category == Category.entree

    def test_assign_ingredient_display_orders(self) -> None:
        update = RecipeUpdate(
            title="A",
            description="B",
            category=Category.plat,
            ingredients=[
                IngredientCreate(name="flour"),
                IngredientCreate(name="sugar"),
            ],
        )
        assert update.ingredients[0].display_order == 0
        assert update.ingredients[1].display_order == 1

    def test_difficulty_bounds(self) -> None:
        with pytest.raises(ValidationError):
            RecipeUpdate(
                title="A", description="B", category=Category.plat, difficulty=0
            )
        with pytest.raises(ValidationError):
            RecipeUpdate(
                title="A", description="B", category=Category.plat, difficulty=4
            )

    def test_rate_bounds(self) -> None:
        with pytest.raises(ValidationError):
            RecipeUpdate(title="A", description="B", category=Category.plat, rate=0)
        with pytest.raises(ValidationError):
            RecipeUpdate(title="A", description="B", category=Category.plat, rate=6)


class TestBatchRecipeCreate:
    def test_batch(self) -> None:
        batch = BatchRecipeCreate(
            recipes=[
                RecipeCreate(title="A", category=Category.plat),
                RecipeCreate(title="B", category=Category.dessert),
            ]
        )
        assert len(batch.recipes) == 2

    def test_empty_batch(self) -> None:
        batch = BatchRecipeCreate(recipes=[])
        assert batch.recipes == []


class TestImageResponse:
    def test_fields(self) -> None:
        resp = ImageResponse(media_type="image/jpeg", content=b"\xff\xd8")
        assert resp.media_type == "image/jpeg"
        assert resp.content == b"\xff\xd8"
