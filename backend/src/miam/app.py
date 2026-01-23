from fastapi import FastAPI
from pydantic import BaseModel

app: FastAPI = FastAPI()


@app.get("/")
def read_root() -> dict[str, str]:
    return {"message": "Hello, FastAPI 🚀"}


class Item(BaseModel):
    name: str
    price: float
    in_stock: bool = True


@app.post("/items/", response_model=Item)
def create_item(item: Item) -> Item:
    return item


@app.get("/items/", response_model=list[Item])
def list_items() -> list[Item]:
    return [
        Item(name="Book", price=9.99),
        Item(name="Pen", price=1.5, in_stock=False),
    ]
