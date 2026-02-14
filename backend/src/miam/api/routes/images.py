"""API routes for managing images."""

from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from pydantic import BaseModel

from miam.api.deps import get_recipe_management_service
from miam.domain.services import RecipeManagementService

router = APIRouter(prefix="/images", tags=["images"])


class ImageUploadResponse(BaseModel):
    title: str
    recipe: UUID
    image_id: UUID


@router.post("", response_model=ImageUploadResponse, status_code=201)
async def upload_image(
    recipe_id: UUID = Form(...),
    image: UploadFile = File(...),
    service: RecipeManagementService = Depends(get_recipe_management_service),
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
    image_id = service.add_recipe_image(
        recipe_id=recipe_id,
        image=content,
        filename=image.filename,
    )

    return ImageUploadResponse(
        title=image.filename or "untitled", recipe=recipe_id, image_id=image_id
    )


@router.get("{image_id}")
async def get_image(image_id: str) -> Response:
    # Placeholder for image retrieval logic
    return Response(
        content=f"Image data for {image_id}", media_type="application/octet-stream"
    )
