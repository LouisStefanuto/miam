"""Dependency injection for FastAPI routes."""

from collections.abc import Generator
from uuid import UUID

from fastapi import Depends
from sqlalchemy.orm import Session

from miam.domain.entities import AuthProvider
from miam.domain.services import RecipeExportService, RecipeManagementService
from miam.infra.db.base import User
from miam.infra.db.session import SessionLocal
from miam.infra.exporter_markdown import MarkdownExporter
from miam.infra.exporter_word import WordExporter
from miam.infra.image_storage import LocalImageStorage
from miam.infra.repositories import RecipeRepository

# Temporary hardcoded admin user — will be replaced by JWT auth (PR2).
SYSTEM_USER_ID = UUID("00000000-0000-0000-0000-000000000000")


def get_db() -> Generator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user_id(
    db: Session = Depends(get_db),  # noqa: B008
) -> UUID:
    """Return the current user ID.

    Temporary: lazily creates a hardcoded system user.
    Will be replaced by real JWT-based auth in PR2.
    """
    user = db.get(User, SYSTEM_USER_ID)
    if user is None:
        user = User(
            id=SYSTEM_USER_ID,
            email="system@miam.local",
            display_name="System",
            auth_provider=AuthProvider.google,
            auth_provider_id="system",
        )
        db.add(user)
        db.commit()
    return SYSTEM_USER_ID


def get_recipe_management_service(
    db: Session = Depends(get_db),  # noqa: B008
) -> RecipeManagementService:
    repo = RecipeRepository(db)
    image_storage = LocalImageStorage("images")
    return RecipeManagementService(repo, image_storage)


def get_recipe_export_service(
    db: Session = Depends(get_db),  # noqa: B008
) -> RecipeExportService:
    repo = RecipeRepository(db)
    image_storage = LocalImageStorage("images")
    word_exporter = WordExporter(image_storage=image_storage)
    markdown_exporter = MarkdownExporter(image_storage=image_storage)
    return RecipeExportService(repo, word_exporter, markdown_exporter)
