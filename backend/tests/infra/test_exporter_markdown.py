import uuid

import pytest

from miam.domain.entities import (
    ImageEntity,
    IngredientEntity,
    RecipeEntity,
    SourceEntity,
)
from miam.infra.exporter_markdown import MarkdownExporter


# -----------------------------
# Fixtures for test data
# -----------------------------
@pytest.fixture
def sample_recipes():
    recipe = RecipeEntity(
        id=uuid.uuid4(),
        title="Test Cake",
        description="Delicious test cake.",
        prep_time_minutes=10,
        cook_time_minutes=30,
        rest_time_minutes=5,
        season="summer",
        category="dessert",
        is_veggie=True,
        difficulty=2,
        number_of_people=4,
        rate=5,
        tested=True,
        tags=["sweet", "baking"],
        preparation=["Mix flour and sugar", "Bake at 180C for 30 min"],
        ingredients=[
            IngredientEntity(name="Flour", quantity=200, unit="g"),
            IngredientEntity(name="Sugar", quantity=100, unit="g"),
        ],
        images=[
            ImageEntity(id=uuid.uuid4(), caption="Yummy"),
        ],
        sources=[
            SourceEntity(type="manual", raw_content="Grandma's recipe"),
        ],
    )

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
    assert "*Difficulty:* 2/3" in output
    assert "*Serves:* 4" in output
    assert "*Rating:* 5/5" in output
    assert "sweet, baking" in output
    assert "Mix flour and sugar" in output
    assert "Bake at 180C for 30 min" in output


def test_exporter_to_markdown(tmp_path, sample_recipes):
    exporter = MarkdownExporter()
    output_file = tmp_path / "recipes.md"

    exporter.save(sample_recipes, output_file=str(output_file))

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
