from collections.abc import Generator
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Path, status
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


class IngredientResponse(BaseModel):
    name: str
    quantity: Optional[float]
    unit: Optional[str]

    model_config = {"from_attributes": True}


class ImageResponse(BaseModel):
    storage_path: str
    caption: Optional[str]
    display_order: int

    model_config = {"from_attributes": True}


class SourceResponse(BaseModel):
    type: str
    raw_content: str

    model_config = {"from_attributes": True}


class RecipeDetailResponse(BaseModel):
    id: UUID
    title: str
    description: str
    prep_time_minutes: Optional[int]
    cook_time_minutes: Optional[int]
    rest_time_minutes: Optional[int]
    season: Optional[str]
    category: str
    is_veggie: bool
    ingredients: List[IngredientResponse]
    images: List[ImageResponse]
    sources: List[SourceResponse]

    model_config = {"from_attributes": True}


@router.get("/{recipe_id}", response_model=RecipeDetailResponse)
def get_recipe(
    recipe_id: UUID = Path(..., description="The ID of the recipe to retrieve"),
    service: RecipeService = Depends(get_recipe_service),
) -> RecipeDetailResponse:
    recipe = service.get_recipe_by_id(recipe_id)
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with id {recipe_id} not found",
        )

    # Pydantic will automatically convert nested relationships
    # thanks to orm_mode=True
    return RecipeDetailResponse.model_validate(recipe)
