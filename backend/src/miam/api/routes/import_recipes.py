"""API routes for importing recipes from external sources."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from miam.api.deps import get_current_user_id, get_recipe_import_service
from miam.domain.schemas import InstagramResponse, RecipeCreate
from miam.domain.services import RecipeImportService

router = APIRouter(prefix="/import", tags=["import"])


class ParsedInstagramRecipe(BaseModel):
    """A parsed recipe with its image URL, ready for user review."""

    recipe: RecipeCreate
    image_url: str | None = None


class ParsedInstagramResponse(BaseModel):
    """Response from the Instagram parse endpoint."""

    recipes: list[ParsedInstagramRecipe]


@router.post("/instagram/parse")
def parse_instagram(
    payload: InstagramResponse,
    _user_id: Annotated[UUID, Depends(get_current_user_id)],
    service: Annotated[RecipeImportService, Depends(get_recipe_import_service)],
) -> ParsedInstagramResponse:
    """Parse Instagram JSON into recipe data for user review.

    Returns parsed recipes with image URLs for the frontend to fetch directly.
    The frontend can display these for editing, then use
    POST /recipes/batch and POST /images to persist them.
    """
    parsed = service.parse_instagram(payload)

    return ParsedInstagramResponse(
        recipes=[
            ParsedInstagramRecipe(
                recipe=item.recipe,
                image_url=item.image_url,
            )
            for item in parsed
        ]
    )
