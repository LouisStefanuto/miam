"""Tests for domain services using stub implementations of ports."""

from uuid import UUID, uuid4

from miam.domain.entities import (
    ImageEntity,
    PaginatedResult,
    RecipeEntity,
)
from miam.domain.ports_secondary import (
    ImageStoragePort,
    MarkdownExporterPort,
    RecipeRepositoryPort,
    WordExporterPort,
)
from miam.domain.schemas import ImageResponse, RecipeCreate, RecipeUpdate
from miam.domain.services import RecipeExportService, RecipeManagementService

# ---------------------------------------------------------------------------
# Stub implementations of secondary ports
# ---------------------------------------------------------------------------


class StubRecipeRepository(RecipeRepositoryPort):
    """In-memory recipe repository for testing."""

    def __init__(self) -> None:
        self.recipes: dict[UUID, RecipeEntity] = {}
        self.images: dict[UUID, ImageEntity] = {}
        self._recipe_images: dict[UUID, list[UUID]] = {}

    def add_recipe(self, data: RecipeCreate) -> RecipeEntity:
        uid = uuid4()
        entity = RecipeEntity(
            id=uid,
            title=data.title,
            description=data.description,
            category=data.category.value,
        )
        self.recipes[uid] = entity
        self._recipe_images[uid] = []
        return entity

    def add_recipes(self, data: list[RecipeCreate]) -> list[RecipeEntity]:
        return [self.add_recipe(d) for d in data]

    def get_recipe_by_id(self, recipe_id: UUID) -> RecipeEntity | None:
        return self.recipes.get(recipe_id)

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
        items = list(self.recipes.values())
        if title:
            items = [r for r in items if title.lower() in r.title.lower()]
        if category:
            items = [r for r in items if r.category == category]
        total = len(items)
        items = items[offset:]
        if limit is not None:
            items = items[:limit]
        return PaginatedResult(items=items, total=total)

    def update_recipe(self, recipe_id: UUID, data: RecipeUpdate) -> RecipeEntity | None:
        if recipe_id not in self.recipes:
            return None
        existing = self.recipes[recipe_id]
        updated = RecipeEntity(
            id=recipe_id,
            title=data.title,
            description=data.description,
            category=data.category.value,
            images=existing.images,
        )
        self.recipes[recipe_id] = updated
        return updated

    def delete_recipe(self, recipe_id: UUID) -> bool:
        if recipe_id in self.recipes:
            del self.recipes[recipe_id]
            return True
        return False

    def add_image(
        self,
        recipe_id: UUID,
        caption: str | None = None,
        display_order: int | None = 0,
    ) -> ImageEntity:
        img_id = uuid4()
        img = ImageEntity(id=img_id, caption=caption, display_order=display_order or 0)
        self.images[img_id] = img
        if recipe_id in self.recipes:
            self.recipes[recipe_id].images.append(img)
        return img

    def delete_image(self, image_id: UUID) -> bool:
        if image_id in self.images:
            del self.images[image_id]
            return True
        return False


class StubImageStorage(ImageStoragePort):
    """In-memory image storage for testing."""

    def __init__(self) -> None:
        self.stored: dict[UUID, tuple[bytes, str]] = {}
        self.delete_calls: list[UUID] = []

    def add_recipe_image(
        self, recipe_id: UUID, image: bytes, filename: str, image_id: UUID
    ) -> UUID:
        self.stored[image_id] = (image, filename)
        return image_id

    def get_recipe_image(self, image_id: UUID) -> ImageResponse | None:
        if image_id in self.stored:
            content, _ = self.stored[image_id]
            return ImageResponse(media_type="image/jpeg", content=content)
        return None

    def delete_image(self, image_id: UUID) -> bool:
        self.delete_calls.append(image_id)
        if image_id in self.stored:
            del self.stored[image_id]
            return True
        return False


class StubWordExporter(WordExporterPort):
    def __init__(self) -> None:
        self.last_recipes: list[RecipeEntity] = []

    def save(self, recipes: list[RecipeEntity], output_path: str) -> None:
        self.last_recipes = recipes

    def to_bytes(self, recipes: list[RecipeEntity]) -> bytes:
        self.last_recipes = recipes
        return b"word-content"


