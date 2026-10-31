"""Fail-closed resolution of institutional membership for a verified user."""
from datetime import datetime, timezone
from typing import Any, Iterable

from fastapi import HTTPException


def _parse_timestamp(value: Any) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        parsed = value
    elif isinstance(value, str):
        normalized = value.strip()
        if not normalized:
            return None
        try:
            parsed = datetime.fromisoformat(normalized.replace("Z", "+00:00"))
        except ValueError as exc:
            raise ValueError("Invalid membership access timestamp") from exc
    else:
        raise ValueError("Invalid membership access timestamp")

    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _is_active_for_user(
    membership: dict[str, Any],
    user_id: str,
    now: datetime,
) -> bool:
    if membership.get("user_id") != user_id:
        return False
    if membership.get("status") != "active":
        return False

    try:
        starts_at = _parse_timestamp(membership.get("access_starts_at"))
        ends_at = _parse_timestamp(membership.get("access_ends_at"))
    except ValueError:
        return False

    if starts_at is not None and starts_at > now:
        return False
    if ends_at is not None and ends_at <= now:
        return False

    return bool(membership.get("organization_id")) and bool(
        membership.get("role")
    )


def resolve_active_membership(
    user_id: str,
    memberships: Iterable[dict[str, Any]],
    now: datetime | None = None,
) -> dict[str, Any]:
    """Return the sole active membership for a Supabase-verified user id.

    Zero active memberships are denied. Multiple active memberships are
    intentionally ambiguous until the caller supplies a separately authorized
    institution-selection flow; client-provided organization/school/role values
    are never accepted by this function.
    """
    if not isinstance(user_id, str) or not user_id.strip():
        raise HTTPException(status_code=401, detail="Identidade autenticada inválida.")

    current_time = now or datetime.now(timezone.utc)
    if current_time.tzinfo is None:
        current_time = current_time.replace(tzinfo=timezone.utc)
    current_time = current_time.astimezone(timezone.utc)

    active = [
        membership
        for membership in memberships
        if isinstance(membership, dict)
        and _is_active_for_user(membership, user_id, current_time)
    ]

    if not active:
        raise HTTPException(
            status_code=403,
            detail="Usuário não possui vínculo institucional ativo.",
        )

    if len(active) > 1:
        raise HTTPException(
            status_code=409,
            detail="Mais de um vínculo institucional ativo; selecione o contexto por fluxo autorizado.",
        )

    return dict(active[0])
