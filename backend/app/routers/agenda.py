from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials

from app.core.exceptions.exceptions import EduDataException
from app.core.security.current_membership import get_current_membership
from app.core.security.current_user import security
from app.repositories.agenda_read_repository import (
    create_event_for_user,
    dashboard_summary_for_user,
    get_event_for_user,
    list_events_for_school_for_user,
    list_events_for_teacher_for_user,
    list_events_for_user,
    update_event_for_user,
)
from app.core.responses.api_response import ApiResponse
from app.engine.context import EngineContext
from app.engine.pipelines.pipeline_engine import PipelineEngine
from app.services.agenda_service import AgendaService


router = APIRouter(
    prefix="/api/v1/agenda",
    tags=["Agenda Inteligente EDI"],
)


def build_engine_context(payload: dict[str, Any]) -> EngineContext:
    return EngineContext(
        organization_id=payload.get("organization_id"),
        school_id=payload.get("school_id"),
        user_id=payload.get("user_id"),
        module="agenda",
        role=payload.get("role"),
        metadata=payload.get("metadata", {}),
    )


@router.get("/")
def list_events(
    limit: int = Query(100, ge=1, le=500),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    _membership: dict[str, Any] = Depends(get_current_membership),
) -> dict[str, Any]:
    try:
        # The membership dependency establishes the authenticated institutional
        # context. The event query uses the same user's JWT so PostgreSQL RLS,
        # not a service-role client, decides which rows are visible.
        events = list_events_for_user(
            access_token=credentials.credentials,
            limit=limit,
        )

        return ApiResponse.success(
            data={"total": len(events), "items": events},
            message="Eventos listados com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.get("/dashboard/summary")
def dashboard_summary(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    _membership: dict[str, Any] = Depends(get_current_membership),
) -> dict[str, Any]:
    try:
        summary = dashboard_summary_for_user(
            access_token=credentials.credentials,
        )

        return ApiResponse.success(
            data=summary,
            message="Resumo da agenda carregado com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.get("/{event_id}")
def get_event(
    event_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    _membership: dict[str, Any] = Depends(get_current_membership),
) -> dict[str, Any]:
    try:
        event = get_event_for_user(
            access_token=credentials.credentials,
            event_id=event_id,
        )

        if not event:
            raise HTTPException(status_code=404, detail="Evento não encontrado.")

        return ApiResponse.success(
            data=event,
            message="Evento encontrado com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.get("/teacher/{teacher_id}")
def list_teacher_events(
    teacher_id: str,
    limit: int = Query(100, ge=1, le=500),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    _membership: dict[str, Any] = Depends(get_current_membership),
) -> dict[str, Any]:
    try:
        events = list_events_for_teacher_for_user(
            access_token=credentials.credentials,
            teacher_id=teacher_id,
            limit=limit,
        )

        return ApiResponse.success(
            data={"total": len(events), "items": events},
            message="Eventos do professor listados com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.get("/school/{school_id}")
def list_school_events(
    school_id: str,
    limit: int = Query(100, ge=1, le=500),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    _membership: dict[str, Any] = Depends(get_current_membership),
) -> dict[str, Any]:
    try:
        events = list_events_for_school_for_user(
            access_token=credentials.credentials,
            school_id=school_id,
            limit=limit,
        )

        return ApiResponse.success(
            data={"total": len(events), "items": events},
            message="Eventos da escola listados com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.get("/school/{school_id}/upcoming")
def upcoming_events(
    school_id: str,
    limit: int = Query(10, ge=1, le=50),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    _membership: dict[str, Any] = Depends(get_current_membership),
) -> dict[str, Any]:
    try:
        events = list_events_for_school_for_user(
            access_token=credentials.credentials,
            school_id=school_id,
            limit=limit,
            start_at_gte=datetime.now().astimezone().isoformat(),
        )

        return ApiResponse.success(
            data={"total": len(events), "items": events},
            message="Próximos eventos carregados com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.get("/school/{school_id}/between")
def events_between(
    school_id: str,
    start: datetime,
    end: datetime,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    _membership: dict[str, Any] = Depends(get_current_membership),
) -> dict[str, Any]:
    try:
        if end <= start:
            raise HTTPException(
                status_code=422,
                detail="A data final deve ser maior que a data inicial.",
            )
        events = list_events_for_school_for_user(
            access_token=credentials.credentials,
            school_id=school_id,
            start_at_gte=start.isoformat(),
            end_at_lte=end.isoformat(),
        )

        return ApiResponse.success(
            data={"total": len(events), "items": events},
            message="Eventos do período carregados com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.post("/")
def create_event(
    payload: dict[str, Any],
    credentials: HTTPAuthorizationCredentials = Depends(security),
    membership: dict[str, Any] = Depends(get_current_membership),
) -> dict[str, Any]:
    try:
        event = create_event_for_user(
            access_token=credentials.credentials,
            membership=membership,
            payload=payload,
        )
        trusted_payload = {
            **payload,
            "user_id": membership["user_id"],
            "organization_id": membership["organization_id"],
            "school_id": membership["school_id"],
            "role": membership.get("role"),
        }

        engine_result = PipelineEngine.execute(
            context=build_engine_context(trusted_payload),
            payload={
                **trusted_payload,
                "agenda_events": [event],
                "evidences": payload.get("evidences", []),
                "trainings": payload.get("trainings", []),
                "users": payload.get("users", []),
                "interactions": payload.get("interactions", []),
                "accepted_recommendations": payload.get(
                    "accepted_recommendations",
                    0,
                ),
            },
        )

        return ApiResponse.created(
            data={
                "event": event,
                "engine": engine_result,
            },
            message="Evento criado com sucesso e analisado pelo EDI Intelligence Engine.",
        )

    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.put("/{event_id}")
def update_event(
    event_id: str,
    payload: dict[str, Any],
    credentials: HTTPAuthorizationCredentials = Depends(security),
    membership: dict[str, Any] = Depends(get_current_membership),
) -> dict[str, Any]:
    try:
        event = update_event_for_user(
            access_token=credentials.credentials,
            event_id=event_id,
            payload=payload,
        )

        if not event:
            raise HTTPException(status_code=404, detail="Evento não encontrado.")

        trusted_payload = {
            **payload,
            "user_id": membership["user_id"],
            "organization_id": membership["organization_id"],
            "school_id": membership.get("school_id"),
            "role": membership.get("role"),
        }
        engine_result = PipelineEngine.execute(
            context=build_engine_context(trusted_payload),
            payload={
                **trusted_payload,
                "agenda_events": [event],
                "evidences": payload.get("evidences", []),
                "trainings": payload.get("trainings", []),
                "users": payload.get("users", []),
                "interactions": payload.get("interactions", []),
                "accepted_recommendations": payload.get(
                    "accepted_recommendations",
                    0,
                ),
            },
        )

        return ApiResponse.updated(
            data={
                "event": event,
                "engine": engine_result,
            },
            message="Evento atualizado com sucesso e analisado pelo EDI Intelligence Engine.",
        )

    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.patch("/{event_id}/status")
def change_status(
    event_id: str,
    status: str,
) -> dict[str, Any]:
    try:
        event = AgendaService.change_status(
            event_id=event_id,
            status=status,
        )

        if not event:
            raise HTTPException(status_code=404, detail="Evento não encontrado.")

        return ApiResponse.updated(
            data=event,
            message="Status do evento atualizado com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.delete("/{event_id}")
def delete_event(event_id: str) -> dict[str, Any]:
    try:
        deleted = AgendaService.delete(event_id)

        if not deleted:
            raise HTTPException(status_code=404, detail="Evento não encontrado.")

        return ApiResponse.deleted(
            message="Evento removido com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)