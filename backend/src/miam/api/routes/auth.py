"""Authentication routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from miam.api.deps import get_auth_service
from miam.domain.schemas import GoogleLoginRequest, TokenResponse
from miam.domain.services import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/google")
def login_google(
    request: GoogleLoginRequest,
    service: Annotated[AuthService, Depends(get_auth_service)],
) -> TokenResponse:
    """Authenticate with a Google ID token and return a JWT."""
    try:
        token = service.login_with_google(request.id_token)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)
        ) from exc
    return TokenResponse(access_token=token)
