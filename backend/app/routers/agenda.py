from datetime import datetime
from typing import Any, Mapping

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.exceptions.exceptions import EduDataException
from app.core.responses.api_response import ApiResponse
from app.core.security.agenda_authorization import (
    authorize_event,
    authorize_school_scope,
)
from app.core.security.supabase_user import get_supabase_user
from app.engine.context import EngineContext
from app.engine.pipelines.pipeline_engine import PipelineEngine
from app.services.agenda_service import AgendaService


router = APIRouter(
    prefix="/api/v1/agenda",
    tags=["Agenda Inteligente EDI"],
)


def _user_id(authenticated_user: Mapping[str, Any]) -> str:
    user_id = authenticated_user.get("id")
    if not isinstance(user_id, str) or not user_id.strip():
        raise HTTPException(status_code=401, detail="Identidade autenticada inválida.")
    return user_id


def _filter_organization(
    events: list[dict[str, Any]],
    organization_id: str,
) -> list[dict[str, Any]]:
    return [
        event
        for event in events
        if event.get("organization_id") == organization_id
    ]


def _authorize_events(
    events: list[dict[str, Any]],
    authenticated_user: Mapping[str, Any],
    action: str = "read",
) -> list[dict[str, Any]]:
    # Fail closed rather than silently returning a partial result when a row
    # is outside the caller's authorized scope.
    for event in events:
        authorize_event(
            authenticated_user=authenticated_user,
            event=event,
            action=action,
        )
    return events


def _summary(events: list[dict[str, Any]]) -> dict[str, int]:
    now = datetime.now().astimezone()
    upcoming = 0
    for event in events:
        value = event.get("start_at")
        if not value:
            continue
        try:
            start_at = AgendaService._parse_datetime(value, "start_at")
        except Exception:
            continue
        if start_at >= now:
            upcoming += 1

    return {
        "total_events": len(events),
        "planned": sum(event.get("status") == "planned" for event in events),
        "completed": sum(event.get("status") == "completed" for event in events),
        "cancelled": sum(event.get("status") == "cancelled" for event in events),
        "upcoming": upcoming,
    }


def build_engine_context(
    payload: dict[str, Any],
    authenticated_user: Mapping[str, Any],
    membership: Mapping[str, Any],
) -> EngineContext:
    # Never use client-supplied identity, role, or metadata as authorization
    # context for the intelligence engine.
    return EngineContext(
        organization_id=membership.get("organization_id"),
        school_id=membership.get("school_id"),
        user_id=_user_id(authenticated_user),
        module="agenda",
        role=membership.get("role"),
        metadata={},
    )


@router.get("/")
def list_events(
    limit: int = Query(100, ge=1, le=500),
    authenticated_user: dict[str, Any] = Depends(get_supabase_user),
) -> dict[str, Any]:
    try:
        # The general list is intentionally restricted to the authenticated
        # user's own events. School-wide access uses the explicitly scoped
        # school endpoints below.
        events = AgendaService.list_by_teacher(
            teacher_id=_user_id(authenticated_user),
            limit=limit,
        )
        events = _authorize_events(events, authenticated_user)
        return ApiResponse.success(
            data={"total": len(events), "items": events},
            message="Eventos listados com sucesso.",
        )
    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.get("/dashboard/summary")
def dashboard_summary(
    organization_id: str = Query(..., min_length=1),
    school_id: str = Query(..., min_length=1),
    authenticated_user: dict[str, Any] = Depends(get_supabase_user),
) -> dict[str, Any]:
    try:
        authorize_school_scope(
            authenticated_user=authenticated_user,
            organization_id=organization_id,
            school_id=school_id,
        )
        events = AgendaService.list_by_school(school_id=school_id, limit=500)
        events = _filter_organization(events, organization_id)
        _authorize_events(events, authenticated_user)
        return ApiResponse.success(
            data=_summary(events),
            message="Resumo da agenda carregado com sucesso.",
        )
    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.get("/teacher/{teacher_id}")
def list_teacher_events(
    teacher_id: str,
    limit: int = Query(100, ge=1, le=500),
    authenticated_user: dict[str, Any] = Depends(get_supabase_user),
) -> dict[str, Any]:
    try:
        events = AgendaService.list_by_teacher(teacher_id=teacher_id, limit=limit)
        events = _authorize_events(events, authenticated_user)
        return ApiResponse.success(
            data={"total": len(events), "items": events},
            message="Eventos do professor listados com sucesso.",
        )
    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.get("/school/{school_id}")
def list_school_events(
    school_id: str,
    organization_id: str = Query(..., min_length=1),
    limit: int = Query(100, ge=1, le=500),
    authenticated_user: dict[str, Any] = Depends(get_supabase_user),
) -> dict[str, Any]:
    try:
        authorize_school_scope(
            authenticated_user=authenticated_user,
            organization_id=organization_id,
            school_id=school_id,
        )
        events = AgendaService.list_by_school(school_id=school_id, limit=limit)
        events = _filter_organization(events, organization_id)
        _authorize_events(events, authenticated_user)
        return ApiResponse.success(
            data={"total": len(events), "items": events},
            message="Eventos da escola listados com sucesso.",
        )
    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.get("/school/{school_id}/upcoming")
