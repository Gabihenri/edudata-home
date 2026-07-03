from datetime import datetime
from typing import Any, Optional

from app.core.database.base_repository import BaseRepository
from app.services.supabase_service import supabase


class AgendaRepository(BaseRepository):
    """
    Repository responsável pela persistência da Agenda Inteligente EDI.
    """

    table_name = "agenda_events"

    @classmethod
    def list_by_school(
        cls,
        school_id: str,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        response = (
            supabase.table(cls.table_name)
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
            supabase.table(cls.table_name)
            .select("*")
            .eq("user_id", teacher_id)
            .order("start_datetime")
            .limit(limit)
            .execute()
        )

        return response.data or []

    @classmethod
    def events_between(
        cls,
        school_id: str,
        start: datetime,
        end: datetime,
    ) -> list[dict[str, Any]]:
        response = (
            supabase.table(cls.table_name)
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
            supabase.table(cls.table_name)
            .select("*")
            .eq("school_id", school_id)
            .gte("start_datetime", datetime.now().isoformat())
            .order("start_datetime")
            .limit(limit)
            .execute()
        )

        return response.data or []