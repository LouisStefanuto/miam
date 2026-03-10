"""Google ID token verification using google-auth library."""

from google.auth.transport import requests
from google.oauth2 import id_token

from miam.domain.entities import GoogleUserInfo
from miam.domain.ports_secondary import GoogleTokenVerifierPort


class GoogleTokenVerifier(GoogleTokenVerifierPort):
    """Verify Google ID tokens against Google's public keys."""

    def __init__(self, client_id: str):
        self._client_id = client_id

    def verify(self, token: str) -> GoogleUserInfo:
        """Verify a Google ID token and return user info."""
        try:
            idinfo = id_token.verify_oauth2_token(  # type: ignore[no-untyped-call]
                token, requests.Request(), self._client_id
            )
        except ValueError as exc:
            raise ValueError(f"Invalid Google token: {exc}") from exc

        if not idinfo.get("email_verified"):
            raise ValueError("Google email not verified")

        return GoogleUserInfo(
            email=idinfo["email"],
            name=idinfo["name"],
            google_id=idinfo["sub"],
            picture=idinfo.get("picture"),
        )
