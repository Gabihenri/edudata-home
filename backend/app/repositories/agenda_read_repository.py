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


def dashboard_summary_for_user(access_token: str) -> dict[str, int]:
    """Aggregate only Agenda events visible to the authenticated caller."""
    from datetime import datetime, timezone

    events = list_events_for_user(access_token=access_token, limit=500)
    now = datetime.now(timezone.utc)
    planned_statuses = {"planned", "planejado", "planejada"}
    completed_statuses = {"completed", "concluido", "concluído"}
    cancelled_statuses = {"cancelled", "canceled", "cancelado", "cancelada"}

    planned = completed = cancelled = upcoming = 0
    for event in events:
        status = str(event.get("status") or "").strip().lower()
        planned += status in planned_statuses
        completed += status in completed_statuses
        cancelled += status in cancelled_statuses

        start_value = event.get("start_at") or event.get("start_datetime")
        if start_value:
            try:
                start = datetime.fromisoformat(
                    str(start_value).replace("Z", "+00:00")
                )
                if start.tzinfo is None:
                    start = start.replace(tzinfo=timezone.utc)
                upcoming += start >= now
            except ValueError:
                # Malformed timestamps are excluded from the upcoming count.
                continue

    return {
        "total_events": len(events),
        "planned": planned,
        "completed": completed,
        "cancelled": cancelled,
        "upcoming": upcoming,
    }


def list_events_for_teacher_for_user(
    access_token: str,
    teacher_id: str,
    limit: int = 100,
) -> list[dict[str, Any]]:
    """Filter by teacher while relying on caller JWT and RLS for authorization."""
    if not isinstance(access_token, str) or not access_token.strip():
        raise HTTPException(status_code=401, detail="Token não informado.")
    if not isinstance(teacher_id, str) or not teacher_id.strip():
        raise HTTPException(status_code=422, detail="Identificador do professor inválido.")
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
            "user_id": f"eq.{teacher_id}",
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
        if exc.code in (401, 403):
            raise HTTPException(
                status_code=403,
                detail="Acesso aos eventos do professor não autorizado.",
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
            detail="Resposta inválida ao consultar eventos do professor.",
        )
    return payload


def list_events_for_school_for_user(
    access_token: str,
    school_id: str,
    limit: int = 100,
    start_at_gte: str | None = None,
    end_at_lte: str | None = None,
) -> list[dict[str, Any]]:
    """Filter by school; the caller JWT and database RLS remain authoritative."""
    if not isinstance(access_token, str) or not access_token.strip():
        raise HTTPException(status_code=401, detail="Token não informado.")
    if not isinstance(school_id, str) or not school_id.strip():
        raise HTTPException(status_code=422, detail="Identificador da escola inválido.")
    if not isinstance(limit, int) or isinstance(limit, bool) or not 1 <= limit <= 500:
        raise HTTPException(status_code=422, detail="Limite de eventos inválido.")
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=503,
            detail="Consulta da Agenda indisponível.",
        )

    filters = {
        "select": "*",
        "school_id": f"eq.{school_id}",
        "deleted_at": "is.null",
        "order": "start_at.asc",
        "limit": str(limit),
    }
    if start_at_gte is not None:
        filters["start_at"] = f"gte.{start_at_gte}"
    if end_at_lte is not None:
        filters["end_at"] = f"lte.{end_at_lte}"
    query = urlencode(filters)
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
                detail="Acesso aos eventos da escola não autorizado.",
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
            detail="Resposta inválida ao consultar eventos da escola.",
        )
    return payload


