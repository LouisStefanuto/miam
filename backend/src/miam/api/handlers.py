"""FastAPI exception handlers for domain exceptions."""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from miam.domain.exceptions import ImageDownloadError


def register_exception_handlers(app: FastAPI) -> None:
    """Register all domain exception handlers on the FastAPI app."""

    @app.exception_handler(ImageDownloadError)
    async def image_download_error_handler(
        _request: Request, exc: ImageDownloadError
    ) -> JSONResponse:
        return JSONResponse(status_code=502, content={"detail": str(exc)})
