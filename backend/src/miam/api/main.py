from fastapi import FastAPI, status

from miam.api.routes import recipes

app = FastAPI(title="Livre Recettes")


@app.get("/", status_code=status.HTTP_201_CREATED)
def root() -> str:
    return "Livre Recettes"


app.include_router(recipes.router, prefix="/api")
