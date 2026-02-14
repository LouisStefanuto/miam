from typing import Optional

from pydantic import BaseModel, Field

from miam.infra.db.base import Category, Season, SourceType


class IngredientCreate(BaseModel):
    name: str
    quantity: Optional[float] = None
    unit: Optional[str] = None


class ImageCreate(BaseModel):
    caption: Optional[str] = None
    display_order: Optional[int] = 0


class SourceCreate(BaseModel):
    type: SourceType
    raw_content: str


class RecipeCreate(BaseModel):
    title: str
    description: str
    prep_time_minutes: Optional[int]
    cook_time_minutes: Optional[int]
    rest_time_minutes: Optional[int]
    season: Optional[Season]
    category: Category
    is_veggie: Optional[bool] = False
    ingredients: list[IngredientCreate] = Field(default_factory=list)
    images: list[ImageCreate] = Field(default_factory=list)
    sources: list[SourceCreate] = Field(default_factory=list)
