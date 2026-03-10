"""JWT token creation and verification using PyJWT."""

from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt

from miam.domain.ports_secondary import JwtTokenPort


class JwtTokenHandler(JwtTokenPort):
    """Concrete implementation of JwtTokenPort using PyJWT."""

    def __init__(
        self,
        secret_key: str,
        algorithm: str = "HS256",
        expiration_minutes: int = 1440,
    ):
        self._secret_key = secret_key
        self._algorithm = algorithm
        self._expiration_minutes = expiration_minutes

    def create_access_token(self, user_id: UUID) -> str:
        """Create a JWT access token for the given user ID."""
        now = datetime.now(tz=UTC)
        payload = {
            "sub": str(user_id),
            "iat": now,
            "exp": now + timedelta(minutes=self._expiration_minutes),
        }
        return jwt.encode(payload, self._secret_key, algorithm=self._algorithm)

    def decode_access_token(self, token: str) -> UUID:
        """Decode a JWT access token and return the user ID."""
        try:
            payload = jwt.decode(token, self._secret_key, algorithms=[self._algorithm])
            return UUID(payload["sub"])
        except (jwt.InvalidTokenError, KeyError, ValueError) as exc:
            raise ValueError("Invalid or expired token") from exc
