"""Dependency injection for FastAPI routes."""

from collections.abc import Generator
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.orm import Session

from miam.domain.services import (
    AuthService,
    RecipeExportService,
    RecipeManagementService,
)
from miam.infra.db.session import SessionLocal
from miam.infra.exporter_markdown import MarkdownExporter
from miam.infra.exporter_word import WordExporter
from miam.infra.google_auth import GoogleTokenVerifier
from miam.infra.image_storage import LocalImageStorage
from miam.infra.jwt_handler import JwtTokenHandler
from miam.infra.repositories import RecipeRepository, UserRepository


class AuthSettings(BaseSettings):
    """Auth configuration loaded from environment variables."""

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 1440  # 24 hours
    google_client_id: str

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


_auth_settings = AuthSettings()
_security = HTTPBearer()


def get_db() -> Generator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _get_jwt_handler() -> JwtTokenHandler:
    return JwtTokenHandler(
        secret_key=_auth_settings.jwt_secret_key,
        algorithm=_auth_settings.jwt_algorithm,
        expiration_minutes=_auth_settings.jwt_expiration_minutes,
    )


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(_security),  # noqa: B008
) -> UUID:
    """Extract and validate the JWT from the Authorization header."""
    handler = _get_jwt_handler()
    try:
        return handler.decode_access_token(credentials.credentials)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def get_auth_service(
    db: Session = Depends(get_db),  # noqa: B008
) -> AuthService:
    google_verifier = GoogleTokenVerifier(client_id=_auth_settings.google_client_id)
    jwt_handler = _get_jwt_handler()
    user_repo = UserRepository(db)
    return AuthService(
        google_verifier=google_verifier,
        jwt_token=jwt_handler,
        user_repository=user_repo,
    )


def get_recipe_management_service(
    db: Session = Depends(get_db),  # noqa: B008
) -> RecipeManagementService:
    repo = RecipeRepository(db)
    image_storage = LocalImageStorage("images")
    return RecipeManagementService(repo, image_storage)


def get_recipe_export_service(
    db: Session = Depends(get_db),  # noqa: B008
) -> RecipeExportService:
    repo = RecipeRepository(db)
    image_storage = LocalImageStorage("images")
    word_exporter = WordExporter(image_storage=image_storage)
    markdown_exporter = MarkdownExporter(image_storage=image_storage)
    return RecipeExportService(repo, word_exporter, markdown_exporter)
