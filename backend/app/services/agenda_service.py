from datetime import datetime
from typing import Any, Optional

from app.services.supabase_service import supabase


class AgendaService:
    """
    Serviço da Agenda Inteligente EDI.
    """

    @staticmethod
    def list(limit: int = 100) -> list[dict[str, Any]]:
        response = (
            supabase.table("agenda_events")
            .select("*")
            .order("start_datetime")
            .limit(limit)
            .execute()
        )

        return response.data or []

    @staticmethod
    def list_by_school(
        school_id: str,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        response = (
            supabase.table("agenda_events")
            .select("*")
            .eq("school_id", school_id)
            .order("start_datetime")
            .limit(limit)
            .execute()
        )

        return response.data or []

    @staticmethod
    def list_by_teacher(
        teacher_id: str,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        response = (
            supabase.table("agenda_events")
            .select("*")
            .eq("user_id", teacher_id)
            .order("start_datetime")
            .limit(limit)
            .execute()
        )

        return response.data or []

    @staticmethod
    def find_by_id(event_id: str) -> Optional[dict[str, Any]]:
        response = (
            supabase.table("agenda_events")
            .select("*")
            .eq("id", event_id)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    @staticmethod
    def create(data: dict[str, Any]) -> dict[str, Any]:
        response = (
            supabase.table("agenda_events")
            .insert(data)
            .execute()
        )

        return response.data[0]

    @staticmethod
    def update(
        event_id: str,
        data: dict[str, Any],
    ) -> Optional[dict[str, Any]]:
        response = (
            supabase.table("agenda_events")
            .update(data)
            .eq("id", event_id)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    @staticmethod
    def delete(event_id: str) -> bool:
        response = (
            supabase.table("agenda_events")
            .delete()
            .eq("id", event_id)
            .execute()
        )

        return bool(response.data)

    @staticmethod
    def change_status(
        event_id: str,
        status: str,
    ) -> Optional[dict[str, Any]]:
        response = (
            supabase.table("agenda_events")
            .update({"status": status})
            .eq("id", event_id)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    @staticmethod
    def events_between(
        school_id: str,
        start: datetime,
        end: datetime,
    ) -> list[dict[str, Any]]:
        response = (
            supabase.table("agenda_events")
            .select("*")
            .eq("school_id", school_id)
            .gte("start_datetime", start.isoformat())
            .lte("end_datetime", end.isoformat())
            .order("start_datetime")
            .execute()
        )

        return response.data or []

    @staticmethod
    def upcoming_events(
        school_id: str,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        response = (
            supabase.table("agenda_events")
            .select("*")
            .eq("school_id", school_id)
            .gte("start_datetime", datetime.now().isoformat())
            .order("start_datetime")
            .limit(limit)
            .execute()
        )

        return response.data or []

    @staticmethod
    def dashboard_summary() -> dict[str, Any]:
        response = (
            supabase.table("agenda_events")
            .select("*")
            .execute()
        )

        events = response.data or []

        return {
            "total_events": len(events),
            "planned": len([e for e in events if e.get("status") == "planned"]),
            "completed": len([e for e in events if e.get("status") == "completed"]),
            "cancelled": len([e for e in events if e.get("status") == "cancelled"]),
            "upcoming": len(
                [
                    e for e in events
                    if e.get("start_datetime")
                    and e.get("start_datetime") >= datetime.now().isoformat()
                ]
            ),
        }
