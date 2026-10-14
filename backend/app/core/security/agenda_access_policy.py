"""Fail-closed, pure authorization policy for Agenda EDI records.

This module does not authenticate users or query the database. Callers must
supply a freshly validated active membership and the persisted event row.
Unknown scopes and unrecognized operations are denied by default.

Policy intentionally grants only:
- read of one's own event within the active membership context;
- read of same-school events when the membership explicitly has can_view_school;
- create/update/delete of one's own event, within the exact active org/school.

Team/network permissions require hierarchy and scope resolution against trusted
server-side data and are not inferred from role names or client-supplied IDs.
"""
from __future__ import annotations

from typing import Any, Mapping


READ_ACTIONS = frozenset({"read", "list", "summary"})
WRITE_ACTIONS = frozenset({"create", "update", "delete"})


def _same_nonempty(left: Any, right: Any) -> bool:
    return (
        isinstance(left, str)
        and bool(left.strip())
        and isinstance(right, str)
        and bool(right.strip())
        and left == right
    )


def can_access_agenda_event(
    *,
    user_id: str,
    membership: Mapping[str, Any],
    event: Mapping[str, Any],
    action: str,
) -> bool:
    """Return whether an event operation is allowed by the minimal policy.

    The caller is responsible for authenticating user_id and verifying
    membership status and access dates. This function checks membership/event
    scope and explicit permission flags, never role labels alone.
    """
    if not isinstance(user_id, str) or not user_id.strip():
        return False
    if not isinstance(membership, Mapping) or not isinstance(event, Mapping):
        return False
    if action not in READ_ACTIONS and action not in WRITE_ACTIONS:
        return False

    if str(membership.get("status", "")).strip().lower() != "active":
        return False

    organization_id = membership.get("organization_id")
    school_id = membership.get("school_id")
    if not _same_nonempty(organization_id, event.get("organization_id")):
        return False

    # A membership bound to a school cannot authorize another school's data.
    if school_id is not None and not _same_nonempty(school_id, event.get("school_id")):
        return False

    owner_id = event.get("user_id")
    is_owner = _same_nonempty(user_id, owner_id)
    if action in WRITE_ACTIONS:
        # Management write permissions are intentionally not inferred from
        # can_view_* flags or role names.
        return is_owner and (
            school_id is None
            or _same_nonempty(school_id, event.get("school_id"))
        )

    if is_owner:
        return True

    # Wider read access requires an explicit school-level permission and a
    # school-scoped membership. Network/team claims alone are insufficient
    # without a separately resolved trusted scope.
    return (
        membership.get("can_view_school") is True
        and _same_nonempty(school_id, event.get("school_id"))
    )
