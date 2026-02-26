"""Entrypoint for the FastAPI application."""

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from miam import __version__
from miam.api.routes import export, images, recipes, root

app = FastAPI(title="Livre Recettes", version=__version__)

origins = [
    "http://localhost",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,  # ty: ignore[invalid-argument-type]
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")

api_router.include_router(recipes.router)
api_router.include_router(images.router)
api_router.include_router(export.router)

app.include_router(api_router)
app.include_router(root.router)
