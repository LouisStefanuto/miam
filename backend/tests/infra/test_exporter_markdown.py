import pytest
import uuid
from miam.infra.db.base import (
    Recipe,
    RecipeIngredient,
    Ingredient,
    Image,
    Source,
    SourceType,
    Category,
    Season,
)
from miam.infra.exporter_markdown import MarkdownExporter


# -----------------------------
# Fixtures for test data
# -----------------------------
@pytest.fixture
def sample_recipes():
    ingredient1 = Ingredient(id=uuid.uuid4(), name="Flour")
    ingredient2 = Ingredient(id=uuid.uuid4(), name="Sugar")

    recipe = Recipe(
        id=uuid.uuid4(),
        title="Test Cake",
        description="Delicious test cake.",
        prep_time_minutes=10,
        cook_time_minutes=30,
        rest_time_minutes=5,
        season=Season.summer,
        category=Category.dessert,
        is_veggie=True,
    )

    # Add ingredients
    ri1 = RecipeIngredient(
        recipe=recipe, ingredient=ingredient1, quantity=200, unit="g"
    )
    ri2 = RecipeIngredient(
        recipe=recipe, ingredient=ingredient2, quantity=100, unit="g"
    )
    recipe.ingredients = [ri1, ri2]

    # Add image
    recipe.images = [
        Image(
            id=uuid.uuid4(),
            storage_path="path/to/image.jpg",
            caption="Yummy",
            recipe=recipe,
        )
    ]

    # Add source
    recipe.sources = [
        Source(
            id=uuid.uuid4(),
            type=SourceType.manual,
            raw_content="Grandma's recipe",
            recipe=recipe,
        )
    ]

    return [recipe]


# -----------------------------
# Tests
# -----------------------------
def test_exporter_to_string(sample_recipes):
    exporter = MarkdownExporter()
    output = exporter.to_string(sample_recipes)

    assert isinstance(output, str)
    assert "Test Cake" in output
    assert "Flour" in output
    assert "Sugar" in output
    assert "Yummy" in output
    assert "Grandma's recipe" in output


def test_exporter_to_markdown(tmp_path, sample_recipes):
    exporter = MarkdownExporter()
    output_file = tmp_path / "recipes.md"

    exporter.to_markdown(sample_recipes, output_file=str(output_file))

    # Check file was created
    assert output_file.exists()

    # Check content
    content = output_file.read_text(encoding="utf-8")
    assert "Test Cake" in content
    assert "Flour" in content
    assert "Sugar" in content
    assert "Yummy" in content
    assert "Grandma's recipe" in content
    assert content.startswith("# Test Cake")
