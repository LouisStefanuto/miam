"""Define how services can be used by external consumers (e.g., HTTP API, CLI)."""

from abc import ABC, abstractmethod
from uuid import UUID

from miam.domain.entities import (
    PaginatedResult,
    RecipeEntity,
    RecipeShareEntity,
    ShareRole,
)
from miam.domain.schemas import (
    ImageResponse,
    InstagramResponse,
    ParsedRecipe,
    RecipeCreate,
    RecipeUpdate,
)


class RecipeServicePort(ABC):
    @abstractmethod
    def create_recipe(self, data: RecipeCreate, owner_id: UUID) -> RecipeEntity:
        """Persist a new recipe with all related entities and return the created Recipe."""

    @abstractmethod
    def create_recipes(
        self, data: list[RecipeCreate], owner_id: UUID
    ) -> list[RecipeEntity]:
        """Persist multiple recipes atomically and return all created Recipe entities."""

    @abstractmethod
    def get_recipe_by_id(self, recipe_id: UUID, user_id: UUID) -> RecipeEntity | None:
        """Retrieve a recipe by its ID, scoped to the given user."""

    @abstractmethod
    def search_recipes(
        self,
        user_id: UUID,
        recipe_id: UUID | None = None,
        title: str | None = None,
        category: str | None = None,
        is_veggie: bool | None = None,
        season: str | None = None,
        limit: int | None = None,
        offset: int = 0,
        ownership: str | None = None,
    ) -> PaginatedResult:
        """Search for recipes using dynamic filters, visible to the given user."""

    @abstractmethod
    def update_recipe(
        self, recipe_id: UUID, data: RecipeUpdate, user_id: UUID
    ) -> RecipeEntity | None:
        """Full replacement of a recipe (PUT semantics). Returns None if not found/owned."""

    @abstractmethod
    def delete_recipe(self, recipe_id: UUID, user_id: UUID) -> bool:
        """Delete a recipe by ID. Returns True if deleted, False if not found/owned."""

    @abstractmethod
    def add_recipe_image(
        self, recipe_id: UUID, user_id: UUID, content: bytes, filename: str
    ) -> UUID:
        """Add an image to a recipe owned by user_id and return its image ID."""

    @abstractmethod
    def get_recipe_image(self, image_id: UUID, user_id: UUID) -> ImageResponse | None:
        """Retrieve image bytes for a given image ID, scoped to the given user."""

    @abstractmethod
    def delete_recipe_image(self, image_id: UUID, user_id: UUID) -> bool:
        """Delete an image from storage and database. Returns True if deleted, False if not found/owned."""


class RecipeShareServicePort(ABC):
    """Primary port for recipe sharing operations."""

    @abstractmethod
    def share_recipe(
        self, recipe_id: UUID, email: str, role: ShareRole, user_id: UUID
    ) -> RecipeShareEntity:
        """Share a recipe with another user by email. Only the owner can share."""

    @abstractmethod
    def get_pending_shares(self, user_id: UUID) -> list[RecipeShareEntity]:
        """List pending share invitations for the current user."""

    @abstractmethod
    def get_pending_shares_count(self, user_id: UUID) -> int:
        """Count pending share invitations for the current user."""

    @abstractmethod
    def accept_share(self, share_id: UUID, user_id: UUID) -> RecipeShareEntity:
        """Accept a share invitation."""

    @abstractmethod
    def accept_all_shares(self, user_id: UUID) -> list[RecipeShareEntity]:
        """Accept all pending share invitations for the current user."""

    @abstractmethod
    def reject_share(self, share_id: UUID, user_id: UUID) -> RecipeShareEntity:
        """Reject a share invitation."""

    @abstractmethod
    def remove_share(self, share_id: UUID, user_id: UUID) -> bool:
        """Remove a share (owner revokes or shared user leaves)."""

    @abstractmethod
    def leave_recipe(self, recipe_id: UUID, user_id: UUID) -> bool:
        """Remove yourself from a shared recipe."""

    @abstractmethod
    def get_recipe_shares(
        self, recipe_id: UUID, user_id: UUID
    ) -> list[RecipeShareEntity]:
        """List all collaborators for a recipe. Only the owner can view this."""


class RecipeImportServicePort(ABC):
    """Primary port for importing recipes from external sources."""

    @abstractmethod
    def parse_instagram(self, data: InstagramResponse) -> list[ParsedRecipe]:
        """Parse Instagram data and return parsed recipes with image URLs."""


class AuthServicePort(ABC):
    """Primary port for authentication operations."""

    @abstractmethod
    def login_with_google(self, id_token: str) -> str:
        """Authenticate via Google and return a JWT access token.

        Verifies the Google ID token, finds or creates the user,
        and returns a signed JWT.
        """


class RecipeExportServicePort(ABC):
    @abstractmethod
    def export_recipes_to_markdown(self, user_id: UUID) -> bytes:
        """Export the user's recipes as a ZIP archive containing Markdown and images."""

    @abstractmethod
    def export_recipes_to_word(self, user_id: UUID) -> bytes:
        """Export the user's recipes as Word document."""
