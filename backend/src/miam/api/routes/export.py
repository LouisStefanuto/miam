import io
from fastapi import APIRouter, Depends, Response
from miam.api.deps import get_recipe_service

from fastapi.responses import StreamingResponse
from miam.domain.services import RecipeService

router = APIRouter(prefix="/export", tags=["export"])


@router.post("/markdown")
async def export_to_markdown(
    service: RecipeService = Depends(get_recipe_service),
) -> Response:
    content = service.export_to_markdown()
    return Response(
        content=content,
        media_type="text/markdown",
        headers={"Content-Disposition": 'attachment; filename="recipes.md"'},
    )


@router.post("/word")
async def export_to_docx(
    service: RecipeService = Depends(get_recipe_service),
) -> StreamingResponse:
    word_bytes = service.export_to_word()
    return StreamingResponse(
        io.BytesIO(word_bytes),
        media_type=(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ),
        headers={"Content-Disposition": 'attachment; filename="recipes.docx"'},
    )
