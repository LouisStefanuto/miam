"""API routes for recipe sharing operations."""

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Path, status
from pydantic import BaseModel

from miam.api.deps import get_current_user_id, get_recipe_share_service
from miam.domain.schemas import ShareRecipeRequest
from miam.domain.services import RecipeShareService

router = APIRouter(prefix="/shares", tags=["shares"])


class ShareResponse(BaseModel):
    id: UUID
    recipe_id: UUID
    shared_by_user_id: UUID
    shared_with_user_id: UUID
    shared_with_email: str | None = None
    shared_with_name: str | None = None
    role: str
    status: str
    created_at: datetime | None = None


class PendingShareResponse(BaseModel):
    id: UUID
    recipe_id: UUID
    recipe_title: str | None = None
    shared_by_name: str | None = None
    role: str
    created_at: datetime | None = None


class PendingShareCountResponse(BaseModel):
    count: int


@router.post("", status_code=status.HTTP_201_CREATED)
def share_recipe(
    data: ShareRecipeRequest,
    service: Annotated[RecipeShareService, Depends(get_recipe_share_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> ShareResponse:
    """Share a recipe with another user by email."""
    try:
        share = service.share_recipe(data.recipe_id, data.email, data.role, user_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    return ShareResponse(
        id=share.id,
        recipe_id=share.recipe_id,
        shared_by_user_id=share.shared_by_user_id,
        shared_with_user_id=share.shared_with_user_id,
        shared_with_email=share.shared_with_email,
        shared_with_name=share.shared_with_name,
        role=share.role.value,
        status=share.status.value,
        created_at=share.created_at,
    )


@router.get("/pending")
def get_pending_shares(
    service: Annotated[RecipeShareService, Depends(get_recipe_share_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> list[PendingShareResponse]:
    """List pending share invitations for the current user."""
    shares = service.get_pending_shares(user_id)
    return [
        PendingShareResponse(
            id=s.id,
            recipe_id=s.recipe_id,
            recipe_title=s.recipe_title,
            shared_by_name=s.shared_by_name,
            role=s.role.value,
            created_at=s.created_at,
        )
        for s in shares
    ]


@router.get("/pending/count")
def get_pending_shares_count(
    service: Annotated[RecipeShareService, Depends(get_recipe_share_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> PendingShareCountResponse:
    """Count pending share invitations for the current user."""
    count = service.get_pending_shares_count(user_id)
    return PendingShareCountResponse(count=count)


@router.post("/accept-all")
def accept_all_shares(
    service: Annotated[RecipeShareService, Depends(get_recipe_share_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> list[ShareResponse]:
    """Accept all pending share invitations."""
    shares = service.accept_all_shares(user_id)
    return [
        ShareResponse(
            id=s.id,
            recipe_id=s.recipe_id,
            shared_by_user_id=s.shared_by_user_id,
            shared_with_user_id=s.shared_with_user_id,
            shared_with_email=s.shared_with_email,
            shared_with_name=s.shared_with_name,
            role=s.role.value,
            status=s.status.value,
            created_at=s.created_at,
        )
        for s in shares
    ]


@router.post("/{share_id}/accept")
def accept_share(
    share_id: Annotated[UUID, Path()],
    service: Annotated[RecipeShareService, Depends(get_recipe_share_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> ShareResponse:
    """Accept a pending share invitation."""
    try:
        share = service.accept_share(share_id, user_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    return ShareResponse(
        id=share.id,
        recipe_id=share.recipe_id,
        shared_by_user_id=share.shared_by_user_id,
        shared_with_user_id=share.shared_with_user_id,
        shared_with_email=share.shared_with_email,
        shared_with_name=share.shared_with_name,
        role=share.role.value,
        status=share.status.value,
        created_at=share.created_at,
    )


@router.post("/{share_id}/reject")
def reject_share(
    share_id: Annotated[UUID, Path()],
    service: Annotated[RecipeShareService, Depends(get_recipe_share_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> ShareResponse:
    """Reject a pending share invitation."""
    try:
        share = service.reject_share(share_id, user_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)
        ) from exc
    return ShareResponse(
        id=share.id,
        recipe_id=share.recipe_id,
        shared_by_user_id=share.shared_by_user_id,
        shared_with_user_id=share.shared_with_user_id,
        shared_with_email=share.shared_with_email,
        shared_with_name=share.shared_with_name,
        role=share.role.value,
        status=share.status.value,
        created_at=share.created_at,
    )


@router.delete("/{share_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_share(
    share_id: Annotated[UUID, Path()],
    service: Annotated[RecipeShareService, Depends(get_recipe_share_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> None:
    """Remove a share (owner revokes or shared user leaves)."""
    try:
        deleted = service.remove_share(share_id, user_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)
        ) from exc
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Share not found"
        )


@router.delete("/recipe/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def leave_recipe(
    recipe_id: Annotated[UUID, Path()],
    service: Annotated[RecipeShareService, Depends(get_recipe_share_service)],
    user_id: Annotated[UUID, Depends(get_current_user_id)],
) -> None:
    """Remove yourself from a shared recipe."""
    deleted = service.leave_recipe(recipe_id, user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Share not found"
        )
