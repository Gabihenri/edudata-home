"""Request-scoped, RLS-aware lookup of institutional memberships."""
import json
import os
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import HTTPException

from app.core.config import SUPABASE_URL
from app.core.security.membership_resolver import resolve_active_membership


# Deliberately do not fall back to SUPABASE_KEY: that legacy variable may hold
# a service_role secret, which must never be used for user-scoped authorization.
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

_MEMBERSHIP_COLUMNS = (
    "user_id,organization_id,school_id,role,status,"
    "access_starts_at,access_ends_at"
)


def load_active_membership(
    access_token: str,
    verified_user_id: str,
) -> dict[str, Any]:
    """Load and resolve the sole active membership under the user's JWT/RLS.

    The verified user id must come from Supabase Auth validation. The caller
    cannot provide organization, school, or role filters. A fresh HTTP request
    carries this request's bearer token; no shared Supabase client is mutated.
    """
    if not isinstance(access_token, str) or not access_token.strip():
        raise HTTPException(status_code=401, detail="Token não informado.")
    if not isinstance(verified_user_id, str) or not verified_user_id.strip():
        raise HTTPException(status_code=401, detail="Identidade autenticada inválida.")

    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=503,
            detail="Consulta de vínculo institucional indisponível.",
        )

    query = urlencode(
        {
            "select": _MEMBERSHIP_COLUMNS,
            "user_id": f"eq.{verified_user_id}",
        }
    )
    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/organization_members?{query}"
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
    except (HTTPError, URLError, TimeoutError, OSError, ValueError) as exc:
        raise HTTPException(
            status_code=503,
            detail="Consulta de vínculo institucional indisponível.",
        ) from exc

    if not isinstance(payload, list) or any(
        not isinstance(row, dict) for row in payload
    ):
        raise HTTPException(
            status_code=503,
            detail="Resposta inválida ao consultar vínculo institucional.",
        )

    return resolve_active_membership(
        user_id=verified_user_id,
        memberships=payload,
    )
