"""I/O models to interact with entities."""

from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from miam.domain.entities import Category, Season, SourceType


class IngredientCreate(BaseModel):
    name: str
    quantity: float | None = None
    unit: str | None = None
    display_order: int | None = None

    @field_validator("name", mode="before")
    @classmethod
    def capitalize_name(cls, v: str) -> str:
        """Ensure ingredient name starts with a capital letter."""
        if v:
            return v[0].upper() + v[1:]
        return v


class ImageCreate(BaseModel):
    caption: str | None = None
    display_order: int | None = None


class SourceCreate(BaseModel):
    type: SourceType
    raw_content: str


class RecipeCreate(BaseModel):
    title: str
    description: str = ""
    prep_time_minutes: int | None = None
    cook_time_minutes: int | None = None
    rest_time_minutes: int | None = None
    season: Season | None = None
    category: Category
    is_veggie: bool | None = False
    difficulty: int | None = Field(None, ge=1, le=3)
    number_of_people: int | None = Field(None, ge=1)
    rate: int | None = Field(None, ge=1, le=5)
    tested: bool = False
    tags: list[str] = []
    preparation: list[str] = []
    ingredients: list[IngredientCreate] = []
    images: list[ImageCreate] = []
    sources: list[SourceCreate] = []

    @model_validator(mode="after")
    def assign_display_orders(self) -> "RecipeCreate":
        """Auto-assign display_order from list position when not provided."""
        for idx, ing in enumerate(self.ingredients):
            if ing.display_order is None:
                ing.display_order = idx
        for idx, img in enumerate(self.images):
            if img.display_order is None:
                img.display_order = idx
        return self

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
    prep_time_minutes: int | None = None
    cook_time_minutes: int | None = None
    rest_time_minutes: int | None = None
    season: Season | None = None
    category: Category
    is_veggie: bool | None = False
    difficulty: int | None = Field(None, ge=1, le=3)
    number_of_people: int | None = Field(None, ge=1)
    rate: int | None = Field(None, ge=1, le=5)
    tested: bool = False
    tags: list[str] = []
    preparation: list[str] = []
    ingredients: list[IngredientCreate] = []
    sources: list[SourceCreate] = []

    @model_validator(mode="after")
    def assign_display_orders(self) -> "RecipeUpdate":
        """Auto-assign display_order from list position when not provided."""
        for idx, ing in enumerate(self.ingredients):
            if ing.display_order is None:
                ing.display_order = idx
        return self


class BatchRecipeCreate(BaseModel):
    recipes: list[RecipeCreate]


class ParsedRecipe(BaseModel):
    """A recipe parsed from an external source, with optional image URL."""

    recipe: RecipeCreate
    image_url: str | None = None


class ImageResponse(BaseModel):
    media_type: str
    content: bytes


# --- Instagram input schemas (only fields we use, extra fields ignored) ---


class _InstagramBase(BaseModel):
    model_config = ConfigDict(extra="allow")


class InstagramImageCandidate(_InstagramBase):
    url: str
    width: int
    height: int

    @field_validator("url")
    @classmethod
    def validate_https_url(cls, v: str) -> str:
        """Only allow HTTPS URLs to prevent javascript:, file://, data: etc."""
        if not v.startswith("https://"):
            raise ValueError("Image URL must use HTTPS scheme")
        return v


class InstagramImageVersions(_InstagramBase):
    candidates: list[InstagramImageCandidate] = []


class InstagramOwner(_InstagramBase):
    username: str = "unknown"


class InstagramCaption(_InstagramBase):
    text: str = ""


class InstagramMedia(_InstagramBase):
    owner: InstagramOwner = InstagramOwner()
    caption: InstagramCaption = InstagramCaption()
    image_versions2: InstagramImageVersions | None = None


class InstagramItem(_InstagramBase):
    media: InstagramMedia


class InstagramResponse(_InstagramBase):
    items: list[InstagramItem] = []


# --- Auth schemas ---


class GoogleLoginRequest(BaseModel):
    """Request body for Google OAuth login."""

    id_token: str


class TokenResponse(BaseModel):
    """JWT token response."""

    access_token: str
    token_type: str = "bearer"
