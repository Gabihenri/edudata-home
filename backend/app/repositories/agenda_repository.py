from datetime import datetime
from typing import Any, Optional

from app.services.supabase_service import supabase


class AgendaRepository:
    """
    Repository responsável pela persistência dos eventos da
    Agenda Inteligente EDI.
    """

    TABLE = "agenda_events"

    @classmethod
    def list(cls, limit: int = 100) -> list[dict[str, Any]]:
        response = (
            supabase.table(cls.TABLE)
            .select("*")
            .order("start_datetime")
            .limit(limit)
            .execute()
        )

        return response.data or []

    @classmethod
    def find_by_id(cls, event_id: str) -> Optional[dict[str, Any]]:
        response = (
            supabase.table(cls.TABLE)
            .select("*")
            .eq("id", event_id)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    @classmethod
    def list_by_school(
        cls,
        school_id: str,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        response = (
            supabase.table(cls.TABLE)
            .select("*")
            .eq("school_id", school_id)
            .order("start_datetime")
            .limit(limit)
            .execute()
        )

        return response.data or []

    @classmethod
    def list_by_teacher(
        cls,
        teacher_id: str,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        response = (
            supabase.table(cls.TABLE)
            .select("*")
            .eq("user_id", teacher_id)
            .order("start_datetime")
            .limit(limit)
            .execute()
        )

        return response.data or []

    @classmethod
    def create(cls, data: dict[str, Any]) -> dict[str, Any]:
        response = (
            supabase.table(cls.TABLE)
            .insert(data)
            .execute()
        )

        return response.data[0]

    @classmethod
    def update(
        cls,
        event_id: str,
        data: dict[str, Any],
    ) -> Optional[dict[str, Any]]:
        response = (
            supabase.table(cls.TABLE)
            .update(data)
            .eq("id", event_id)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    @classmethod
    def delete(cls, event_id: str) -> bool:
        response = (
            supabase.table(cls.TABLE)
            .delete()
            .eq("id", event_id)
            .execute()
        )

        return bool(response.data)

    @classmethod
    def events_between(
        cls,
        school_id: str,
        start: datetime,
        end: datetime,
    ) -> list[dict[str, Any]]:
        response = (
            supabase.table(cls.TABLE)
            .select("*")
            .eq("school_id", school_id)
            .gte("start_datetime", start.isoformat())
            .lte("end_datetime", end.isoformat())
            .order("start_datetime")
            .execute()
        )

        return response.data or []

    @classmethod
    def upcoming_events(
        cls,
        school_id: str,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        response = (
            supabase.table(cls.TABLE)
            .select("*")
            .eq("school_id", school_id)
            .gte("start_datetime", datetime.now().isoformat())
            .order("start_datetime")
            .limit(limit)
            .execute()
        )

        return response.data or []