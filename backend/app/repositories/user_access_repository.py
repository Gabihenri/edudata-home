"""Request-scoped, RLS-aware user directory reads."""
import json
import os
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import HTTPException

from app.core.config import SUPABASE_URL
from app.core.permissions.permissions import Permission


SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

_USER_COLUMNS = (
    "id,school_id,organization_id,full_name,email,phone,avatar_url,"
    "role,active,email_verified,last_login,created_at,updated_at"
)


def _request(
    access_token: str,
    query: dict[str, str],
) -> list[dict[str, Any]]:
    if not isinstance(access_token, str) or not access_token.strip():
        raise HTTPException(status_code=401, detail="Token não informado.")

    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=503,
            detail="Consulta de usuários indisponível.",
        )

    endpoint = (
        f"{SUPABASE_URL.rstrip('/')}/rest/v1/users?"
        f"{urlencode(query)}"
    )
    request = Request(
        endpoint,
        headers={
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
        },
        method="GET",
    )

    try:
        with urlopen(request, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        if exc.code in (401, 403):
            raise HTTPException(
                status_code=exc.code,
                detail="Acesso aos usuários negado pela política de segurança.",
            ) from exc
        raise HTTPException(
            status_code=503,
            detail="Consulta de usuários indisponível.",
        ) from exc
    except (URLError, TimeoutError, OSError, ValueError) as exc:
        raise HTTPException(
            status_code=503,
            detail="Consulta de usuários indisponível.",
        ) from exc

    if not isinstance(payload, list) or any(
        not isinstance(item, dict) for item in payload
    ):
        raise HTTPException(
            status_code=503,
            detail="Resposta inválida ao consultar usuários.",
        )

    return payload


def _require_user_management(membership: dict[str, Any]) -> None:
    if not Permission.membership_can_manage_users(membership):
        raise HTTPException(
            status_code=403,
            detail="Vínculo sem permissão para administrar usuários.",
        )


def list_users_for_membership(
    access_token: str,
    membership: dict[str, Any],
    limit: int = 100,
) -> list[dict[str, Any]]:
    """List only users inside the active membership's authorized scope."""
    _require_user_management(membership)

    if not isinstance(limit, int) or isinstance(limit, bool) or not 1 <= limit <= 200:
        raise HTTPException(status_code=422, detail="Limite de consulta inválido.")

    organization_id = membership.get("organization_id")
    school_id = membership.get("school_id")
    if not isinstance(organization_id, str) or not organization_id.strip():
        raise HTTPException(status_code=403, detail="Escopo institucional inválido.")

    filters = {
        "select": _USER_COLUMNS,
        "organization_id": f"eq.{organization_id}",
        "order": "full_name.asc",
        "limit": str(limit),
    }

    # A school scope is narrower and takes precedence whenever present.
    if isinstance(school_id, str) and school_id.strip():
        filters["school_id"] = f"eq.{school_id}"

    return _request(access_token, filters)


def get_user_for_membership(
    access_token: str,
    membership: dict[str, Any],
    user_id: str,
) -> dict[str, Any] | None:
    """Find a user only within the administrator's active institution/school."""
    _require_user_management(membership)

    organization_id = membership.get("organization_id")
    school_id = membership.get("school_id")
    if not isinstance(organization_id, str) or not organization_id.strip():
        raise HTTPException(status_code=403, detail="Escopo institucional inválido.")
    if not isinstance(user_id, str) or not user_id.strip():
        raise HTTPException(status_code=422, detail="Identificador de usuário inválido.")

    filters = {
        "select": _USER_COLUMNS,
        "id": f"eq.{user_id}",
        "organization_id": f"eq.{organization_id}",
        "limit": "1",
    }
    if isinstance(school_id, str) and school_id.strip():
        filters["school_id"] = f"eq.{school_id}"

    records = _request(access_token, filters)
    return records[0] if records else None
