"""Define how the domain interacts with infrastructure."""

from abc import ABC, abstractmethod
from uuid import UUID

from miam.domain.entities import (
    AuthProvider,
    ImageEntity,
    PaginatedResult,
    RecipeEntity,
    UserEntity,
)
from miam.domain.schemas import ImageResponse, RecipeCreate, RecipeUpdate


class RecipeRepositoryPort(ABC):
    """Secondary port for recipe persistence.

    Abstraction for database operations. The domain doesn't care if it's
    SQLAlchemy, MongoDB, or any other persistence mechanism.
    """

    @abstractmethod
    def add_recipe(self, data: RecipeCreate, owner_id: UUID) -> RecipeEntity:
        """Persist a new recipe and return it as a domain entity."""

    @abstractmethod
    def add_recipes(
        self, data: list[RecipeCreate], owner_id: UUID
    ) -> list[RecipeEntity]:
        """Persist multiple recipes atomically and return them as domain entities."""

    @abstractmethod
    def get_recipe_by_id(self, recipe_id: UUID) -> RecipeEntity | None:
        """Retrieve a recipe by ID with all relationships loaded."""

    @abstractmethod
    def search_recipes(
        self,
        recipe_id: UUID | None = None,
        title: str | None = None,
        category: str | None = None,
        is_veggie: bool | None = None,
        season: str | None = None,
        limit: int | None = None,
        offset: int = 0,
    ) -> PaginatedResult:
        """Query recipes with dynamic filtering and pagination."""

    @abstractmethod
    def update_recipe(self, recipe_id: UUID, data: RecipeUpdate) -> RecipeEntity | None:
        """Full replacement of a recipe. Returns None if not found."""

    @abstractmethod
    def delete_recipe(self, recipe_id: UUID) -> bool:
        """Delete a recipe by ID. Returns True if deleted, False if not found."""

    @abstractmethod
    def add_image(
        self,
        recipe_id: UUID,
        caption: str | None = None,
        display_order: int | None = 0,
    ) -> ImageEntity:
        """Persist an Image record for a recipe and return the created ImageEntity."""

    @abstractmethod
    def delete_image(self, image_id: UUID) -> bool:
        """Delete an Image record by ID. Returns True if deleted, False if not found."""


class ImageStoragePort(ABC):
    @abstractmethod
    def add_recipe_image(
        self,
        recipe_id: UUID,
        image: bytes,
        filename: str,
        image_id: UUID,
    ) -> UUID:
        """Add an image to storage and return its image ID."""

    @abstractmethod
    def get_recipe_image(self, image_id: UUID) -> ImageResponse | None:
        """Retrieve image bytes from storage by image ID."""

    @abstractmethod
    def delete_image(self, image_id: UUID) -> bool:
        """Delete an image file from storage. Returns True if deleted, False if not found."""


class WordExporterPort(ABC):
    """Secondary port for Word format export."""

    @abstractmethod
    def save(self, recipes: list[RecipeEntity], output_path: str) -> None:
        """Save recipes to a Word file."""

    @abstractmethod
    def to_bytes(self, recipes: list[RecipeEntity]) -> bytes:
        """Serialize recipes to Word binary format."""


class MarkdownExporterPort(ABC):
    """Secondary port for Markdown format export."""

    @abstractmethod
    def save(self, recipes: list[RecipeEntity], output_file: str) -> None:
        """Save recipes to a Markdown file (includes I/O side effect)."""

    @abstractmethod
    def to_string(self, recipes: list[RecipeEntity]) -> str:
        """Serialize recipes to Markdown string format."""

    @abstractmethod
    def to_zip_bytes(self, recipes: list[RecipeEntity]) -> bytes:
        """Serialize recipes to a ZIP archive containing the Markdown file and images."""


class UserRepositoryPort(ABC):
    """Secondary port for user persistence."""

    @abstractmethod
    def create_user(
        self,
        email: str,
        display_name: str,
        auth_provider: AuthProvider,
        auth_provider_id: str,
        avatar_url: str | None = None,
    ) -> UserEntity:
        """Create a new user and return the domain entity."""

    @abstractmethod
    def get_user_by_id(self, user_id: UUID) -> UserEntity | None:
        """Retrieve a user by ID."""

    @abstractmethod
    def get_user_by_email(self, email: str) -> UserEntity | None:
        """Retrieve a user by email address."""

    @abstractmethod
    def get_user_by_provider(
        self, auth_provider: AuthProvider, auth_provider_id: str
    ) -> UserEntity | None:
        """Retrieve a user by SSO provider and provider-specific ID."""
