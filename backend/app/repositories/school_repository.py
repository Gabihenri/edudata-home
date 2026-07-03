from typing import Any, Optional

from app.core.database.base_repository import BaseRepository
from app.services.supabase_service import supabase


class SchoolRepository(BaseRepository):
    """
    Repository responsável pela persistência das escolas.
    """

    table_name = "schools"

    @classmethod
    def search_by_inep(
        cls,
        inep_code: str,
        limit: int = 20,
    ) -> list[dict[str, Any]]:

        response = (
            supabase.table(cls.table_name)
            .select("*")
            .eq("inep_code", inep_code)
            .limit(limit)
            .execute()
        )

        return response.data or []

    @classmethod
    def search_by_name(
        cls,
        name: str,
        limit: int = 20,
    ) -> list[dict[str, Any]]:

        response = (
            supabase.table(cls.table_name)
            .select("*")
            .ilike("name", f"%{name}%")
            .limit(limit)
            .execute()
        )

        return response.data or []

    @classmethod
    def find_by_inep(
        cls,
        inep_code: str,
    ) -> Optional[dict[str, Any]]:

        response = (
            supabase.table(cls.table_name)
            .select("*")
            .eq("inep_code", inep_code)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    @classmethod
    def list_by_organization(
        cls,
        organization_id: str,
        limit: int = 100,
    ) -> list[dict[str, Any]]:

        response = (
            supabase.table(cls.table_name)
            .select("*")
            .eq("organization_id", organization_id)
            .order("name")
            .limit(limit)
            .execute()
        )

        return response.data or []

    @classmethod
    def activate(
        cls,
        school_id: str,
    ) -> Optional[dict[str, Any]]:

        response = (
            supabase.table(cls.table_name)
            .update({"active": True})
            .eq("id", school_id)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    @classmethod
    def deactivate(
        cls,
        school_id: str,
    ) -> Optional[dict[str, Any]]:

        response = (
            supabase.table(cls.table_name)
            .update({"active": False})
            .eq("id", school_id)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]