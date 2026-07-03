from typing import Any, Optional

from app.core.database.base_repository import BaseRepository
from app.services.supabase_service import supabase


class OrganizationRepository(BaseRepository):
    """
    Repository responsável pela persistência das organizações.
    """

    table_name = "organizations"

    @classmethod
    def list(cls, limit: int = 100) -> list[dict[str, Any]]:
        response = (
            supabase.table(cls.table_name)
            .select("*")
            .order("name")
            .limit(limit)
            .execute()
        )

        return response.data or []

    @classmethod
    def find_by_slug(cls, slug: str) -> Optional[dict[str, Any]]:
        response = (
            supabase.table(cls.table_name)
            .select("*")
            .eq("slug", slug)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    @classmethod
    def activate(cls, organization_id: str) -> Optional[dict[str, Any]]:
        response = (
            supabase.table(cls.table_name)
            .update({"active": True})
            .eq("id", organization_id)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    @classmethod
    def deactivate(cls, organization_id: str) -> Optional[dict[str, Any]]:
        response = (
            supabase.table(cls.table_name)
            .update({"active": False})
            .eq("id", organization_id)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]
