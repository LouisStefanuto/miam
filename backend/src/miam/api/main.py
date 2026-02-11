from fastapi import APIRouter, FastAPI

from miam import __version__
from miam.api.routes import export, recipes, root

app = FastAPI(title="Livre Recettes", version=__version__)

api_router = APIRouter(prefix="/api")

api_router.include_router(recipes.router)
api_router.include_router(export.router)

app.include_router(api_router)
app.include_router(root.router)
