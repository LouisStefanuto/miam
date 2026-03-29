"""Orchestrate recipe and authentication operations."""

from uuid import UUID

from miam.domain.entities import (
    AuthProvider,
    ImageEntity,
    PaginatedResult,
    RecipeEntity,
    RecipeShareEntity,
    ShareRole,
    ShareStatus,
)
from miam.domain.ports_primary import (
    AuthServicePort,
    RecipeExportServicePort,
    RecipeImportServicePort,
    RecipeServicePort,
    RecipeShareServicePort,
)
from miam.domain.ports_secondary import (
    GoogleTokenVerifierPort,
    ImageStoragePort,
    InstagramParserPort,
    JwtTokenPort,
    MarkdownExporterPort,
    RecipeRepositoryPort,
    RecipeShareRepositoryPort,
    UserRepositoryPort,
    WordExporterPort,
)
from miam.domain.schemas import (
    ImageResponse,
    InstagramResponse,
    ParsedRecipe,
    RecipeCreate,
    RecipeUpdate,
)


class RecipeManagementService(RecipeServicePort):
    """Service for recipe creation, retrieval, and search operations."""

    def __init__(
        self,
        repository: RecipeRepositoryPort,
        image_storage: ImageStoragePort,
        share_repo: RecipeShareRepositoryPort | None = None,
    ):
        self.repository = repository
        self.image_storage = image_storage
        self.share_repo = share_repo

    def _get_role(self, recipe_id: UUID, user_id: UUID) -> str | None:
        """Get the user's role for a recipe (owner/editor/reader/None)."""
        if self.share_repo is None:
            return None
        return self.share_repo.get_user_role_for_recipe(recipe_id, user_id)

    def _require_edit_access(self, recipe_id: UUID, user_id: UUID) -> None:
        """Raise ValueError if user cannot edit the recipe."""
        role = self._get_role(recipe_id, user_id)
        if role not in ("owner", "editor"):
            raise ValueError("You don't have permission to edit this recipe")

    def create_recipe(self, data: RecipeCreate, owner_id: UUID) -> RecipeEntity:
        """Create a new recipe with ingredients, images, and sources."""
        return self.repository.add_recipe(data, owner_id=owner_id)

    def create_recipes(
        self, data: list[RecipeCreate], owner_id: UUID
    ) -> list[RecipeEntity]:
        """Create multiple recipes in a single atomic transaction."""
        return self.repository.add_recipes(data, owner_id=owner_id)

    def get_recipe_by_id(self, recipe_id: UUID, user_id: UUID) -> RecipeEntity | None:
        """Retrieve a recipe by ID, scoped to the given user."""
        return self.repository.get_recipe_by_id(recipe_id, user_id)

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
        """Search/filter recipes via the repository abstraction, visible to user."""
        return self.repository.search_recipes(
            user_id=user_id,
            recipe_id=recipe_id,
            title=title,
            category=category,
            is_veggie=is_veggie,
            season=season,
            limit=limit,
            offset=offset,
            ownership=ownership,
        )

    def update_recipe(
        self, recipe_id: UUID, data: RecipeUpdate, user_id: UUID
    ) -> RecipeEntity | None:
        if self.share_repo is not None:
            self._require_edit_access(recipe_id, user_id)
        return self.repository.update_recipe(recipe_id, data, user_id)

    def delete_recipe(self, recipe_id: UUID, user_id: UUID) -> bool:
        recipe = self.repository.get_recipe_by_id(recipe_id, user_id)
        if recipe is None:
            return False
        if recipe.owner_id != user_id:
            raise ValueError("Only the owner can delete a recipe")
        for image in recipe.images:
            self.image_storage.delete_image(image.id)
        return self.repository.delete_recipe(recipe_id, user_id)

    def add_recipe_image(
        self, recipe_id: UUID, user_id: UUID, content: bytes, filename: str
    ) -> UUID:
        """Add an image to a recipe. Requires owner or editor role."""
        if self.share_repo is not None:
            self._require_edit_access(recipe_id, user_id)
        img: ImageEntity = self.repository.add_image(
            recipe_id=recipe_id,
            user_id=user_id,
            caption=None,
            display_order=0,
        )

        self.image_storage.add_recipe_image(recipe_id, content, filename, img.id)
        return img.id

    def get_recipe_image(self, image_id: UUID, user_id: UUID) -> ImageResponse | None:
        """Retrieve image bytes from storage by image ID, only if owned by user."""
        if not self.repository.image_belongs_to_user(image_id, user_id):
            return None
        return self.image_storage.get_recipe_image(image_id)

    def delete_recipe_image(self, image_id: UUID, user_id: UUID) -> bool:
        """Delete an image from storage and database."""
        deleted = self.repository.delete_image(image_id, user_id)
        if deleted:
            self.image_storage.delete_image(image_id)
        return deleted


