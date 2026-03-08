"""Tests for AuthService using stub implementations of ports."""

from uuid import UUID, uuid4

import pytest

from miam.domain.entities import AuthProvider, GoogleUserInfo, UserEntity
from miam.domain.ports_secondary import (
    GoogleTokenVerifierPort,
    JwtTokenPort,
    UserRepositoryPort,
)
from miam.domain.services import AuthService

# ---------------------------------------------------------------------------
# Stubs
# ---------------------------------------------------------------------------


class StubGoogleTokenVerifier(GoogleTokenVerifierPort):
    """Stub that returns a fixed GoogleUserInfo or raises."""

    def __init__(self, user_info: GoogleUserInfo | None = None) -> None:
        self._user_info = user_info

    def verify(self, id_token: str) -> GoogleUserInfo:
        if self._user_info is None:
            raise ValueError("Invalid token")
        return self._user_info


class StubJwtToken(JwtTokenPort):
    """Stub that returns a predictable token and decodes it."""

    def __init__(self) -> None:
        self._tokens: dict[str, UUID] = {}

    def create_access_token(self, user_id: UUID) -> str:
        token = f"jwt-for-{user_id}"
        self._tokens[token] = user_id
        return token

    def decode_access_token(self, token: str) -> UUID:
        if token not in self._tokens:
            raise ValueError("Invalid token")
        return self._tokens[token]


class StubUserRepository(UserRepositoryPort):
    """In-memory user repository for testing."""

    def __init__(self) -> None:
        self.users: dict[UUID, UserEntity] = {}
        self._by_provider: dict[str, UserEntity] = {}
        self._by_email: dict[str, UserEntity] = {}

    def create_user(
        self,
        email: str,
        display_name: str,
        auth_provider: AuthProvider,
        auth_provider_id: str,
        avatar_url: str | None = None,
    ) -> UserEntity:
        uid = uuid4()
        user = UserEntity(
            id=uid,
            email=email,
            display_name=display_name,
            auth_provider=auth_provider.value,
            auth_provider_id=auth_provider_id,
            avatar_url=avatar_url,
        )
        self.users[uid] = user
        self._by_provider[f"{auth_provider.value}:{auth_provider_id}"] = user
        self._by_email[email] = user
        return user

    def get_user_by_id(self, user_id: UUID) -> UserEntity | None:
        return self.users.get(user_id)

    def get_user_by_email(self, email: str) -> UserEntity | None:
        return self._by_email.get(email)

    def get_user_by_provider(
        self, auth_provider: AuthProvider, auth_provider_id: str
    ) -> UserEntity | None:
        key = f"{auth_provider.value}:{auth_provider_id}"
        return self._by_provider.get(key)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestLoginWithGoogle:
    def _make_service(
        self,
        user_info: GoogleUserInfo | None = None,
        user_repo: StubUserRepository | None = None,
    ) -> tuple[AuthService, StubUserRepository, StubJwtToken]:
        verifier = StubGoogleTokenVerifier(user_info)
        jwt = StubJwtToken()
        repo = user_repo or StubUserRepository()
        service = AuthService(
            google_verifier=verifier,
            jwt_token=jwt,
            user_repository=repo,
        )
        return service, repo, jwt

    def test_creates_new_user_on_first_login(self) -> None:
        info = GoogleUserInfo(
            email="alice@gmail.com",
            name="Alice",
            google_id="google-alice-123",
            picture="https://example.com/alice.jpg",
        )
        service, repo, jwt = self._make_service(user_info=info)

        token = service.login_with_google("valid-google-token")

        assert token.startswith("jwt-for-")
        assert len(repo.users) == 1
        user = next(iter(repo.users.values()))
        assert user.email == "alice@gmail.com"
        assert user.display_name == "Alice"
        assert user.auth_provider == "google"
        assert user.auth_provider_id == "google-alice-123"
        assert user.avatar_url == "https://example.com/alice.jpg"

    def test_returns_existing_user_on_repeat_login(self) -> None:
        info = GoogleUserInfo(
            email="bob@gmail.com",
            name="Bob",
            google_id="google-bob-456",
        )
        repo = StubUserRepository()
        # Pre-create the user
        existing = repo.create_user(
            email="bob@gmail.com",
            display_name="Bob",
            auth_provider=AuthProvider.google,
            auth_provider_id="google-bob-456",
        )
        service, repo, jwt = self._make_service(user_info=info, user_repo=repo)

        token = service.login_with_google("valid-google-token")

        assert token == f"jwt-for-{existing.id}"
        # No new user created
        assert len(repo.users) == 1

    def test_invalid_google_token_raises(self) -> None:
        service, _, _ = self._make_service(user_info=None)

        with pytest.raises(ValueError, match="Invalid token"):
            service.login_with_google("bad-token")

    def test_token_contains_correct_user_id(self) -> None:
        info = GoogleUserInfo(
            email="charlie@gmail.com",
            name="Charlie",
            google_id="google-charlie-789",
        )
        service, repo, jwt = self._make_service(user_info=info)

        token = service.login_with_google("valid-token")

        user = next(iter(repo.users.values()))
        decoded_id = jwt.decode_access_token(token)
        assert decoded_id == user.id
