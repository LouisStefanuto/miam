from collections.abc import Generator

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from miam.domain.repositories import RecipeRepository
from miam.domain.schemas import RecipeCreate
from miam.domain.services import RecipeService
from miam.infra.db.session import SessionLocal

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


@router.post("", status_code=status.HTTP_201_CREATED)
def create_recipe(
    recipe_in: RecipeCreate,
    service: RecipeService = Depends(get_recipe_service),
):
    """
    Create a new recipe.
    """
    try:
        recipe = service.create_recipe(recipe_in)
        return {"id": recipe.id}
    except ValueError as exc:
        # Example: business rule violation
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
