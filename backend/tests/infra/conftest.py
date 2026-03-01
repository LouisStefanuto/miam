"""Shared fixtures for infra layer tests."""

from collections.abc import Generator

import pytest
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import Session, sessionmaker

from miam.domain.entities import Category, Season
from miam.domain.schemas import (
    IngredientCreate,
    RecipeCreate,
    SourceCreate,
)
from miam.infra.db.base import Base
from miam.infra.repositories import RecipeRepository


@pytest.fixture(scope="session")
def db_engine() -> Generator:
    """Create an in-memory SQLite engine with all tables."""
    engine = create_engine("sqlite://", echo=False)

    # Enable foreign key enforcement on every connection
    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_conn, _connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture
def db_session(db_engine) -> Generator[Session]:
    """Provide a clean session per test — truncates all tables on teardown."""
    session_factory = sessionmaker(bind=db_engine)
    session = session_factory()
    yield session
    session.rollback()
    # Clean up in FK-safe order
    for table in [
        "recipe_ingredients",
        "images",
        "sources",
        "recipes",
        "ingredients",
    ]:
        session.execute(text(f"DELETE FROM {table}"))
    session.commit()
    session.close()


@pytest.fixture
def repository(db_session: Session) -> RecipeRepository:
    """Provide a RecipeRepository backed by the test session."""
    return RecipeRepository(db_session)


def make_recipe_create(
    *,
    title: str = "Test Recipe",
    description: str = "A test recipe",
    category: Category = Category.plat,
    season: Season | None = None,
    is_veggie: bool = False,
    tags: list[str] | None = None,
    preparation: list[str] | None = None,
    ingredients: list[IngredientCreate] | None = None,
    sources: list[SourceCreate] | None = None,
    prep_time_minutes: int | None = None,
    cook_time_minutes: int | None = None,
    rest_time_minutes: int | None = None,
    difficulty: int | None = None,
    number_of_people: int | None = None,
    rate: int | None = None,
    tested: bool = False,
) -> RecipeCreate:
    """Factory helper returning a RecipeCreate with sensible defaults."""
    return RecipeCreate(
        title=title,
        description=description,
        category=category,
        season=season,
        is_veggie=is_veggie,
        tags=tags or [],
        preparation=preparation or [],
        ingredients=ingredients or [],
        sources=sources or [],
        prep_time_minutes=prep_time_minutes,
        cook_time_minutes=cook_time_minutes,
        rest_time_minutes=rest_time_minutes,
        difficulty=difficulty,
        number_of_people=number_of_people,
        rate=rate,
        tested=tested,
    )
