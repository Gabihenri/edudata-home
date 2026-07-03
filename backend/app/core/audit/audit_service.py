from typing import Any

from app.core.audit.audit_repository import AuditRepository
from app.core.audit.models import AuditLogCreate


class AuditService:
    """
    Serviço central de auditoria da EduData IA.
    """

    @staticmethod
    def log(payload: AuditLogCreate) -> dict[str, Any]:
        return AuditRepository.create(
            payload.model_dump(exclude_none=True)
        )

    @staticmethod
    def list_by_user(
        user_id: str,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        return AuditRepository.list_by_user(
            user_id=user_id,
            limit=limit,
        )
