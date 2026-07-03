from typing import Any

from app.core.database.base_repository import BaseRepository


class AuditRepository(BaseRepository):
    """
    Repository responsável pelos registros de auditoria.
    """

    table_name = "audit_logs"

    @classmethod
    def list_by_user(
        cls,
        user_id: str,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        response = (
            cls._client()
            .table(cls.table_name)
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(limit)
            .execute()
        )

        return response.data or []
