from typing import Any, Optional

from app.core.database.base_repository import BaseRepository
from app.services.supabase_service import supabase


class UserRepository(BaseRepository):
    """
    Repository responsável pela persistência dos usuários.
    """

    table_name = "users"

    @classmethod
    def list(cls, limit: int = 100) -> list[dict[str, Any]]:
        response = (
            supabase.table(cls.table_name)
            .select("*")
            .order("full_name")
            .limit(limit)
            .execute()
        )

        return response.data or []

    @classmethod
    def find_by_email(cls, email: str) -> Optional[dict[str, Any]]:
        response = (
            supabase.table(cls.table_name)
            .select("*")
            .eq("email", email)
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
            supabase.table(cls.table_name)
            .select("*")
            .eq("school_id", school_id)
            .order("full_name")
            .limit(limit)
            .execute()
        )

        return response.data or []