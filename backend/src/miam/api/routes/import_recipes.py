"""API routes for importing recipes from external sources."""

import base64
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from miam.api.deps import get_recipe_import_service
from miam.domain.schemas import InstagramResponse, RecipeCreate
from miam.domain.services import RecipeImportService

router = APIRouter(prefix="/import", tags=["import"])


class ParsedInstagramRecipe(BaseModel):
    """A parsed recipe with its image data, ready for user review."""

    recipe: RecipeCreate
    image_base64: str | None = None


class ParsedInstagramResponse(BaseModel):
    """Response from the Instagram parse endpoint."""

    recipes: list[ParsedInstagramRecipe]


@router.post("/instagram/parse")
def parse_instagram(
    payload: InstagramResponse,
    service: Annotated[RecipeImportService, Depends(get_recipe_import_service)],
) -> ParsedInstagramResponse:
    """Parse Instagram JSON into recipe data for user review.

    Returns parsed recipes with base64-encoded images.
    The frontend can display these for editing, then use
    POST /recipes/batch and POST /images to persist them.
    """
    parsed = service.parse_instagram(payload)

    return ParsedInstagramResponse(
        recipes=[
            ParsedInstagramRecipe(
                recipe=item.recipe,
                image_base64=base64.b64encode(item.image).decode()
                if item.image
                else None,
            )
            for item in parsed
        ]
    )
