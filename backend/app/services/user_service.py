from typing import Any, Optional

from app.services.supabase_service import supabase


class UserService:
    """
    Serviço responsável pelo gerenciamento dos usuários
    da Plataforma EduData IA.
    """

    @staticmethod
    def list(school_id: Optional[str] = None) -> list[dict[str, Any]]:
        query = (
            supabase.table("users")
            .select("*")
            .order("full_name")
        )

        if school_id:
            query = query.eq("school_id", school_id)

        response = query.execute()

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
    def deactivate(
        user_id: str
    ) -> Optional[dict[str, Any]]:

        response = (
            supabase.table("users")
            .update({"active": False})
            .eq("id", user_id)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    @staticmethod
    def update_last_login(user_id: str) -> None:
        (
            supabase.table("users")
            .update({"last_login": "now()"})
            .eq("id", user_id)
            .execute()
        )
