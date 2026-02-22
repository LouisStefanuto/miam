"""Pure domain entities and enums, independent of any framework or infrastructure."""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from uuid import UUID


class Season(Enum):
    """Recipe seasonal availability."""

    winter = "winter"
    spring = "spring"
    summer = "summer"
    autumn = "autumn"


class Category(Enum):
    """Recipe course categories."""

    apero = "apero"
    entree = "entree"
    plat = "plat"
    dessert = "dessert"
    boisson = "boisson"
    gouter = "gouter"
    pates = "pâtes"


class SourceType(Enum):
    """Recipe source origin types."""

    manual = "manual"
    instagram = "instagram"
    url = "url"
    photo = "photo"


@dataclass
class IngredientEntity:
    name: str
    quantity: float | None = None
    unit: str | None = None


@dataclass
class ImageEntity:
    id: UUID
    caption: str | None = None
    display_order: int = 0


@dataclass
class SourceEntity:
    type: str
    raw_content: str


@dataclass
class RecipeEntity:
    id: UUID
    title: str
    description: str
    category: str
    prep_time_minutes: int | None = None
    cook_time_minutes: int | None = None
    rest_time_minutes: int | None = None
    season: str | None = None
    is_veggie: bool = False
    difficulty: int | None = None
    number_of_people: int | None = None
    rate: int | None = None
    tested: bool = False
    tags: list[str] = field(default_factory=list)
    preparation: list[str] = field(default_factory=list)
    ingredients: list[IngredientEntity] = field(default_factory=list)
    images: list[ImageEntity] = field(default_factory=list)
    sources: list[SourceEntity] = field(default_factory=list)
    created_at: datetime | None = None


@dataclass
class PaginatedResult:
    items: list[RecipeEntity]
    total: int