def create_event_for_user(
    access_token: str,
    membership: dict[str, Any],
    payload: dict[str, Any],
) -> dict[str, Any]:
    """Create an event with identity and institutional scope from verified membership."""
    if not isinstance(access_token, str) or not access_token.strip():
        raise HTTPException(status_code=401, detail="Token não informado.")
    if not isinstance(membership, dict):
        raise HTTPException(status_code=403, detail="Vínculo institucional inválido.")
    user_id = membership.get("user_id")
    organization_id = membership.get("organization_id")
    school_id = membership.get("school_id")
    if not user_id or not organization_id or not school_id:
        raise HTTPException(
            status_code=403,
            detail="Vínculo institucional sem escopo de escola válido.",
        )
    if not isinstance(payload, dict):
        raise HTTPException(status_code=422, detail="Dados do evento inválidos.")

    allowed_fields = {
        "title",
        "description",
        "event_type",
        "start_at",
        "end_at",
        "status",
        "priority",
    }
    unknown_fields = set(payload) - allowed_fields
    if unknown_fields:
        raise HTTPException(
            status_code=422,
            detail="O evento contém campos não permitidos.",
        )
    required_fields = ("title", "event_type", "start_at")
    if any(not payload.get(field) for field in required_fields):
        raise HTTPException(
            status_code=422,
            detail="Título, tipo e início do evento são obrigatórios.",
        )
    event_data = {
        **payload,
        "user_id": user_id,
        "organization_id": organization_id,
        "school_id": school_id,
    }
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=503,
            detail="Gravação da Agenda indisponível.",
        )

    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/agenda_events"
    request = Request(
        endpoint,
        data=json.dumps(event_data).encode("utf-8"),
        headers={
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=10) as response:
            result = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        if exc.code in (401, 403):
            raise HTTPException(
                status_code=403,
                detail="Criação do evento não autorizada.",
            ) from exc
        if exc.code == 400 or exc.code == 422:
            raise HTTPException(
                status_code=422,
                detail="Dados do evento incompatíveis com o contrato da Agenda.",
            ) from exc
        raise HTTPException(
            status_code=503,
            detail="Gravação da Agenda indisponível.",
        ) from exc
    except (URLError, TimeoutError, OSError, ValueError) as exc:
        raise HTTPException(
            status_code=503,
            detail="Gravação da Agenda indisponível.",
        ) from exc

    if not isinstance(result, list) or not result or not isinstance(result[0], dict):
        raise HTTPException(
            status_code=503,
            detail="Resposta inválida ao criar evento da Agenda.",
        )
    return result[0]


def update_event_for_user(
    access_token: str,
    event_id: str,
    payload: dict[str, Any],
) -> dict[str, Any] | None:
    """Update editable event fields; Supabase RLS authorizes the target row."""
    if not isinstance(access_token, str) or not access_token.strip():
        raise HTTPException(status_code=401, detail="Token não informado.")
    if not isinstance(event_id, str) or not event_id.strip():
        raise HTTPException(status_code=422, detail="Identificador do evento inválido.")
    if not isinstance(payload, dict) or not payload:
        raise HTTPException(status_code=422, detail="Nenhum campo para atualização.")
    allowed_fields = {
        "title",
        "description",
        "event_type",
        "start_at",
        "end_at",
        "status",
        "priority",
    }
    if set(payload) - allowed_fields:
        raise HTTPException(
            status_code=422,
            detail="A atualização contém campos não permitidos.",
        )
    if "title" in payload and not str(payload["title"]).strip():
        raise HTTPException(status_code=422, detail="O título não pode ficar vazio.")
    if "event_type" in payload and not str(payload["event_type"]).strip():
        raise HTTPException(status_code=422, detail="O tipo do evento não pode ficar vazio.")
    if "start_at" in payload and not payload["start_at"]:
        raise HTTPException(status_code=422, detail="O início do evento é obrigatório.")

    if "start_at" in payload and "end_at" in payload and payload["end_at"]:
        from datetime import datetime

        try:
            start = datetime.fromisoformat(
                str(payload["start_at"]).replace("Z", "+00:00")
            )
            end = datetime.fromisoformat(
                str(payload["end_at"]).replace("Z", "+00:00")
            )
        except ValueError as exc:
            raise HTTPException(
                status_code=422,
                detail="Data/hora do evento inválida.",
            ) from exc
        if start.tzinfo is None:
            start = start.astimezone()
        if end.tzinfo is None:
            end = end.astimezone()
        if end <= start:
            raise HTTPException(
                status_code=422,
                detail="A data/hora final deve ser maior que a inicial.",
            )

    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=503,
            detail="Atualização da Agenda indisponível.",
        )

    query = urlencode({
        "id": f"eq.{event_id}",
        "deleted_at": "is.null",
    })
    endpoint = (
        f"{SUPABASE_URL.rstrip('/')}/rest/v1/agenda_events?{query}"
    )
    request = Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
        method="PATCH",
    )
    try:
        with urlopen(request, timeout=10) as response:
            result = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        if exc.code in (401, 403):
            raise HTTPException(
                status_code=403,
                detail="Atualização do evento não autorizada.",
            ) from exc
        if exc.code in (400, 422):
            raise HTTPException(
                status_code=422,
                detail="Dados incompatíveis com o contrato da Agenda.",
            ) from exc
        raise HTTPException(
            status_code=503,
            detail="Atualização da Agenda indisponível.",
        ) from exc
    except (URLError, TimeoutError, OSError, ValueError) as exc:
        raise HTTPException(
            status_code=503,
            detail="Atualização da Agenda indisponível.",
        ) from exc

    if not isinstance(result, list) or any(
        not isinstance(row, dict) for row in result
    ):
        raise HTTPException(
            status_code=503,
            detail="Resposta inválida ao atualizar evento da Agenda.",
        )
    if not result:
        return None
    return result[0]

