from fastapi import FastAPI

from miam import __version__
from miam.api.routes import recipes, root

app = FastAPI(title="Livre Recettes", version=__version__)

app.include_router(root.router)
app.include_router(recipes.router, prefix="/api")