def upcoming_events(
    school_id: str,
    organization_id: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    authenticated_user: dict[str, Any] = Depends(get_supabase_user),
) -> dict[str, Any]:
    try:
        authorize_school_scope(
            authenticated_user=authenticated_user,
            organization_id=organization_id,
            school_id=school_id,
        )
        events = AgendaService.upcoming_events(school_id=school_id, limit=limit)
        events = _filter_organization(events, organization_id)
        _authorize_events(events, authenticated_user)
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
    organization_id: str = Query(..., min_length=1),
    authenticated_user: dict[str, Any] = Depends(get_supabase_user),
) -> dict[str, Any]:
    try:
        authorize_school_scope(
            authenticated_user=authenticated_user,
            organization_id=organization_id,
            school_id=school_id,
        )
        events = AgendaService.events_between(
            school_id=school_id,
            start=start,
            end=end,
        )
        events = _filter_organization(events, organization_id)
        _authorize_events(events, authenticated_user)
        return ApiResponse.success(
            data={"total": len(events), "items": events},
            message="Eventos do período carregados com sucesso.",
        )
    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.get("/{event_id}")
def get_event(
    event_id: str,
    authenticated_user: dict[str, Any] = Depends(get_supabase_user),
) -> dict[str, Any]:
    try:
        event = AgendaService.find_by_id(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Evento não encontrado.")
        authorize_event(
            authenticated_user=authenticated_user,
            event=event,
            action="read",
        )
        return ApiResponse.success(
            data=event,
            message="Evento encontrado com sucesso.",
        )
    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.post("/")
def create_event(
    payload: dict[str, Any],
    authenticated_user: dict[str, Any] = Depends(get_supabase_user),
) -> dict[str, Any]:
    try:
        user_id = _user_id(authenticated_user)
        organization_id = payload.get("organization_id")
        school_id = payload.get("school_id")
        if not isinstance(organization_id, str) or not organization_id.strip():
            raise HTTPException(status_code=400, detail="organization_id é obrigatório.")
        if not isinstance(school_id, str) or not school_id.strip():
            raise HTTPException(status_code=400, detail="school_id é obrigatório.")

        safe_payload = {
            **payload,
            "user_id": user_id,
            "organization_id": organization_id,
            "school_id": school_id,
        }
        membership = authorize_event(
            authenticated_user=authenticated_user,
            event=safe_payload,
            action="create",
        )
        safe_payload["role"] = membership.get("role")
        safe_payload["metadata"] = {}

        event = AgendaService.create(safe_payload)
        engine_result = PipelineEngine.execute(
            context=build_engine_context(safe_payload, authenticated_user, membership),
            payload={
                **safe_payload,
                "agenda_events": [event],
                "evidences": safe_payload.get("evidences", []),
                "trainings": safe_payload.get("trainings", []),
                "users": safe_payload.get("users", []),
                "interactions": safe_payload.get("interactions", []),
                "accepted_recommendations": safe_payload.get("accepted_recommendations", 0),
            },
        )
        return ApiResponse.created(
            data={"event": event, "engine": engine_result},
            message="Evento criado com sucesso e analisado pelo EDI Intelligence Engine.",
        )
    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.put("/{event_id}")
def update_event(
    event_id: str,
    payload: dict[str, Any],
    authenticated_user: dict[str, Any] = Depends(get_supabase_user),
) -> dict[str, Any]:
    try:
        existing = AgendaService.find_by_id(event_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Evento não encontrado.")
        membership = authorize_event(
            authenticated_user=authenticated_user,
            event=existing,
            action="update",
        )
        safe_payload = {
            **payload,
            "user_id": existing.get("user_id"),
            "organization_id": existing.get("organization_id"),
            "school_id": existing.get("school_id"),
            "role": membership.get("role"),
            "metadata": {},
        }
        event = AgendaService.update(record_id=event_id, data=safe_payload)
        if not event:
            raise HTTPException(status_code=404, detail="Evento não encontrado.")

        engine_result = PipelineEngine.execute(
            context=build_engine_context(safe_payload, authenticated_user, membership),
            payload={
                **safe_payload,
                "agenda_events": [event],
                "evidences": safe_payload.get("evidences", []),
                "trainings": safe_payload.get("trainings", []),
                "users": safe_payload.get("users", []),
                "interactions": safe_payload.get("interactions", []),
                "accepted_recommendations": safe_payload.get("accepted_recommendations", 0),
            },
        )
        return ApiResponse.updated(
            data={"event": event, "engine": engine_result},
            message="Evento atualizado com sucesso e analisado pelo EDI Intelligence Engine.",
        )
    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.patch("/{event_id}/status")
def change_status(
    event_id: str,
    status: str,
    authenticated_user: dict[str, Any] = Depends(get_supabase_user),
) -> dict[str, Any]:
    try:
        existing = AgendaService.find_by_id(event_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Evento não encontrado.")
        authorize_event(
            authenticated_user=authenticated_user,
            event=existing,
            action="update",
        )
        event = AgendaService.change_status(event_id=event_id, status=status)
        if not event:
            raise HTTPException(status_code=404, detail="Evento não encontrado.")
        return ApiResponse.updated(
            data=event,
            message="Status do evento atualizado com sucesso.",
        )
    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.delete("/{event_id}")
def delete_event(
    event_id: str,
    authenticated_user: dict[str, Any] = Depends(get_supabase_user),
) -> dict[str, Any]:
    try:
        existing = AgendaService.find_by_id(event_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Evento não encontrado.")
        authorize_event(
            authenticated_user=authenticated_user,
            event=existing,
            action="delete",
        )
        deleted = AgendaService.delete(event_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Evento não encontrado.")
        return ApiResponse.deleted(message="Evento removido com sucesso.")
    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)
