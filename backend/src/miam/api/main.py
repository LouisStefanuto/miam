from fastapi import FastAPI

from miam.api.routes import recipes

app = FastAPI(title="Livre Recettes")

app.include_router(recipes.router, prefix="/api")
