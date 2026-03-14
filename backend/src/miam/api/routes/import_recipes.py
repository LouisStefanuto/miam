"""API routes for importing recipes from external sources."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from miam.api.deps import get_current_user_id, get_recipe_import_service
from miam.domain.schemas import InstagramResponse, ParsedRecipe
from miam.domain.services import RecipeImportService

router = APIRouter(prefix="/import", tags=["import"])


class ParsedInstagramResponse(BaseModel):
    """Response from the Instagram parse endpoint."""

    recipes: list[ParsedRecipe]


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
    return ParsedInstagramResponse(recipes=parsed)
