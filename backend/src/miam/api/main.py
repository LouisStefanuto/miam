"""Entrypoint for the FastAPI application."""

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings, SettingsConfigDict

from miam import __version__
from miam.api.routes import auth, export, images, import_recipes, recipes, root, shares


class CorsSettings(BaseSettings):
    """CORS configuration loaded from environment variables."""

    cors_origins: list[str] = ["http://localhost", "http://localhost:3000"]

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


app = FastAPI(title="Livre Recettes", version=__version__)

cors_settings = CorsSettings()

app.add_middleware(
    CORSMiddleware,  # ty: ignore[invalid-argument-type]
    allow_origins=cors_settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router)
api_router.include_router(recipes.router)
api_router.include_router(images.router)
api_router.include_router(export.router)
api_router.include_router(import_recipes.router)
api_router.include_router(shares.router)

app.include_router(api_router)
app.include_router(root.router)
