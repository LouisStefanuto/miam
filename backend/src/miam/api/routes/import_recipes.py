"""API routes for importing recipes from external sources."""

import json
import re
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, ValidationError

from miam.api.deps import get_current_user_id, get_recipe_import_service
from miam.domain.schemas import InstagramResponse, ParsedRecipe
from miam.domain.services import RecipeImportService

router = APIRouter(prefix="/import", tags=["import"])


class ParsedInstagramResponse(BaseModel):
    """Response from the Instagram parse endpoint."""

    recipes: list[ParsedRecipe]


def _fix_newlines_in_json_strings(text: str) -> str:
    r"""Escape raw newlines that appear inside JSON string values.

    Instagram captions can contain unescaped newlines which break JSON parsing.
    This replaces literal newlines inside quoted strings with \n.
    """
    return re.sub(
        r'"(?:[^"\\]|\\.)*"',
        lambda m: m.group(0).replace("\n", "\\n").replace("\r", "\\r"),
        text,
        flags=re.DOTALL,
    )


@router.post("/instagram/parse")
async def parse_instagram(
    request: Request,
    _user_id: Annotated[UUID, Depends(get_current_user_id)],
    service: Annotated[RecipeImportService, Depends(get_recipe_import_service)],
) -> ParsedInstagramResponse:
    """Parse Instagram JSON into recipe data for user review.

    Returns parsed recipes with image URLs for the frontend to fetch directly.
    The frontend can display these for editing, then use
    POST /recipes/batch and POST /images to persist them.
    """
    raw = await request.body()
    text = raw.decode()

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        try:
            data = json.loads(_fix_newlines_in_json_strings(text))
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid JSON",
            ) from exc

    try:
        payload = InstagramResponse.model_validate(data)
    except ValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=exc.errors(),
        ) from exc

    parsed = service.parse_instagram(payload, _user_id)
    return ParsedInstagramResponse(recipes=parsed)
