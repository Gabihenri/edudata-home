from typing import Any, Optional

from app.services.supabase_service import supabase


class BaseRepository:
    """
    Classe base para todos os repositories da EduData IA.

    Centraliza operações CRUD comuns e reduz duplicação de código.
    """

    table_name: str = ""

    @classmethod
    def list(
        cls,
        limit: int = 100,
        order_by: Optional[str] = None,
    ) -> list[dict[str, Any]]:
        query = supabase.table(cls.table_name).select("*")

        if order_by:
            query = query.order(order_by)

        if limit:
            query = query.limit(limit)

        response = query.execute()

        return response.data or []

    @classmethod
    def find_by_id(
        cls,
        record_id: str,
    ) -> Optional[dict[str, Any]]:

        response = (
            supabase.table(cls.table_name)
            .select("*")
            .eq("id", record_id)
            .limit(1)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    @classmethod
    def create(
        cls,
        data: dict[str, Any],
    ) -> dict[str, Any]:

        response = (
            supabase.table(cls.table_name)
            .insert(data)
            .execute()
        )

        return response.data[0]

    @classmethod
    def update(
        cls,
        record_id: str,
        data: dict[str, Any],
    ) -> Optional[dict[str, Any]]:

        response = (
            supabase.table(cls.table_name)
            .update(data)
            .eq("id", record_id)
            .execute()
        )

        if not response.data:
            return None

        return response.data[0]

    @classmethod
    def delete(
        cls,
        record_id: str,
    ) -> bool:

        response = (
            supabase.table(cls.table_name)
            .delete()
            .eq("id", record_id)
            .execute()
        )

        return bool(response.data)

    @classmethod
    def exists(
        cls,
        record_id: str,
    ) -> bool:

        return cls.find_by_id(record_id) is not None

    @classmethod
    def count(cls) -> int:

        response = (
            supabase.table(cls.table_name)
            .select("id", count="exact")
            .execute()
        )

        return response.count or 0