from collections.abc import Generator

from fastapi import Depends
from sqlalchemy.orm import Session

from miam.domain.services import RecipeService
from miam.infra.db.session import SessionLocal
from miam.infra.repositories import RecipeRepository


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_recipe_service(db: Session = Depends(get_db)) -> RecipeService:
    repo = RecipeRepository(db)
    return RecipeService(repo)
