"""User-scoped Agenda reads that rely on Supabase RLS."""
import json
import os
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from fastapi import HTTPException

from app.core.config import SUPABASE_URL


SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")


def list_events_for_user(access_token: str, limit: int = 100) -> list[dict[str, Any]]:
    """Read visible events with the caller's JWT; database RLS is authoritative."""
    if not isinstance(access_token, str) or not access_token.strip():
        raise HTTPException(status_code=401, detail="Token não informado.")
    if not isinstance(limit, int) or isinstance(limit, bool) or not 1 <= limit <= 500:
        raise HTTPException(status_code=422, detail="Limite de eventos inválido.")
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=503,
            detail="Consulta da Agenda indisponível.",
        )

    query = urlencode(
        {
            "select": "*",
            "deleted_at": "is.null",
            "order": "start_at.asc",
            "limit": str(limit),
        }
    )
    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/agenda_events?{query}"
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
        # An explicit authorization failure is not converted into an empty list.
        if exc.code in (401, 403):
            raise HTTPException(
                status_code=403,
                detail="Acesso aos eventos da Agenda não autorizado.",
            ) from exc
        raise HTTPException(
            status_code=503,
            detail="Consulta da Agenda indisponível.",
        ) from exc
    except (URLError, TimeoutError, OSError, ValueError) as exc:
        raise HTTPException(
            status_code=503,
            detail="Consulta da Agenda indisponível.",
        ) from exc

    if not isinstance(payload, list) or any(
        not isinstance(row, dict) for row in payload
    ):
        raise HTTPException(
            status_code=503,
            detail="Resposta inválida ao consultar eventos da Agenda.",
        )
    return payload


def get_event_for_user(access_token: str, event_id: str) -> dict[str, Any] | None:
    """Read one visible, non-deleted event; RLS determines visibility."""
    if not isinstance(access_token, str) or not access_token.strip():
        raise HTTPException(status_code=401, detail="Token não informado.")
    if not isinstance(event_id, str) or not event_id.strip():
        raise HTTPException(status_code=422, detail="Identificador do evento inválido.")
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=503,
            detail="Consulta da Agenda indisponível.",
        )

    query = urlencode(
        {
            "select": "*",
            "id": f"eq.{event_id}",
            "deleted_at": "is.null",
            "limit": "1",
        }
    )
    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/agenda_events?{query}"
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
                status_code=403,
                detail="Acesso ao evento da Agenda não autorizado.",
            ) from exc
        raise HTTPException(
            status_code=503,
            detail="Consulta da Agenda indisponível.",
        ) from exc
    except (URLError, TimeoutError, OSError, ValueError) as exc:
        raise HTTPException(
            status_code=503,
            detail="Consulta da Agenda indisponível.",
        ) from exc

    if not isinstance(payload, list) or any(
        not isinstance(row, dict) for row in payload
    ):
        raise HTTPException(
            status_code=503,
            detail="Resposta inválida ao consultar evento da Agenda.",
        )
    if not payload:
        return None
    return payload[0]
