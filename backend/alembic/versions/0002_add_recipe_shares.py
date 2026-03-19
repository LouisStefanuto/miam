"""add recipe shares

Revision ID: 0002
Revises: 0001
Create Date: 2026-03-15

"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002"
down_revision: Union[str, Sequence[str]] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add recipe_shares table for recipe sharing between users."""
    sharerole = sa.Enum("editor", "reader", name="sharerole")
    sharestatus = sa.Enum("pending", "accepted", "rejected", name="sharestatus")

    op.create_table(
        "recipe_shares",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("recipe_id", sa.Uuid(), nullable=False),
        sa.Column("shared_by_user_id", sa.Uuid(), nullable=False),
        sa.Column("shared_with_user_id", sa.Uuid(), nullable=False),
        sa.Column("role", sharerole, nullable=False),
        sa.Column(
            "status",
            sharestatus,
            nullable=False,
            server_default="pending",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.ForeignKeyConstraint(
            ["recipe_id"],
            ["recipes.id"],
            name=op.f("fk_recipe_shares_recipe_id_recipes"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["shared_by_user_id"],
            ["users.id"],
            name=op.f("fk_recipe_shares_shared_by_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["shared_with_user_id"],
            ["users.id"],
            name=op.f("fk_recipe_shares_shared_with_user_id_users"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_recipe_shares")),
        sa.UniqueConstraint(
            "recipe_id",
            "shared_with_user_id",
            name=op.f("uq_recipe_shares_recipe_id"),
        ),
    )
    op.create_index(
        op.f("ix_recipe_shares_shared_with_user_id"),
        "recipe_shares",
        ["shared_with_user_id"],
    )
    op.create_index(
        op.f("ix_recipe_shares_recipe_id"),
        "recipe_shares",
        ["recipe_id"],
    )


def downgrade() -> None:
    """Remove recipe_shares table."""
    op.drop_index(op.f("ix_recipe_shares_recipe_id"), table_name="recipe_shares")
    op.drop_index(
        op.f("ix_recipe_shares_shared_with_user_id"), table_name="recipe_shares"
    )
    op.drop_table("recipe_shares")
    op.execute("DROP TYPE IF EXISTS sharerole")
    op.execute("DROP TYPE IF EXISTS sharestatus")
