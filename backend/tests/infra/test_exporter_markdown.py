import io
import pathlib
import uuid
import zipfile
from unittest.mock import MagicMock

import pytest

from miam.domain.entities import (
    ImageEntity,
    IngredientEntity,
    RecipeEntity,
    SourceEntity,
)
from miam.domain.schemas import ImageResponse
from miam.infra.exporter_markdown import MarkdownExporter


# -----------------------------
# Fixtures for test data
# -----------------------------
@pytest.fixture
def sample_recipes() -> list[RecipeEntity]:
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
def test_exporter_to_string(sample_recipes: list[RecipeEntity]) -> None:
    exporter = MarkdownExporter()
    output = exporter.to_string(sample_recipes)

    assert isinstance(output, str)
    assert "Test Cake" in output
    assert "Flour" in output
    assert "Sugar" in output
    assert "Yummy" in output
    assert "Grandma's recipe" in output
    # Classification table
    assert "| Category |" in output
    assert "⭐⭐⭐⭐⭐" in output
    assert "🥬🥬🥬" in output  # vegetarian
    assert "YES" in output  # tested
    assert "Summer" in output  # season
    # Times table
    assert "| Prep |" in output
    assert "●●○" in output  # difficulty 2/3
    assert "| 4 |" in output  # serves
    # Tags
    assert "sweet, baking" in output
    assert "Mix flour and sugar" in output
    assert "Bake at 180C for 30 min" in output


def test_exporter_to_markdown(
    tmp_path: pathlib.Path, sample_recipes: list[RecipeEntity]
) -> None:
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


def test_exporter_to_zip_bytes(sample_recipes: list[RecipeEntity]) -> None:
    image_id = sample_recipes[0].images[0].id
    fake_png = b"\x89PNG\r\n\x1a\nfake-image-data"

    mock_storage = MagicMock()
    mock_storage.get_recipe_image.return_value = ImageResponse(
        content=fake_png, media_type="image/png"
    )

    exporter = MarkdownExporter(image_storage=mock_storage)
    zip_bytes = exporter.to_zip_bytes(sample_recipes)

    assert isinstance(zip_bytes, bytes)

    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        names = zf.namelist()
        assert "recipes.md" in names

        # Image should be in images/ folder with .png extension
        image_files = [n for n in names if n.startswith("images/")]
        assert len(image_files) == 1
        assert image_files[0] == f"images/{image_id}.png"

        # Verify image content
        assert zf.read(image_files[0]) == fake_png

        # Verify markdown references images/ folder with correct extension
        md_content = zf.read("recipes.md").decode("utf-8")
        assert f"![Yummy](images/{image_id}.png)" in md_content
        assert "Test Cake" in md_content


def test_exporter_to_zip_bytes_without_storage(
    sample_recipes: list[RecipeEntity],
) -> None:
    exporter = MarkdownExporter()
    zip_bytes = exporter.to_zip_bytes(sample_recipes)

    with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
        names = zf.namelist()
        assert "recipes.md" in names
        # No images folder when no storage provided
        image_files = [n for n in names if n.startswith("images/")]
        assert len(image_files) == 0
