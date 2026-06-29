from typing import Any, Optional

from app.services.supabase_service import supabase


class SchoolRepository:
    """
    Repository responsável pelo acesso à tabela schools.

    Esta camada não possui regra de negócio.
    Apenas executa operações de persistência.
    """

    @staticmethod
    def search_by_inep(inep_code: str, limit: int = 20) -> list[dict[str, Any]]:
        response = (
            supabase.table("schools")
            .select("*")
            .eq("inep_code", inep_code)
            .limit(limit)
            .execute()
        )

        return response.data or []

    @staticmethod
    def search_by_name(name: str, limit: int = 20) -> list[dict[str, Any]]:
        response = (
            supabase.table("schools")
            .select("*")
            .ilike("name", f"%{name}%")
            .limit(limit)
            .execute()
        )

        return response.data or []

    @staticmethod
    def find_by_id(school_id: str) -> Optional[dict[str, Any]]:
        response = (
            supabase.table("schools")
            .select("*")
            .eq("id", school_id)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    @staticmethod
    def find_by_inep(inep_code: str) -> Optional[dict[str, Any]]:
        response = (
            supabase.table("schools")
            .select("*")
            .eq("inep_code", inep_code)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    @staticmethod
    def list_by_organization(
        organization_id: str,
        limit: int = 100
    ) -> list[dict[str, Any]]:

        response = (
            supabase.table("schools")
            .select("*")
            .eq("organization_id", organization_id)
            .order("name")
            .limit(limit)
            .execute()
        )

        return response.data or []

    @staticmethod
    def create(data: dict[str, Any]) -> dict[str, Any]:
        response = (
            supabase.table("schools")
            .insert(data)
            .execute()
        )

        return response.data[0]

    @staticmethod
    def update(
        school_id: str,
        data: dict[str, Any]
    ) -> Optional[dict[str, Any]]:

        response = (
            supabase.table("schools")
            .update(data)
            .eq("id", school_id)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    @staticmethod
    def deactivate(school_id: str) -> Optional[dict[str, Any]]:
        response = (
            supabase.table("schools")
            .update({"active": False})
            .eq("id", school_id)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    @staticmethod
    def activate(school_id: str) -> Optional[dict[str, Any]]:
        response = (
            supabase.table("schools")
            .update({"active": True})
            .eq("id", school_id)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]
