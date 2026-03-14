"""API routes for managing images."""

import logging
from typing import Annotated
from urllib.parse import urlparse
from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from pydantic import BaseModel

from miam.api.deps import get_current_user_id, get_recipe_management_service
from miam.domain.services import RecipeManagementService

logger = logging.getLogger(__name__)

# Instagram CDN domains allowed for image download (SSRF protection)
_ALLOWED_HOSTS = {
    "scontent.cdninstagram.com",
    "instagram.com",
}

# Suffix patterns for Instagram/Facebook CDN hostnames
_ALLOWED_SUFFIXES = (
    ".cdninstagram.com",
    ".instagram.com",
    ".fbcdn.net",
)


def _is_allowed_image_url(url: str) -> bool:
    """Validate that a URL is safe to fetch (anti-SSRF)."""
    parsed = urlparse(url)
    if parsed.scheme != "https":
        return False
    hostname = parsed.hostname or ""

    # Allow known Instagram/Facebook CDN patterns
    if hostname.endswith(_ALLOWED_SUFFIXES):
        return True
    if hostname in _ALLOWED_HOSTS:
        return True

    # Block everything else — we only download Instagram images
    return False


router = APIRouter(prefix="/images", tags=["images"])


class ImageUploadResponse(BaseModel):
    title: str
    recipe: UUID
    image_id: UUID


@router.post("", status_code=201)
async def upload_image(
    recipe_id: Annotated[UUID, Form()],
    image: Annotated[UploadFile, File()],
    service: Annotated[RecipeManagementService, Depends(get_recipe_management_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> ImageUploadResponse:
    if not image.filename:
        raise HTTPException(
            status_code=400, detail="Uploaded image must have an original filename"
        )

    # Validate file size (max 5 MB)
    content = await image.read()
    max_size = 5 * 1024 * 1024  # 5 MB in bytes
    if len(content) > max_size:
        raise HTTPException(status_code=413, detail="Image too large (max 5 MB)")

    # Save image via service
    try:
        image_id = service.add_recipe_image(
            recipe_id=recipe_id,
            user_id=user_id,
            content=content,
            filename=image.filename,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from None

    return ImageUploadResponse(
        title=image.filename or "untitled", recipe=recipe_id, image_id=image_id
    )


class ImageFromUrlRequest(BaseModel):
    recipe_id: UUID
    url: str


@router.post("/from-url", status_code=201)
async def upload_image_from_url(
    body: ImageFromUrlRequest,
    service: Annotated[RecipeManagementService, Depends(get_recipe_management_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> ImageUploadResponse:
    """Download an image from a URL and attach it to a recipe."""
    if not _is_allowed_image_url(body.url):
        raise HTTPException(
            status_code=400,
            detail="Only Instagram CDN URLs (*.cdninstagram.com) are allowed",
        )

    max_size = 5 * 1024 * 1024
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(body.url)
            resp.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=400, detail=f"Failed to download image: {exc}"
        ) from exc

    content = resp.content
    if len(content) > max_size:
        raise HTTPException(status_code=413, detail="Image too large (max 5 MB)")

    content_type = resp.headers.get("content-type", "")
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="URL did not return an image")

    ext = content_type.split("/")[-1].split(";")[0].strip()
    filename = f"instagram.{ext}" if ext else "instagram.jpg"

    try:
        image_id = service.add_recipe_image(
            recipe_id=body.recipe_id,
            user_id=user_id,
            content=content,
            filename=filename,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from None

    return ImageUploadResponse(title=filename, recipe=body.recipe_id, image_id=image_id)


@router.delete("/{image_id}", status_code=204)
async def delete_image(
    image_id: UUID,
    service: Annotated[RecipeManagementService, Depends(get_recipe_management_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> None:
    deleted = service.delete_recipe_image(image_id, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Image not found")


@router.get("/{image_id}")
async def get_image(
    image_id: UUID,
    service: Annotated[RecipeManagementService, Depends(get_recipe_management_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> Response:
    image_response = service.get_recipe_image(image_id, user_id)
    if not image_response:
        raise HTTPException(status_code=404, detail="Image not found")

    return Response(
        content=image_response.content,
        media_type=image_response.media_type,
        headers={
            "Content-Security-Policy": "script-src 'none'",
            "X-Content-Type-Options": "nosniff",
        },
    )