def change_event_status_for_user(
    access_token: str,
    event_id: str,
    status: str,
) -> dict[str, Any] | None:
    """Change an event status with the caller JWT; Supabase RLS authorizes the row."""
    allowed_statuses = {"planned", "completed", "cancelled"}
    if not isinstance(status, str) or status not in allowed_statuses:
        raise HTTPException(
            status_code=422,
            detail="Status do evento inválido.",
        )
    return update_event_for_user(
        access_token=access_token,
        event_id=event_id,
        payload={"status": status},
    )

def soft_delete_event_for_user(
    access_token: str,
    event_id: str,
    reason: str,
) -> dict[str, Any]:
    """Soft-delete an event through the audited RPC using the caller JWT."""
    if not isinstance(access_token, str) or not access_token.strip():
        raise HTTPException(status_code=401, detail="Token não informado.")
    if not isinstance(event_id, str) or not event_id.strip():
        raise HTTPException(status_code=422, detail="Identificador do evento inválido.")
    if not isinstance(reason, str) or not reason.strip():
        raise HTTPException(status_code=422, detail="O motivo da exclusão é obrigatório.")
    if len(reason.strip()) > 1000:
        raise HTTPException(status_code=422, detail="O motivo da exclusão é muito longo.")
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(
            status_code=503,
            detail="Exclusão da Agenda indisponível.",
        )

    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/rpc/soft_delete_agenda_record"
    request = Request(
        endpoint,
        data=json.dumps({
            "requested_resource_type": "agenda_events",
            "requested_resource_id": event_id,
            "requested_reason": reason.strip(),
        }).encode("utf-8"),
        headers={
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=10) as response:
            result = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        try:
            error = json.loads(exc.read().decode("utf-8"))
        except (ValueError, OSError):
            error = {}
        code = error.get("code") if isinstance(error, dict) else None
        if exc.code == 401:
            raise HTTPException(
                status_code=401,
                detail="Token não autorizado para excluir o evento.",
            ) from exc
        if code == "P0002":
            raise HTTPException(
                status_code=404,
                detail="Evento não encontrado.",
            ) from exc
        if code == "42501" or exc.code == 403:
            raise HTTPException(
                status_code=403,
                detail="Exclusão do evento não autorizada.",
            ) from exc
        if code == "22023" or exc.code in (400, 422):
            raise HTTPException(
                status_code=422,
                detail="Motivo ou dados da exclusão inválidos.",
            ) from exc
        raise HTTPException(
            status_code=503,
            detail="Exclusão da Agenda indisponível.",
        ) from exc
    except (URLError, TimeoutError, OSError, ValueError) as exc:
        raise HTTPException(
            status_code=503,
            detail="Exclusão da Agenda indisponível.",
        ) from exc

    if not isinstance(result, dict):
        raise HTTPException(
            status_code=503,
            detail="Resposta inválida ao excluir evento da Agenda.",
        )
    return result