class StubMarkdownExporter(MarkdownExporterPort):
    def __init__(self) -> None:
        self.last_recipes: list[RecipeEntity] = []

    def save(self, recipes: list[RecipeEntity], output_file: str) -> None:
        self.last_recipes = recipes

    def to_string(self, recipes: list[RecipeEntity]) -> str:
        self.last_recipes = recipes
        return "markdown"

    def to_zip_bytes(self, recipes: list[RecipeEntity]) -> bytes:
        self.last_recipes = recipes
        return b"zip-content"


# ---------------------------------------------------------------------------
# Tests for RecipeManagementService
# ---------------------------------------------------------------------------


class TestRecipeManagementServiceCreate:
    def setup_method(self) -> None:
        self.repo = StubRecipeRepository()
        self.storage = StubImageStorage()
        self.service = RecipeManagementService(self.repo, self.storage)

    def test_create_recipe(self) -> None:
        from miam.domain.entities import Category

        data = RecipeCreate(title="Soup", category=Category.plat)
        result = self.service.create_recipe(data)
        assert result.title == "Soup"
        assert result.id in self.repo.recipes

    def test_create_recipes_batch(self) -> None:
        from miam.domain.entities import Category

        data = [
            RecipeCreate(title="A", category=Category.plat),
            RecipeCreate(title="B", category=Category.dessert),
        ]
        results = self.service.create_recipes(data)
        assert len(results) == 2
        assert len(self.repo.recipes) == 2


class TestRecipeManagementServiceGet:
    def setup_method(self) -> None:
        self.repo = StubRecipeRepository()
        self.storage = StubImageStorage()
        self.service = RecipeManagementService(self.repo, self.storage)

    def test_get_existing(self) -> None:
        from miam.domain.entities import Category

        created = self.service.create_recipe(
            RecipeCreate(title="Cake", category=Category.dessert)
        )
        found = self.service.get_recipe_by_id(created.id)
        assert found is not None
        assert found.title == "Cake"

    def test_get_not_found(self) -> None:
        result = self.service.get_recipe_by_id(uuid4())
        assert result is None


class TestRecipeManagementServiceSearch:
    def setup_method(self) -> None:
        self.repo = StubRecipeRepository()
        self.storage = StubImageStorage()
        self.service = RecipeManagementService(self.repo, self.storage)

    def test_search_all(self) -> None:
        from miam.domain.entities import Category

        self.service.create_recipe(RecipeCreate(title="A", category=Category.plat))
        self.service.create_recipe(RecipeCreate(title="B", category=Category.dessert))
        result = self.service.search_recipes()
        assert result.total == 2
        assert len(result.items) == 2

    def test_search_by_title(self) -> None:
        from miam.domain.entities import Category

        self.service.create_recipe(
            RecipeCreate(title="Apple Pie", category=Category.dessert)
        )
        self.service.create_recipe(
            RecipeCreate(title="Beef Stew", category=Category.plat)
        )
        result = self.service.search_recipes(title="Apple")
        assert result.total == 1
        assert result.items[0].title == "Apple Pie"

    def test_search_with_pagination(self) -> None:
        from miam.domain.entities import Category

        for i in range(5):
            self.service.create_recipe(
                RecipeCreate(title=f"R{i}", category=Category.plat)
            )
        result = self.service.search_recipes(limit=2, offset=1)
        assert result.total == 5
        assert len(result.items) == 2


class TestRecipeManagementServiceUpdate:
    def setup_method(self) -> None:
        self.repo = StubRecipeRepository()
        self.storage = StubImageStorage()
        self.service = RecipeManagementService(self.repo, self.storage)

    def test_update_existing(self) -> None:
        from miam.domain.entities import Category

        created = self.service.create_recipe(
            RecipeCreate(title="Old", category=Category.plat)
        )
        update_data = RecipeUpdate(
            title="New", description="Updated desc", category=Category.dessert
        )
        updated = self.service.update_recipe(created.id, update_data)
        assert updated is not None
        assert updated.title == "New"
        assert updated.description == "Updated desc"

    def test_update_not_found(self) -> None:
        from miam.domain.entities import Category

        update_data = RecipeUpdate(title="X", description="Y", category=Category.plat)
        result = self.service.update_recipe(uuid4(), update_data)
        assert result is None


