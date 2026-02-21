"""Database schema models using SQLAlchemy ORM.

Defines all tables, relationships, and enums for the recipe management system.
"""

import uuid

from sqlalchemy import (
    Boolean,
    Enum,
    Float,
    ForeignKey,
    Integer,
    MetaData,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

from miam.domain.entities import (
    Category,
    Season,
    SourceType,
)

# Naming convention helps Alembic migrations
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

metadata = MetaData(naming_convention=convention)


class Base(DeclarativeBase):
    metadata = metadata


class Image(Base):
    """Stores recipe images with metadata."""

    __tablename__ = "images"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    recipe_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("recipes.id", ondelete="CASCADE")
    )

    caption: Mapped[str | None] = mapped_column(String(200))
    display_order: Mapped[int] = mapped_column(Integer, default=0)

    recipe = relationship("Recipe", back_populates="images")


class Ingredient(Base):
    """Stores ingredient names."""

    __tablename__ = "ingredients"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)

    recipes = relationship(
        "RecipeIngredient",
        back_populates="ingredient",
        cascade="all, delete-orphan",
    )


class RecipeIngredient(Base):
    """Junction table linking recipes to ingredients with quantities."""

    __tablename__ = "recipe_ingredients"

    recipe_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("recipes.id"),
        primary_key=True,
    )
    ingredient_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("ingredients.id"),
        primary_key=True,
    )

    quantity: Mapped[float | None] = mapped_column(Float)
    unit: Mapped[str | None] = mapped_column(String(50))

    recipe = relationship("Recipe", back_populates="ingredients")
    ingredient = relationship("Ingredient", back_populates="recipes")


class Recipe(Base):
    """Stores recipe data with timing, ingredients, images, and sources."""

    __tablename__ = "recipes"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    prep_time_minutes: Mapped[int | None] = mapped_column(Integer)
    cook_time_minutes: Mapped[int | None] = mapped_column(Integer)
    rest_time_minutes: Mapped[int | None] = mapped_column(Integer)

    season: Mapped[Season | None] = mapped_column(Enum(Season, name="season"))
    category: Mapped[Category] = mapped_column(
        Enum(Category, name="category"), nullable=False
    )

    is_veggie: Mapped[bool] = mapped_column(Boolean, default=False)
    difficulty: Mapped[int | None] = mapped_column(Integer)
    number_of_people: Mapped[int | None] = mapped_column(Integer)
    rate: Mapped[int | None] = mapped_column(Integer)
    tested: Mapped[bool] = mapped_column(Boolean, default=False)
    tags: Mapped[list[str] | None] = mapped_column(JSON, default=list)
    preparation: Mapped[list[str] | None] = mapped_column(JSON, default=list)

    ingredients = relationship(
        "RecipeIngredient",
        back_populates="recipe",
        cascade="all, delete-orphan",
    )

    images = relationship(
        "Image",
        back_populates="recipe",
        cascade="all, delete-orphan",
    )

    sources = relationship(
        "Source",
        back_populates="recipe",
    )


class Source(Base):
    """Stores recipe source information and references."""

    __tablename__ = "sources"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)

    type: Mapped[SourceType] = mapped_column(
        Enum(SourceType, name="sourcetype"), nullable=False
    )
    raw_content: Mapped[str] = mapped_column(Text, nullable=False)

    recipe_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("recipes.id", ondelete="SET NULL")
    )

    recipe = relationship("Recipe", back_populates="sources")
