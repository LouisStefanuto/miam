from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator

from miam.domain.entities import Category, Season, SourceType


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
    description: str = ""
    prep_time_minutes: Optional[int] = None
    cook_time_minutes: Optional[int] = None
    rest_time_minutes: Optional[int] = None
    season: Optional[Season] = None
    category: Category
    is_veggie: Optional[bool] = False
    difficulty: Optional[int] = Field(None, ge=1, le=3)
    number_of_people: Optional[int] = Field(None, ge=1)
    rate: Optional[int] = Field(None, ge=1, le=5)
    tested: bool = False
    tags: list[str] = []
    preparation: list[str] = []
    ingredients: list[IngredientCreate] = []
    images: list[ImageCreate] = []
    sources: list[SourceCreate] = []

    @field_validator("season", mode="before")
    @classmethod
    def coerce_season(cls, v: Any) -> Any:
        """Treat empty string as None."""
        if v == "":
            return None
        return v


class RecipeUpdate(BaseModel):
    """Full replacement of a recipe (PUT). Images excluded — separate upload flow."""

    title: str
    description: str
    prep_time_minutes: Optional[int] = None
    cook_time_minutes: Optional[int] = None
    rest_time_minutes: Optional[int] = None
    season: Optional[Season] = None
    category: Category
    is_veggie: Optional[bool] = False
    difficulty: Optional[int] = Field(None, ge=1, le=3)
    number_of_people: Optional[int] = Field(None, ge=1)
    rate: Optional[int] = Field(None, ge=1, le=5)
    tested: bool = False
    tags: list[str] = []
    preparation: list[str] = []
    ingredients: list[IngredientCreate] = []
    sources: list[SourceCreate] = []


class BatchRecipeCreate(BaseModel):
    recipes: list[RecipeCreate]


class ImageResponse(BaseModel):
    media_type: str
    content: bytes
