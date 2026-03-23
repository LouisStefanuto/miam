"""Authentication routes."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status

from miam.api.deps import (
    AuthSettings,
    get_auth_service,
    get_auth_settings,
    get_current_user_id,
)
from miam.domain.schemas import GoogleLoginRequest, TokenResponse
from miam.domain.services import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_NAME = "miam_auth_token"
COOKIE_PATH = "/api"


def _set_auth_cookie(response: Response, token: str, max_age: int) -> None:
    """Set the JWT as an HttpOnly cookie on the response."""
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        max_age=max_age,
        httponly=True,
        secure=True,
        samesite="lax",
        path=COOKIE_PATH,
    )


@router.post("/google")
def login_google(
    request: GoogleLoginRequest,
    response: Response,
    service: Annotated[AuthService, Depends(get_auth_service)],
    settings: Annotated[AuthSettings, Depends(get_auth_settings)],
) -> TokenResponse:
    """Authenticate with a Google ID token and return a JWT."""
    try:
        token = service.login_with_google(request.id_token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)
        ) from exc
    _set_auth_cookie(response, token, max_age=settings.jwt_expiration_minutes * 60)
    return TokenResponse(access_token=token)


@router.get("/me")
def get_me(
    user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> dict[str, str]:
    """Verify the current session is valid."""
    return {"user_id": str(user_id)}


@router.post("/logout")
def logout(response: Response) -> dict[str, str]:
    """Clear the auth cookie."""
    response.delete_cookie(
        key=COOKIE_NAME,
        httponly=True,
        secure=True,
        samesite="lax",
        path=COOKIE_PATH,
    )
    return {"detail": "logged out"}
