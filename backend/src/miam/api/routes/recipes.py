"""API routes for managing recipes (CRUD operations)."""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from pydantic import BaseModel

from miam.api.deps import get_recipe_management_service
from miam.domain.entities import RecipeEntity
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
    quantity: Optional[float] = None
    unit: Optional[str] = None


class ImageDetailResponse(BaseModel):
    id: UUID
    caption: Optional[str] = None
    display_order: int = 0


class SourceResponse(BaseModel):
    type: str
    raw_content: str


class RecipeDetailResponse(BaseModel):
    id: UUID
    title: str
    description: str
    prep_time_minutes: Optional[int] = None
    cook_time_minutes: Optional[int] = None
    rest_time_minutes: Optional[int] = None
    season: Optional[str] = None
    category: str
    is_veggie: bool
    difficulty: Optional[int] = None
    number_of_people: Optional[int] = None
    rate: Optional[int] = None
    tested: bool
    tags: list[str]
    preparation: list[str]
    ingredients: list[IngredientResponse]
    images: list[ImageDetailResponse]
    sources: list[SourceResponse]


def map_recipe_to_response(recipe: RecipeEntity) -> RecipeDetailResponse:
    return RecipeDetailResponse(
        id=recipe.id,
        title=recipe.title,
        description=recipe.description,
        prep_time_minutes=recipe.prep_time_minutes,
        cook_time_minutes=recipe.cook_time_minutes,
        rest_time_minutes=recipe.rest_time_minutes,
        season=recipe.season,
        category=recipe.category,
        is_veggie=recipe.is_veggie,
        difficulty=recipe.difficulty,
        number_of_people=recipe.number_of_people,
        rate=recipe.rate,
        tested=recipe.tested,
        tags=recipe.tags,
        preparation=recipe.preparation,
        ingredients=[
            IngredientResponse(
                name=ing.name,
                quantity=ing.quantity,
                unit=ing.unit,
            )
            for ing in recipe.ingredients
        ],
        images=[
            ImageDetailResponse(
                id=img.id,
                caption=img.caption,
                display_order=img.display_order,
            )
            for img in recipe.images
        ],
        sources=[
            SourceResponse(
                type=src.type,
                raw_content=src.raw_content,
            )
            for src in recipe.sources
        ],
    )


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
    return [map_recipe_to_response(r) for r in recipes]


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

    return map_recipe_to_response(recipe)


@router.get("", response_model=list[RecipeDetailResponse])
def get_recipes(
    service: RecipeManagementService = Depends(get_recipe_management_service),
) -> list[RecipeDetailResponse]:
    """
    Retrieve all recipes.
    """
    recipes = service.search_recipes()
    return [map_recipe_to_response(r) for r in recipes]
