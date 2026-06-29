from typing import Any, Optional

from app.services.supabase_service import supabase


class OrganizationService:
    """
    Serviço responsável pelo gerenciamento das organizações
    da plataforma EduData IA.
    """

    @staticmethod
    def list() -> list[dict[str, Any]]:
        response = (
            supabase.table("organizations")
            .select("*")
            .order("name")
            .execute()
        )

        return response.data or []

    @staticmethod
    def find_by_id(organization_id: str) -> Optional[dict[str, Any]]:
        response = (
            supabase.table("organizations")
            .select("*")
            .eq("id", organization_id)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    @staticmethod
    def find_by_slug(slug: str) -> Optional[dict[str, Any]]:
        response = (
            supabase.table("organizations")
            .select("*")
            .eq("slug", slug)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    @staticmethod
    def create(data: dict[str, Any]) -> dict[str, Any]:
        response = (
            supabase.table("organizations")
            .insert(data)
            .execute()
        )

        return response.data[0]

    @staticmethod
    def update(
        organization_id: str,
        data: dict[str, Any]
    ) -> Optional[dict[str, Any]]:

        response = (
            supabase.table("organizations")
            .update(data)
            .eq("id", organization_id)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    @staticmethod
    def deactivate(
        organization_id: str
    ) -> Optional[dict[str, Any]]:

        response = (
            supabase.table("organizations")
            .update({"active": False})
            .eq("id", organization_id)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]