class TestRecipeManagementServiceDelete:
    def setup_method(self) -> None:
        self.repo = StubRecipeRepository()
        self.storage = StubImageStorage()
        self.service = RecipeManagementService(self.repo, self.storage)

    def test_delete_existing(self) -> None:
        from miam.domain.entities import Category

        created = self.service.create_recipe(
            RecipeCreate(title="ToDelete", category=Category.plat)
        )
        assert self.service.delete_recipe(created.id) is True
        assert self.service.get_recipe_by_id(created.id) is None

    def test_delete_not_found(self) -> None:
        assert self.service.delete_recipe(uuid4()) is False

    def test_delete_cleans_up_images(self) -> None:
        from miam.domain.entities import Category

        created = self.service.create_recipe(
            RecipeCreate(title="WithImages", category=Category.plat)
        )
        img_id = self.service.add_recipe_image(created.id, b"img1", "photo.jpg")
        assert self.service.delete_recipe(created.id) is True
        assert img_id in self.storage.delete_calls


class TestRecipeManagementServiceImages:
    def setup_method(self) -> None:
        self.repo = StubRecipeRepository()
        self.storage = StubImageStorage()
        self.service = RecipeManagementService(self.repo, self.storage)

    def test_add_image(self) -> None:
        from miam.domain.entities import Category

        created = self.service.create_recipe(
            RecipeCreate(title="WithImg", category=Category.plat)
        )
        img_id = self.service.add_recipe_image(created.id, b"jpeg-bytes", "pic.jpg")
        assert isinstance(img_id, UUID)
        assert img_id in self.storage.stored

    def test_get_image(self) -> None:
        from miam.domain.entities import Category

        created = self.service.create_recipe(
            RecipeCreate(title="WithImg", category=Category.plat)
        )
        img_id = self.service.add_recipe_image(created.id, b"data", "pic.jpg")
        response = self.service.get_recipe_image(img_id)
        assert response is not None
        assert response.content == b"data"
        assert response.media_type == "image/jpeg"

    def test_get_image_not_found(self) -> None:
        result = self.service.get_recipe_image(uuid4())
        assert result is None

    def test_delete_image(self) -> None:
        from miam.domain.entities import Category

        created = self.service.create_recipe(
            RecipeCreate(title="Img", category=Category.plat)
        )
        img_id = self.service.add_recipe_image(created.id, b"data", "pic.jpg")
        assert self.service.delete_recipe_image(img_id) is True
        assert self.service.get_recipe_image(img_id) is None


# ---------------------------------------------------------------------------
# Tests for RecipeExportService
# ---------------------------------------------------------------------------


class TestRecipeExportService:
    def setup_method(self) -> None:
        self.repo = StubRecipeRepository()
        self.word_exporter = StubWordExporter()
        self.md_exporter = StubMarkdownExporter()
        self.service = RecipeExportService(
            self.repo, self.word_exporter, self.md_exporter
        )

    def _seed_recipes(self, count: int = 2) -> None:
        from miam.domain.entities import Category

        mgmt = RecipeManagementService(self.repo, StubImageStorage())
        for i in range(count):
            mgmt.create_recipe(
                RecipeCreate(title=f"Recipe {i}", category=Category.plat)
            )

    def test_export_markdown(self) -> None:
        self._seed_recipes(3)
        result = self.service.export_recipes_to_markdown()
        assert result == b"zip-content"
        assert len(self.md_exporter.last_recipes) == 3

    def test_export_word(self) -> None:
        self._seed_recipes(2)
        result = self.service.export_recipes_to_word()
        assert result == b"word-content"
        assert len(self.word_exporter.last_recipes) == 2

    def test_export_empty(self) -> None:
        result = self.service.export_recipes_to_markdown()
        assert result == b"zip-content"
        assert self.md_exporter.last_recipes == []
