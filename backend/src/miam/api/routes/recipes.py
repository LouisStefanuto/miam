"""API routes for managing recipes (CRUD operations)."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from pydantic import BaseModel

from miam.api.deps import get_recipe_management_service
from miam.domain.schemas import RecipeCreate
from miam.domain.services import RecipeManagementService

router = APIRouter(prefix="/recipes", tags=["recipes"])


class RecipeResponse(BaseModel):
    id: UUID


@router.post("", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
def create_recipe(
    recipe_in: RecipeCreate,
    service: RecipeManagementService = Depends(get_recipe_management_service),
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
    ingredients: list[IngredientResponse]
    images: list[ImageResponse]
    sources: list[SourceResponse]

    model_config = {"from_attributes": True}


@router.get("/search", response_model=list[RecipeDetailResponse])
def search_recipes(
    recipe_id: Optional[UUID] = Query(None),
    title: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    is_veggie: Optional[bool] = Query(None),
    season: Optional[str] = Query(None),
    service: RecipeManagementService = Depends(get_recipe_management_service),
) -> list[RecipeDetailResponse]:
    """
    Search recipes with optional filters.
    """
    recipes = service.search_recipes(
        recipe_id=recipe_id,
        title=title,
        category=category,
        is_veggie=is_veggie,
        season=season,
    )
    if not recipes:
        raise HTTPException(status_code=404, detail="No recipes found")

    return [RecipeDetailResponse.model_validate(r) for r in recipes]


@router.get("/{recipe_id}", response_model=RecipeDetailResponse)
def get_recipe(
    recipe_id: UUID = Path(..., description="The ID of the recipe to retrieve"),
    service: RecipeManagementService = Depends(get_recipe_management_service),
) -> RecipeDetailResponse:
    recipe = service.get_recipe_by_id(recipe_id)
    if not recipe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with id {recipe_id} not found",
        )

    return RecipeDetailResponse.model_validate(recipe)


@router.get("", response_model=list[RecipeDetailResponse])
def get_recipes(
    service: RecipeManagementService = Depends(get_recipe_management_service),
) -> list[RecipeDetailResponse]:
    """
    Retrieve all recipes.
    """
    recipes = service.search_recipes()
    if not recipes:
        raise HTTPException(status_code=404, detail="No recipes found")
    return [RecipeDetailResponse.model_validate(r) for r in recipes]
