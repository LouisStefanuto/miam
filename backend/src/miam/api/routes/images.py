"""API routes for managing images."""

from fastapi import APIRouter, File, Response, UploadFile
from loguru import logger
from pydantic import BaseModel

router = APIRouter(prefix="/images", tags=["images"])


class ImageUploadResponse(BaseModel):
    title: str
    recipe: str


@router.post("", response_model=ImageUploadResponse, status_code=201)
async def upload_image(
    recipe_id: str,
    image: UploadFile = File(...),
) -> ImageUploadResponse:
    # Placeholder for image upload logic
    logger.info(f"Received image upload for recipe {recipe_id}: {image.filename}")
    return ImageUploadResponse(title=image.filename or "untitled", recipe=recipe_id)


@router.get("{image_id}")
async def get_image(image_id: str) -> Response:
    # Placeholder for image retrieval logic
    return Response(
        content=f"Image data for {image_id}", media_type="application/octet-stream"
    )
