from collections.abc import Generator
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from miam.domain.schemas import RecipeCreate
from miam.domain.services import RecipeService
from miam.infra.db.session import SessionLocal
from miam.infra.repositories import RecipeRepository

router = APIRouter(
    prefix="/recipes",
    tags=["recipes"],
)


# ---- Dependencies ----


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_recipe_service(db: Session = Depends(get_db)) -> RecipeService:
    repo = RecipeRepository(db)
    return RecipeService(repo)


# ---- Routes ----


class RecipeResponse(BaseModel):
    id: UUID


@router.post("", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
def create_recipe(
    recipe_in: RecipeCreate,
    service: RecipeService = Depends(get_recipe_service),
) -> RecipeResponse:
    """
    Create a new recipe.
    """
    try:
        recipe = service.create_recipe(recipe_in)
        return RecipeResponse(id=recipe.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
