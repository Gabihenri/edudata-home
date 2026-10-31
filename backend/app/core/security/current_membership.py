"""FastAPI dependency that resolves the authenticated user's active institution."""
from typing import Any

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials

from app.core.security.current_user import CurrentUser, security
from app.core.security.membership_repository import load_active_membership


def get_current_membership(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: dict[str, Any] = Depends(CurrentUser.get),
) -> dict[str, Any]:
    """Resolve the membership using only the token and identity verified by Auth."""
    return load_active_membership(
        access_token=credentials.credentials,
        verified_user_id=current_user["id"],
    )
