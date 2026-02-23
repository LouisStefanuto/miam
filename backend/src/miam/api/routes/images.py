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
        content=content,
        filename=image.filename,
    )

    return ImageUploadResponse(
        title=image.filename or "untitled", recipe=recipe_id, image_id=image_id
    )


@router.delete("/{image_id}", status_code=204)
async def delete_image(
    image_id: UUID,
    service: RecipeManagementService = Depends(get_recipe_management_service),
) -> None:
    deleted = service.delete_recipe_image(image_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Image not found")


@router.get("/{image_id}")
async def get_image(
    image_id: UUID,
    service: RecipeManagementService = Depends(get_recipe_management_service),
) -> Response:
    image_response = service.get_recipe_image(image_id)
    if not image_response:
        raise HTTPException(status_code=404, detail="Image not found")

    return Response(
        content=image_response.content, media_type=image_response.media_type
    )
