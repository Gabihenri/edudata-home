from typing import Any, Optional

from app.services.supabase_service import supabase


class UserRepository:
    """
    Repository responsável pela persistência dos usuários.
    """

    @staticmethod
    def list(limit: int = 100) -> list[dict[str, Any]]:
        response = (
            supabase.table("users")
            .select("*")
            .order("name")
            .limit(limit)
            .execute()
        )

        return response.data or []

    @staticmethod
    def find_by_id(user_id: str) -> Optional[dict[str, Any]]:
        response = (
            supabase.table("users")
            .select("*")
            .eq("id", user_id)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    @staticmethod
    def find_by_email(email: str) -> Optional[dict[str, Any]]:
        response = (
            supabase.table("users")
            .select("*")
            .eq("email", email)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    @staticmethod
    def list_by_school(
        school_id: str,
        limit: int = 100
    ) -> list[dict[str, Any]]:

        response = (
            supabase.table("users")
            .select("*")
            .eq("school_id", school_id)
            .order("name")
            .limit(limit)
            .execute()
        )

        return response.data or []

    @staticmethod
    def create(data: dict[str, Any]) -> dict[str, Any]:
        response = (
            supabase.table("users")
            .insert(data)
            .execute()
        )

        return response.data[0]

    @staticmethod
    def update(
        user_id: str,
        data: dict[str, Any]
    ) -> Optional[dict[str, Any]]:

        response = (
            supabase.table("users")
            .update(data)
            .eq("id", user_id)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    @staticmethod
    def activate(user_id: str) -> Optional[dict[str, Any]]:
        response = (
            supabase.table("users")
            .update({"active": True})
            .eq("id", user_id)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    @staticmethod
    def deactivate(user_id: str) -> Optional[dict[str, Any]]:
        response = (
            supabase.table("users")
            .update({"active": False})
            .eq("id", user_id)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]