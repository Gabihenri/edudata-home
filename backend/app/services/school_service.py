from typing import Any, Optional

from app.services.supabase_service import supabase


class SchoolService:
    """
    Serviço responsável pelo cadastro, busca e vínculo de escolas
    dentro da Plataforma EduData IA.
    """

    @staticmethod
    def search(query: str, limit: int = 20) -> dict[str, Any]:
        query = query.strip()

        if not query:
            return {
                "query": query,
                "total": 0,
                "items": []
            }

        if query.isdigit():
            response = (
                supabase.table("schools")
                .select("*")
                .eq("inep_code", query)
                .limit(limit)
                .execute()
            )
        else:
            response = (
                supabase.table("schools")
                .select("*")
                .ilike("name", f"%{query}%")
                .limit(limit)
                .execute()
            )

        items = response.data or []

        return {
            "query": query,
            "total": len(items),
            "items": items
        }

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
    def create_manual_school(data: dict[str, Any]) -> dict[str, Any]:
        payload = {
            "organization_id": data["organization_id"],
            "name": data["name"],
            "short_name": data.get("short_name"),
            "code": data.get("code"),
            "inep_code": data.get("inep_code"),
            "address": data.get("address"),
            "neighborhood": data.get("neighborhood"),
            "city": data.get("city"),
            "state": data.get("state"),
            "zip_code": data.get("zip_code"),
            "latitude": data.get("latitude"),
            "longitude": data.get("longitude"),
            "administrative_dependency": data.get("administrative_dependency"),
            "school_type": data.get("school_type"),
            "location_type": data.get("location_type"),
            "phone": data.get("phone"),
            "email": data.get("email"),
            "website": data.get("website"),
            "official_registry": False,
            "manually_created": True,
            "pending_validation": True,
            "active": True,
        }

        response = (
            supabase.table("schools")
            .insert(payload)
            .execute()
        )

        return response.data[0]

    @staticmethod
    def create(data: dict[str, Any]) -> dict[str, Any]:
        response = (
            supabase.table("schools")
            .insert(data)
            .execute()
        )

        return response.data[0]

    @staticmethod
    def update(school_id: str, data: dict[str, Any]) -> Optional[dict[str, Any]]:
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
