import io

from fastapi import APIRouter, Depends, Response
from fastapi.responses import StreamingResponse

from miam.api.deps import get_recipe_export_service
from miam.domain.services import RecipeExportService

router = APIRouter(prefix="/export", tags=["export"])


@router.post("/markdown")
async def export_to_markdown(
    service: RecipeExportService = Depends(get_recipe_export_service),
) -> Response:
    content = service.export_recipes_to_markdown()
    return Response(
        content=content,
        media_type="text/markdown",
        headers={"Content-Disposition": 'attachment; filename="recipes.md"'},
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
