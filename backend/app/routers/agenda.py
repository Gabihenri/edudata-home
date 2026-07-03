from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.core.exceptions.exceptions import EduDataException
from app.core.responses.api_response import ApiResponse
from app.services.agenda_service import AgendaService


router = APIRouter(
    prefix="/api/v1/agenda",
    tags=["Agenda Inteligente EDI"],
)


@router.get("/")
def list_events(
    limit: int = Query(100, ge=1, le=500),
) -> dict[str, Any]:
    try:
        events = AgendaService.list(limit=limit)

        return ApiResponse.success(
            data={
                "total": len(events),
                "items": events,
            },
            message="Eventos listados com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        )


@router.get("/dashboard/summary")
def dashboard_summary() -> dict[str, Any]:
    try:
        summary = AgendaService.dashboard_summary()

        return ApiResponse.success(
            data=summary,
            message="Resumo da agenda carregado com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        )


@router.get("/{event_id}")
def get_event(event_id: str) -> dict[str, Any]:
    try:
        event = AgendaService.find_by_id(event_id)

        if not event:
            raise HTTPException(
                status_code=404,
                detail="Evento não encontrado.",
            )

        return ApiResponse.success(
            data=event,
            message="Evento encontrado com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        )


@router.get("/teacher/{teacher_id}")
def list_teacher_events(
    teacher_id: str,
    limit: int = Query(100, ge=1, le=500),
) -> dict[str, Any]:
    try:
        events = AgendaService.list_by_teacher(
            teacher_id=teacher_id,
            limit=limit,
        )

        return ApiResponse.success(
            data={
                "total": len(events),
                "items": events,
            },
            message="Eventos do professor listados com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        )


@router.get("/school/{school_id}")
def list_school_events(
    school_id: str,
    limit: int = Query(100, ge=1, le=500),
) -> dict[str, Any]:
    try:
        events = AgendaService.list_by_school(
            school_id=school_id,
            limit=limit,
        )

        return ApiResponse.success(
            data={
                "total": len(events),
                "items": events,
            },
            message="Eventos da escola listados com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        )


@router.get("/school/{school_id}/upcoming")
def upcoming_events(
    school_id: str,
    limit: int = Query(10, ge=1, le=50),
) -> dict[str, Any]:
    try:
        events = AgendaService.upcoming_events(
            school_id=school_id,
            limit=limit,
        )

        return ApiResponse.success(
            data={
                "total": len(events),
                "items": events,
            },
            message="Próximos eventos carregados com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        )


@router.get("/school/{school_id}/between")
def events_between(
    school_id: str,
    start: datetime,
    end: datetime,
) -> dict[str, Any]:
    try:
        events = AgendaService.events_between(
            school_id=school_id,
            start=start,
            end=end,
        )

        return ApiResponse.success(
            data={
                "total": len(events),
                "items": events,
            },
            message="Eventos do período carregados com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        )


@router.post("/")
def create_event(payload: dict[str, Any]) -> dict[str, Any]:
    try:
        event = AgendaService.create(payload)

        return ApiResponse.created(
            data=event,
            message="Evento criado com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        )


@router.put("/{event_id}")
def update_event(
    event_id: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    try:
        event = AgendaService.update(
            record_id=event_id,
            data=payload,
        )

        if not event:
            raise HTTPException(
                status_code=404,
                detail="Evento não encontrado.",
            )

        return ApiResponse.updated(
            data=event,
            message="Evento atualizado com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        )


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
            raise HTTPException(
                status_code=404,
                detail="Evento não encontrado.",
            )

        return ApiResponse.updated(
            data=event,
            message="Status do evento atualizado com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        )


@router.delete("/{event_id}")
def delete_event(event_id: str) -> dict[str, Any]:
    try:
        deleted = AgendaService.delete(event_id)

        if not deleted:
            raise HTTPException(
                status_code=404,
                detail="Evento não encontrado.",
            )

        return ApiResponse.deleted(
            message="Evento removido com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        )