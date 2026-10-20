"""Fail-closed authorization policy for internal user profiles.

This pure policy does not authenticate identities or load memberships. Callers
must provide a Supabase-authenticated actor, a fresh server-resolved active
membership, and a persisted target user row. Client-supplied roles and scopes
must never be passed as trusted authorization facts.
"""
from __future__ import annotations

from typing import Any, Mapping


READ_ACTIONS = frozenset({"read", "list", "lookup"})
MANAGE_ACTIONS = frozenset({"create", "update", "activate", "deactivate"})


def _same_nonempty(left: Any, right: Any) -> bool:
    return (
        isinstance(left, str)
        and bool(left.strip())
        and isinstance(right, str)
        and bool(right.strip())
        and left == right
    )


def can_access_user(
    *,
    authenticated_user_id: str,
    membership: Mapping[str, Any] | None,
    target_user: Mapping[str, Any] | None,
    action: str,
) -> bool:
    """Authorize a profile operation using trusted identity and scope.

    A user may read their own profile when the internal row is explicitly
    linked by auth_provider_id. All wider reads and all management operations
    require an active, time-valid membership with can_manage_users=True and
    exact organization scope. School-scoped targets additionally require the
    same school. Role names alone never grant permissions.
    """
    if not _same_nonempty(authenticated_user_id, authenticated_user_id):
        return False
    if not isinstance(action, str) or action not in READ_ACTIONS | MANAGE_ACTIONS:
        return False
    if not isinstance(target_user, Mapping):
        return False

    is_self = _same_nonempty(
        authenticated_user_id,
        target_user.get("auth_provider_id"),
    )
    if action in READ_ACTIONS and is_self:
        return True

    if not isinstance(membership, Mapping):
        return False
    if not _same_nonempty(authenticated_user_id, membership.get("user_id")):
        return False
    if str(membership.get("status", "")).strip().lower() != "active":
        return False
    if membership.get("can_manage_users") is not True:
        return False

    organization_id = target_user.get("organization_id")
    membership_organization_id = membership.get("organization_id")
    if not _same_nonempty(organization_id, membership_organization_id):
        return False

    target_school_id = target_user.get("school_id")
    membership_school_id = membership.get("school_id")
    if target_school_id is not None and not _same_nonempty(
        target_school_id,
        membership_school_id,
    ):
        return False

    # Managing one's own administrative profile is never permitted through
    # the user-management API, even if the membership has broad permissions.
    if action in MANAGE_ACTIONS and is_self:
        return False

    return True
