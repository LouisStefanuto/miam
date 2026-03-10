"""API routes for exporting recipes in various formats."""

import io
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from miam.api.deps import get_current_user_id, get_recipe_export_service
from miam.domain.services import RecipeExportService

router = APIRouter(prefix="/export", tags=["export"])


@router.post("/markdown")
def export_to_markdown(
    service: Annotated[RecipeExportService, Depends(get_recipe_export_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> StreamingResponse:
    zip_bytes = service.export_recipes_to_markdown(user_id)
    return StreamingResponse(
        io.BytesIO(zip_bytes),
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="recipes.zip"'},
    )


@router.post("/word")
def export_to_docx(
    service: Annotated[RecipeExportService, Depends(get_recipe_export_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> StreamingResponse:
    word_bytes = service.export_recipes_to_word(user_id)
    return StreamingResponse(
        io.BytesIO(word_bytes),
        media_type=(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ),
        headers={"Content-Disposition": 'attachment; filename="recipes.docx"'},
    )
