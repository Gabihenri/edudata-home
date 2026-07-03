from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.services.agenda_service import AgendaService

router = APIRouter(
    prefix="/api/v1/agenda",
    tags=["Agenda Inteligente EDI"],
)


@router.get("/")
def list_events(
    limit: int = Query(100, ge=1, le=500),
) -> dict[str, Any]:
    events = AgendaService.list(limit=limit)

    return {
        "total": len(events),
        "items": events,
    }


@router.get("/{event_id}")
def get_event(event_id: str):
    event = AgendaService.find_by_id(event_id)

    if not event:
        raise HTTPException(
            status_code=404,
            detail="Evento não encontrado.",
        )

    return event


@router.get("/teacher/{teacher_id}")
def list_teacher_events(
    teacher_id: str,
    limit: int = Query(100, ge=1, le=500),
):
    events = AgendaService.list_by_teacher(
        teacher_id=teacher_id,
        limit=limit,
    )

    return {
        "total": len(events),
        "items": events,
    }


@router.get("/school/{school_id}")
def list_school_events(
    school_id: str,
    limit: int = Query(100, ge=1, le=500),
):
    events = AgendaService.list_by_school(
        school_id=school_id,
        limit=limit,
    )

    return {
        "total": len(events),
        "items": events,
    }


@router.get("/dashboard/summary")
def dashboard_summary():
    return AgendaService.dashboard_summary()
