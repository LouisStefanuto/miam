"""Orchestrate recipe and authentication operations."""

from uuid import UUID

from miam.domain.entities import (
    AuthProvider,
    ImageEntity,
    PaginatedResult,
    RecipeEntity,
)
from miam.domain.ports_primary import (
    AuthServicePort,
    RecipeExportServicePort,
    RecipeImportServicePort,
    RecipeServicePort,
)
from miam.domain.ports_secondary import (
    GoogleTokenVerifierPort,
    ImageStoragePort,
    InstagramParserPort,
    JwtTokenPort,
    MarkdownExporterPort,
    RecipeRepositoryPort,
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
    ):
        self.repository = repository
        self.image_storage = image_storage

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
    ) -> PaginatedResult:
        """Search/filter recipes via the repository abstraction, scoped to user."""
        return self.repository.search_recipes(
            user_id=user_id,
            recipe_id=recipe_id,
            title=title,
            category=category,
            is_veggie=is_veggie,
            season=season,
            limit=limit,
            offset=offset,
        )

    def update_recipe(
        self, recipe_id: UUID, data: RecipeUpdate, user_id: UUID
    ) -> RecipeEntity | None:
        return self.repository.update_recipe(recipe_id, data, user_id)

    def delete_recipe(self, recipe_id: UUID, user_id: UUID) -> bool:
        recipe = self.repository.get_recipe_by_id(recipe_id, user_id)
        if recipe is None:
            return False
        for image in recipe.images:
            self.image_storage.delete_image(image.id)
        return self.repository.delete_recipe(recipe_id, user_id)

    def add_recipe_image(
        self, recipe_id: UUID, user_id: UUID, content: bytes, filename: str
    ) -> UUID:
        """Add an image to a recipe owned by user_id and return its image ID."""
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

    def get_recipe_image_public(self, image_id: UUID) -> ImageResponse | None:
        """Retrieve image bytes by ID without ownership check (IDs are unguessable UUIDs)."""
        return self.image_storage.get_recipe_image(image_id)

    def delete_recipe_image(self, image_id: UUID, user_id: UUID) -> bool:
        """Delete an image from storage and database."""
        deleted = self.repository.delete_image(image_id, user_id)
        if deleted:
            self.image_storage.delete_image(image_id)
        return deleted


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
