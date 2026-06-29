from datetime import datetime
from typing import Any, Optional

from app.services.supabase_service import supabase


class AgendaService:
    """
    Serviço responsável pela Agenda Inteligente EDI.

    Responsabilidades:
    - gerenciamento dos eventos;
    - planejamento pedagógico;
    - calendário institucional;
    - integração com ações pedagógicas;
    - preparação para IA Institucional.
    """

    @staticmethod
    def list(
        school_id: str,
        user_id: Optional[str] = None
    ) -> list[dict[str, Any]]:

        query = (
            supabase.table("agenda_events")
            .select("*")
            .eq("school_id", school_id)
            .order("start_datetime")
        )

        if user_id:
            query = query.eq("user_id", user_id)

        response = query.execute()

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
        data: dict[str, Any]
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
        status: str
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
        end: datetime
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
    def events_by_teacher(
        teacher_id: str
    ) -> list[dict[str, Any]]:

        response = (
            supabase.table("agenda_events")
            .select("*")
            .eq("user_id", teacher_id)
            .order("start_datetime")
            .execute()
        )

        return response.data or []

    @staticmethod
    def events_by_class(
        class_id: str
    ) -> list[dict[str, Any]]:

        response = (
            supabase.table("agenda_events")
            .select("*")
            .eq("class_id", class_id)
            .order("start_datetime")
            .execute()
        )

        return response.data or []

    @staticmethod
    def upcoming_events(
        school_id: str,
        limit: int = 10
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
