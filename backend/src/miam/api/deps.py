"""Dependency injection for FastAPI routes."""

from collections.abc import Generator

from fastapi import Depends
from sqlalchemy.orm import Session

from miam.domain.services import RecipeExportService, RecipeManagementService
from miam.infra.db.session import SessionLocal
from miam.infra.exporter_markdown import MarkdownExporter
from miam.infra.exporter_word import WordExporter
from miam.infra.image_storage import LocalImageStorage
from miam.infra.repositories import RecipeRepository


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_recipe_management_service(
    db: Session = Depends(get_db),
) -> RecipeManagementService:
    repo = RecipeRepository(db)
    image_storage = LocalImageStorage("images")
    return RecipeManagementService(repo, image_storage)


def get_recipe_export_service(
    db: Session = Depends(get_db),
) -> RecipeExportService:
    repo = RecipeRepository(db)
    word_exporter = WordExporter()
    markdown_exporter = MarkdownExporter()
    return RecipeExportService(repo, word_exporter, markdown_exporter)
