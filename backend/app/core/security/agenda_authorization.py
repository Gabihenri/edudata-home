"""Server-side membership and resource authorization for Agenda EDI.

All identity values come from the validated Supabase Auth dependency. Requested
organization/school IDs are treated only as selectors and must match a current
membership in the database. Database errors fail closed.
"""
from __future__ import annotations

from typing import Any, Mapping

from fastapi import HTTPException

from app.core.security.agenda_access_policy import can_access_agenda_event
from app.core.security.membership_context import (
    MembershipContextError,
    select_membership_context,
)
from app.services.supabase_service import supabase


def _load_memberships(
    *,
    user_id: str,
    organization_id: str,
    school_id: str | None,
) -> list[dict[str, Any]]:
    """Load only memberships belonging to the authenticated identity."""
    try:
        query = (
            supabase.table("organization_members")
            .select("*")
            .eq("user_id", user_id)
            .eq("organization_id", organization_id)
        )
        if school_id is not None:
            query = query.eq("school_id", school_id)
        response = query.execute()
        return [dict(row) for row in (response.data or [])]
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail="Não foi possível validar o vínculo institucional.",
        ) from exc


def require_membership(
    *,
    user_id: str,
    organization_id: str,
    school_id: str | None,
) -> dict[str, Any]:
    """Return one active, time-valid, unambiguous membership or deny."""
    rows = _load_memberships(
        user_id=user_id,
        organization_id=organization_id,
        school_id=school_id,
    )
    try:
        return select_membership_context(
            rows,
            user_id=user_id,
            organization_id=organization_id,
            school_id=school_id,
        )
    except MembershipContextError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.args[0],
        ) from exc


def authorize_event(
    *,
    authenticated_user: Mapping[str, Any],
    event: Mapping[str, Any],
    action: str,
) -> dict[str, Any]:
    """Authorize one persisted event using its database-resolved scope."""
    user_id = authenticated_user.get("id")
    organization_id = event.get("organization_id")
    school_id = event.get("school_id")

    if not isinstance(user_id, str) or not user_id.strip():
        raise HTTPException(status_code=401, detail="Identidade autenticada inválida.")
    if not isinstance(organization_id, str) or not organization_id.strip():
        raise HTTPException(status_code=403, detail="Evento sem escopo institucional válido.")
    if not isinstance(school_id, str) or not school_id.strip():
        raise HTTPException(status_code=403, detail="Evento sem escopo escolar válido.")

    membership = require_membership(
        user_id=user_id,
        organization_id=organization_id,
        school_id=school_id,
    )
    if not can_access_agenda_event(
        user_id=user_id,
        membership=membership,
        event=event,
        action=action,
    ):
        raise HTTPException(
            status_code=403,
            detail="Você não tem permissão para acessar este evento.",
        )
    return membership


def authorize_school_scope(
    *,
    authenticated_user: Mapping[str, Any],
    organization_id: str,
    school_id: str,
) -> dict[str, Any]:
    """Require explicit school-level read permission for school-wide queries."""
    user_id = authenticated_user.get("id")
    if not isinstance(user_id, str) or not user_id.strip():
        raise HTTPException(status_code=401, detail="Identidade autenticada inválida.")

    membership = require_membership(
        user_id=user_id,
        organization_id=organization_id,
        school_id=school_id,
    )
    if membership.get("can_view_school") is not True:
        raise HTTPException(
            status_code=403,
            detail="O vínculo não concede acesso à agenda completa da escola.",
        )
    return membership
