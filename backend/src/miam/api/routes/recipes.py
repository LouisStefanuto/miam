"""API routes for managing recipes (CRUD operations)."""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from pydantic import BaseModel

from miam.api.deps import get_recipe_management_service
from miam.domain.entities import RecipeEntity
from miam.domain.schemas import BatchRecipeCreate, RecipeCreate, RecipeUpdate
from miam.domain.services import RecipeManagementService

router = APIRouter(prefix="/recipes", tags=["recipes"])


class RecipeResponse(BaseModel):
    id: UUID


class BatchRecipeResponse(BaseModel):
    ids: list[UUID]


@router.post(
    "/batch", response_model=BatchRecipeResponse, status_code=status.HTTP_201_CREATED
)
def create_recipes(
    batch_in: BatchRecipeCreate,
    service: RecipeManagementService = Depends(get_recipe_management_service),
) -> BatchRecipeResponse:
    """Create multiple recipes in a single atomic operation."""
    try:
        recipes = service.create_recipes(batch_in.recipes)
        return BatchRecipeResponse(ids=[r.id for r in recipes])
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.post("", response_model=RecipeResponse, status_code=status.HTTP_201_CREATED)
def create_recipe(
    recipe_in: RecipeCreate,
    service: RecipeManagementService = Depends(get_recipe_management_service),
) -> RecipeResponse:
    """Create a new recipe."""
    try:
        recipe = service.create_recipe(recipe_in)
        return RecipeResponse(id=recipe.id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


class IngredientResponse(BaseModel):
    name: str
    quantity: float | None = None
    unit: str | None = None
    display_order: int = 0


class ImageDetailResponse(BaseModel):
    id: UUID
    caption: str | None = None
    display_order: int = 0


class SourceResponse(BaseModel):
    type: str
    raw_content: str


class RecipeDetailResponse(BaseModel):
    id: UUID
    title: str
    description: str
    prep_time_minutes: int | None = None
    cook_time_minutes: int | None = None
    rest_time_minutes: int | None = None
    season: str | None = None
    category: str
    is_veggie: bool
    difficulty: int | None = None
    number_of_people: int | None = None
    rate: int | None = None
    tested: bool
    tags: list[str]
    preparation: list[str]
    ingredients: list[IngredientResponse]
    images: list[ImageDetailResponse]
    sources: list[SourceResponse]
    created_at: datetime | None = None


class PaginatedRecipeResponse(BaseModel):
    items: list[RecipeDetailResponse]
    total: int
    limit: int | None = None
    offset: int = 0


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
                display_order=ing.display_order,
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
        created_at=recipe.created_at,
    )


@router.get("/search", response_model=PaginatedRecipeResponse)
def search_recipes(
    recipe_id: UUID | None = Query(None),
    title: str | None = Query(None),
    category: str | None = Query(None),
    is_veggie: bool | None = Query(None),
    season: str | None = Query(None),
    limit: int | None = Query(None, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: RecipeManagementService = Depends(get_recipe_management_service),
) -> PaginatedRecipeResponse:
    """Search recipes with optional filters and pagination."""
    result = service.search_recipes(
        recipe_id=recipe_id,
        title=title,
        category=category,
        is_veggie=is_veggie,
        season=season,
        limit=limit,
        offset=offset,
    )
    return PaginatedRecipeResponse(
        items=[map_recipe_to_response(r) for r in result.items],
        total=result.total,
        limit=limit,
        offset=offset,
    )


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


@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recipe(
    recipe_id: UUID = Path(..., description="The ID of the recipe to delete"),
    service: RecipeManagementService = Depends(get_recipe_management_service),
) -> None:
    """Delete a recipe by ID."""
    deleted = service.delete_recipe(recipe_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with id {recipe_id} not found",
        )


@router.put("/{recipe_id}", response_model=RecipeDetailResponse)
def update_recipe(
    recipe_in: RecipeUpdate,
    recipe_id: UUID = Path(..., description="The ID of the recipe to replace"),
    service: RecipeManagementService = Depends(get_recipe_management_service),
) -> RecipeDetailResponse:
    try:
        recipe = service.update_recipe(recipe_id, recipe_in)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    if recipe is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recipe with id {recipe_id} not found",
        )
    return map_recipe_to_response(recipe)


@router.get("", response_model=PaginatedRecipeResponse)
def get_recipes(
    limit: int | None = Query(None, ge=1, le=100),
    offset: int = Query(0, ge=0),
    service: RecipeManagementService = Depends(get_recipe_management_service),
) -> PaginatedRecipeResponse:
    """Retrieve recipes with optional pagination."""
    result = service.search_recipes(limit=limit, offset=offset)
    return PaginatedRecipeResponse(
        items=[map_recipe_to_response(r) for r in result.items],
        total=result.total,
        limit=limit,
        offset=offset,
    )
