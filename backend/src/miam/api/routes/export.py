"""API routes for exporting recipes in various formats."""

import io

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse

from miam.api.deps import get_recipe_export_service
from miam.domain.services import RecipeExportService

router = APIRouter(prefix="/export", tags=["export"])


@router.post("/markdown")
async def export_to_markdown(
    service: RecipeExportService = Depends(get_recipe_export_service),
) -> StreamingResponse:
    zip_bytes = service.export_recipes_to_markdown()
    return StreamingResponse(
        io.BytesIO(zip_bytes),
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="recipes.zip"'},
    )


@router.post("/word")
async def export_to_docx(
    service: RecipeExportService = Depends(get_recipe_export_service),
) -> StreamingResponse:
    word_bytes = service.export_recipes_to_word()
    return StreamingResponse(
        io.BytesIO(word_bytes),
        media_type=(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ),
        headers={"Content-Disposition": 'attachment; filename="recipes.docx"'},
    )
