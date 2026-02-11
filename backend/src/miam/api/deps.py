from collections.abc import Generator

from fastapi import Depends
from sqlalchemy.orm import Session

from miam.domain.services import RecipeService
from miam.infra.db.session import SessionLocal
from miam.infra.exporter_markdown import MarkdownExporter
from miam.infra.exporter_word import WordExporter
from miam.infra.repositories import RecipeRepository


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_recipe_service(db: Session = Depends(get_db)) -> RecipeService:
    repo = RecipeRepository(db)
    word_exporter = WordExporter()
    markdown_exporter = MarkdownExporter()
    return RecipeService(repo, word_exporter, markdown_exporter)
