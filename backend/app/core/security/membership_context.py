"""Pure membership-context selection helpers.

This module deliberately does not grant permissions. It selects one active,
time-valid organization_members row for an explicitly requested organization
and (when supplied) exact school. Role, hierarchy and scope permissions must
be evaluated by a separate policy layer before any resource operation.
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Iterable, Mapping


class MembershipContextError(Exception):
    """A fail-closed membership selection error with a stable reason code."""

    def __init__(self, code: str, message: str, status_code: int = 403) -> None:
        super().__init__(message)
        self.code = code
        self.status_code = status_code


def _timestamp(value: Any) -> datetime | None:
    if value is None or value == "":
        return None
    if isinstance(value, datetime):
        parsed = value
    elif isinstance(value, str):
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError as exc:
            raise MembershipContextError(
                "MEMBERSHIP_INACTIVE",
                "Vigência do vínculo inválida.",
            ) from exc
    else:
        raise MembershipContextError(
            "MEMBERSHIP_INACTIVE",
            "Vigência do vínculo inválida.",
        )

    if parsed.tzinfo is None:
        # Database timestamps should carry timezone information. Reject naive
        # values rather than interpreting them in the server's local timezone.
        raise MembershipContextError(
            "MEMBERSHIP_INACTIVE",
            "Vigência do vínculo sem fuso horário.",
        )
    return parsed.astimezone(timezone.utc)


def _is_active_at(
    membership: Mapping[str, Any],
    now: datetime,
) -> bool:
    if str(membership.get("status", "")).strip().lower() != "active":
        return False

    starts_at = _timestamp(membership.get("access_starts_at"))
    ends_at = _timestamp(membership.get("access_ends_at"))
    if starts_at is not None and now < starts_at:
        return False
    if ends_at is not None and now >= ends_at:
        return False
    return True


def select_membership_context(
    memberships: Iterable[Mapping[str, Any]],
    *,
    user_id: str,
    organization_id: str,
    school_id: str | None = None,
    now: datetime | None = None,
) -> dict[str, Any]:
    """Select exactly one active membership for an explicit context.

    Raises MembershipContextError instead of guessing when no match exists or
    multiple memberships could apply. This function performs no database I/O.
    """
    if not isinstance(user_id, str) or not user_id.strip():
        raise MembershipContextError(
            "IDENTITY_NOT_HOMOLOGATED",
            "Identidade autenticada inválida.",
            401,
        )
    if not isinstance(organization_id, str) or not organization_id.strip():
        raise MembershipContextError(
            "SCOPE_MISMATCH",
            "A organização de contexto precisa ser informada.",
            400,
        )

    instant = now or datetime.now(timezone.utc)
    if instant.tzinfo is None:
        raise ValueError("now precisa conter fuso horário")
    instant = instant.astimezone(timezone.utc)

    rows = [
        dict(row)
        for row in memberships
        if row.get("user_id") == user_id
        and row.get("organization_id") == organization_id
    ]
    if not rows:
        raise MembershipContextError(
            "MEMBERSHIP_NOT_FOUND",
            "Não existe vínculo para a organização solicitada.",
        )

    if school_id is not None:
        scoped_rows = [row for row in rows if row.get("school_id") == school_id]
        if not scoped_rows:
            raise MembershipContextError(
                "SCOPE_MISMATCH",
                "O vínculo não corresponde à escola solicitada.",
            )
        rows = scoped_rows

    active_rows = []
    inactive_due_to_invalidity = False
    for row in rows:
        try:
            if _is_active_at(row, instant):
                active_rows.append(row)
        except MembershipContextError:
            inactive_due_to_invalidity = True

    if not active_rows:
        detail = (
            "O vínculo possui status ou vigência inválidos."
            if inactive_due_to_invalidity
            else "Não há vínculo ativo e vigente para o contexto solicitado."
        )
        raise MembershipContextError("MEMBERSHIP_INACTIVE", detail)

    if len(active_rows) != 1:
        raise MembershipContextError(
            "AMBIGUOUS_MEMBERSHIP",
            "Há múltiplos vínculos possíveis; o contexto precisa ser desambiguado.",
            409,
        )

    return active_rows[0]
