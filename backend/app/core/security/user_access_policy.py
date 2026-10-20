"""Fail-closed authorization policy for internal user profiles.

Callers must authenticate the actor, load a current membership from the database,
and pass a persisted target row. Client-supplied roles and scopes are untrusted.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Mapping

READ_ACTIONS = frozenset({"read", "list", "lookup"})
MANAGE_ACTIONS = frozenset({"create", "update", "activate", "deactivate"})


def _same_nonempty(left: Any, right: Any) -> bool:
    return (
        isinstance(left, str) and bool(left.strip())
        and isinstance(right, str) and bool(right.strip())
        and left == right
    )


def _membership_is_current(membership: Mapping[str, Any]) -> bool:
    if str(membership.get("status", "")).strip().lower() != "active":
        return False
    now = datetime.now(timezone.utc)
    for field, is_start in (("access_starts_at", True), ("access_ends_at", False)):
        value = membership.get(field)
        if value in (None, ""):
            continue
        try:
            parsed = value if isinstance(value, datetime) else datetime.fromisoformat(
                str(value).replace("Z", "+00:00")
            )
        except (TypeError, ValueError):
            return False
        if parsed.tzinfo is None:
            return False
        parsed = parsed.astimezone(timezone.utc)
        if is_start and now < parsed:
            return False
        if not is_start and now >= parsed:
            return False
    return True


def can_access_user(
    *,
    authenticated_user_id: str,
    membership: Mapping[str, Any] | None,
    target_user: Mapping[str, Any] | None,
    action: str,
) -> bool:
    """Allow own-profile reads; wider access requires explicit scoped permission."""
    if not isinstance(authenticated_user_id, str) or not authenticated_user_id.strip():
        return False
    if not isinstance(action, str) or action not in READ_ACTIONS | MANAGE_ACTIONS:
        return False
    if not isinstance(target_user, Mapping):
        return False

    is_self = _same_nonempty(authenticated_user_id, target_user.get("auth_provider_id"))
    if action in READ_ACTIONS and is_self:
        return True
    if not isinstance(membership, Mapping) or not _membership_is_current(membership):
        return False
    if not _same_nonempty(authenticated_user_id, membership.get("user_id")):
        return False
    if membership.get("can_manage_users") is not True:
        return False
    if not _same_nonempty(target_user.get("organization_id"), membership.get("organization_id")):
        return False

    # User-management permission is school-scoped: missing scope on either
    # persisted record must deny access rather than widen the authorization.
    target_school = target_user.get("school_id")
    membership_school = membership.get("school_id")
    if not _same_nonempty(target_school, membership_school):
        return False
    if action in MANAGE_ACTIONS and is_self:
        return False
    return True
