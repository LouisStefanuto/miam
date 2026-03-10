"""Shared fixtures for API route tests."""

from collections.abc import Generator
from datetime import UTC, datetime
from typing import Any
from unittest.mock import MagicMock, create_autospec
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient

from miam.api.deps import (
    get_current_user_id,
    get_recipe_export_service,
    get_recipe_management_service,
)
from miam.api.main import app
from miam.domain.entities import (
    ImageEntity,
    IngredientEntity,
    PaginatedResult,
    RecipeEntity,
    SourceEntity,
)
from miam.domain.services import RecipeExportService, RecipeManagementService

TEST_USER_ID = UUID("00000000-0000-0000-0000-000000000001")


@pytest.fixture
def mock_recipe_service() -> MagicMock:
    mock: MagicMock = create_autospec(RecipeManagementService, instance=True)
    return mock


@pytest.fixture
def mock_export_service() -> MagicMock:
    mock: MagicMock = create_autospec(RecipeExportService, instance=True)
    return mock


@pytest.fixture
def client(
    mock_recipe_service: MagicMock,
    mock_export_service: MagicMock,
) -> Generator[TestClient]:
    app.dependency_overrides[get_recipe_management_service] = lambda: (
        mock_recipe_service
    )
    app.dependency_overrides[get_recipe_export_service] = lambda: mock_export_service
    app.dependency_overrides[get_current_user_id] = lambda: TEST_USER_ID
    yield TestClient(app)
    app.dependency_overrides.clear()


def make_recipe(
    *,
    recipe_id: UUID | None = None,
    title: str = "Test Recipe",
    description: str = "A test recipe",
    category: str = "plat",
    owner_id: UUID = TEST_USER_ID,
    ingredients: list[IngredientEntity] | None = None,
    images: list[ImageEntity] | None = None,
    sources: list[SourceEntity] | None = None,
    **kwargs: Any,
) -> RecipeEntity:
    return RecipeEntity(
        id=recipe_id or uuid4(),
        title=title,
        description=description,
        category=category,
        owner_id=owner_id,
        ingredients=ingredients or [],
        images=images or [],
        sources=sources or [],
        created_at=datetime.now(tz=UTC),
        **kwargs,
    )


def make_paginated_result(
    recipes: list[RecipeEntity] | None = None,
    total: int | None = None,
) -> PaginatedResult:
    items = recipes or []
    return PaginatedResult(
        items=items, total=total if total is not None else len(items)
    )