class RecipeShareService(RecipeShareServicePort):
    """Service for sharing recipes between users."""

    def __init__(
        self,
        share_repo: RecipeShareRepositoryPort,
        user_repo: UserRepositoryPort,
        recipe_repo: RecipeRepositoryPort,
    ):
        self.share_repo = share_repo
        self.user_repo = user_repo
        self.recipe_repo = recipe_repo

    def share_recipe(
        self, recipe_id: UUID, email: str, role: ShareRole, user_id: UUID
    ) -> RecipeShareEntity:
        """Share a recipe with another user. Only the owner can share."""
        recipe = self.recipe_repo.get_recipe_by_id(recipe_id, user_id)
        if recipe is None:
            raise ValueError("Recipe not found")
        if recipe.owner_id != user_id:
            raise ValueError("Only the owner can share a recipe")

        target = self.user_repo.get_user_by_email(email)
        if target is None:
            raise ValueError("No account found for this email")
        if target.id == user_id:
            raise ValueError("Cannot share a recipe with yourself")

        existing = self.share_repo.get_share_for_recipe_and_user(recipe_id, target.id)
        if existing is not None:
            raise ValueError("Recipe is already shared with this user")

        return self.share_repo.create_share(recipe_id, user_id, target.id, role)

    def get_pending_shares(self, user_id: UUID) -> list[RecipeShareEntity]:
        return self.share_repo.get_pending_shares_for_user(user_id)

    def get_pending_shares_count(self, user_id: UUID) -> int:
        return self.share_repo.get_pending_shares_count(user_id)

    def accept_share(self, share_id: UUID, user_id: UUID) -> RecipeShareEntity:
        share = self.share_repo.get_share_by_id(share_id)
        if share is None or share.shared_with_user_id != user_id:
            raise ValueError("Share not found")
        if share.status != ShareStatus.pending:
            raise ValueError("Share is not pending")
        result = self.share_repo.update_share_status(share_id, ShareStatus.accepted)
        if result is None:
            raise ValueError("Failed to update share")
        return result

    def accept_all_shares(self, user_id: UUID) -> list[RecipeShareEntity]:
        return self.share_repo.accept_all_pending_shares(user_id)

    def reject_share(self, share_id: UUID, user_id: UUID) -> RecipeShareEntity:
        share = self.share_repo.get_share_by_id(share_id)
        if share is None or share.shared_with_user_id != user_id:
            raise ValueError("Share not found")
        if share.status != ShareStatus.pending:
            raise ValueError("Share is not pending")
        result = self.share_repo.update_share_status(share_id, ShareStatus.rejected)
        if result is None:
            raise ValueError("Failed to update share")
        return result

    def remove_share(self, share_id: UUID, user_id: UUID) -> bool:
        share = self.share_repo.get_share_by_id(share_id)
        if share is None:
            return False
        # Owner can revoke any share; shared user can remove their own
        if share.shared_by_user_id != user_id and share.shared_with_user_id != user_id:
            raise ValueError("Not authorized to remove this share")
        return self.share_repo.delete_share(share_id)

    def leave_recipe(self, recipe_id: UUID, user_id: UUID) -> bool:
        """Remove yourself from a shared recipe by recipe ID."""
        share = self.share_repo.get_share_for_recipe_and_user(recipe_id, user_id)
        if share is None:
            return False
        return self.share_repo.delete_share(share.id)

    def get_recipe_shares(
        self, recipe_id: UUID, user_id: UUID
    ) -> list[RecipeShareEntity]:
        """Only the owner can view all collaborators."""
        role = self.share_repo.get_user_role_for_recipe(recipe_id, user_id)
        if role != "owner":
            raise ValueError("Only the owner can view collaborators")
        return self.share_repo.get_shares_for_recipe(recipe_id)


class RecipeImportService(RecipeImportServicePort):
    """Service for importing recipes from external sources."""

    def __init__(self, instagram_parser: InstagramParserPort) -> None:
        self.instagram_parser = instagram_parser

    def parse_instagram(self, data: InstagramResponse) -> list[ParsedRecipe]:
        """Parse Instagram data using the injected parser adapter."""
        return self.instagram_parser.parse(data)


class AuthService(AuthServicePort):
    """Service for authentication: Google login → find/create user → issue JWT."""

    def __init__(
        self,
        google_verifier: GoogleTokenVerifierPort,
        jwt_token: JwtTokenPort,
        user_repository: UserRepositoryPort,
    ):
        self.google_verifier = google_verifier
        self.jwt_token = jwt_token
        self.user_repository = user_repository

    def login_with_google(self, id_token: str) -> str:
        """Verify Google ID token, find or create the user, return a JWT."""
        user_info = self.google_verifier.verify(id_token)

        user = self.user_repository.get_user_by_provider(
            AuthProvider.google, user_info.google_id
        )
        if user is None:
            user = self.user_repository.create_user(
                email=user_info.email,
                display_name=user_info.name,
                auth_provider=AuthProvider.google,
                auth_provider_id=user_info.google_id,
                avatar_url=user_info.picture,
            )

        return self.jwt_token.create_access_token(user.id)


class RecipeExportService(RecipeExportServicePort):
    """Service for exporting recipes to different formats."""

    def __init__(
        self,
        repository: RecipeRepositoryPort,
        word_exporter: WordExporterPort,
        markdown_exporter: MarkdownExporterPort,
    ):
        self.repository = repository
        self.word_exporter = word_exporter
        self.markdown_exporter = markdown_exporter

    def export_recipes_to_markdown(self, user_id: UUID) -> bytes:
        """Export the user's recipes as a ZIP archive containing Markdown and images."""
        result = self.repository.search_recipes(user_id=user_id)
        return self.markdown_exporter.to_zip_bytes(result.items)

    def export_recipes_to_word(self, user_id: UUID) -> bytes:
        """Export the user's recipes as Word binary format (in-memory)."""
        result = self.repository.search_recipes(user_id=user_id)
        return self.word_exporter.to_bytes(result.items)
