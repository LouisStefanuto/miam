"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-02-19

"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSON

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "ingredients",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_ingredients")),
        sa.UniqueConstraint("name", name=op.f("uq_ingredients_name")),
    )
    op.create_table(
        "recipes",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("prep_time_minutes", sa.Integer(), nullable=True),
        sa.Column("cook_time_minutes", sa.Integer(), nullable=True),
        sa.Column("rest_time_minutes", sa.Integer(), nullable=True),
        sa.Column(
            "season",
            sa.Enum("winter", "spring", "summer", "autumn", name="season"),
            nullable=True,
        ),
        sa.Column(
            "category",
            sa.Enum(
                "apero",
                "entree",
                "plat",
                "dessert",
                "boisson",
                "gouter",
                "pates",
                name="category",
            ),
            nullable=False,
        ),
        sa.Column("is_veggie", sa.Boolean(), nullable=False),
        sa.Column("difficulty", sa.Integer(), nullable=True),
        sa.Column("number_of_people", sa.Integer(), nullable=True),
        sa.Column("rate", sa.Integer(), nullable=True),
        sa.Column("tested", sa.Boolean(), nullable=False),
        sa.Column("tags", JSON(), nullable=True),
        sa.Column("preparation", JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_recipes")),
    )
    op.create_index(op.f("ix_recipes_category"), "recipes", ["category"])
    op.create_index(op.f("ix_recipes_season"), "recipes", ["season"])
    op.create_index(op.f("ix_recipes_is_veggie"), "recipes", ["is_veggie"])
    op.create_table(
        "images",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("recipe_id", sa.Uuid(), nullable=False),
        sa.Column("caption", sa.String(length=200), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["recipe_id"],
            ["recipes.id"],
            name=op.f("fk_images_recipe_id_recipes"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_images")),
    )
    op.create_index(op.f("ix_images_recipe_id"), "images", ["recipe_id"])
    op.create_table(
        "recipe_ingredients",
        sa.Column("recipe_id", sa.Uuid(), nullable=False),
        sa.Column("ingredient_id", sa.Uuid(), nullable=False),
        sa.Column("quantity", sa.Float(), nullable=True),
        sa.Column("unit", sa.String(length=50), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(
            ["ingredient_id"],
            ["ingredients.id"],
            name=op.f("fk_recipe_ingredients_ingredient_id_ingredients"),
        ),
        sa.ForeignKeyConstraint(
            ["recipe_id"],
            ["recipes.id"],
            name=op.f("fk_recipe_ingredients_recipe_id_recipes"),
        ),
        sa.PrimaryKeyConstraint(
            "recipe_id", "ingredient_id", name=op.f("pk_recipe_ingredients")
        ),
    )
    op.create_index(
        op.f("ix_recipe_ingredients_ingredient_id"),
        "recipe_ingredients",
        ["ingredient_id"],
    )
    op.create_table(
        "sources",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column(
            "type",
            sa.Enum("manual", "instagram", "url", "photo", name="sourcetype"),
            nullable=False,
        ),
        sa.Column("raw_content", sa.Text(), nullable=False),
        sa.Column("recipe_id", sa.Uuid(), nullable=True),
        sa.ForeignKeyConstraint(
            ["recipe_id"],
            ["recipes.id"],
            name=op.f("fk_sources_recipe_id_recipes"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_sources")),
    )
    op.create_index(op.f("ix_sources_recipe_id"), "sources", ["recipe_id"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_sources_recipe_id"), table_name="sources")
    op.drop_table("sources")
    op.drop_index(
        op.f("ix_recipe_ingredients_ingredient_id"), table_name="recipe_ingredients"
    )
    op.drop_table("recipe_ingredients")
    op.drop_index(op.f("ix_images_recipe_id"), table_name="images")
    op.drop_table("images")
    op.drop_index(op.f("ix_recipes_is_veggie"), table_name="recipes")
    op.drop_index(op.f("ix_recipes_season"), table_name="recipes")
    op.drop_index(op.f("ix_recipes_category"), table_name="recipes")
    op.drop_table("recipes")
    op.drop_table("ingredients")
