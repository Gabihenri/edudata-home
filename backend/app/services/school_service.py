from typing import Any, Optional

from app.core.services.base_service import BaseService
from app.core.validators.validator import Validator
from app.repositories.school_repository import SchoolRepository


class SchoolService(BaseService):
    """
    Serviço responsável pelo School Registry da EduData IA.
    """

    repository = SchoolRepository

    @classmethod
    def validate_create(cls, data: dict[str, Any]) -> None:
        Validator.required(data.get("organization_id"), "organization_id")
        Validator.required(data.get("name"), "name")

    @classmethod
    def validate_update(cls, data: dict[str, Any]) -> None:
        if data.get("name"):
            Validator.min_length(data["name"], 2, "name")

    @classmethod
    def search(cls, query: str, limit: int = 20) -> dict[str, Any]:
        query = query.strip()

        if not query:
            return {
                "query": query,
                "total": 0,
                "items": [],
            }

        if query.isdigit():
            items = cls.repository.search_by_inep(query, limit)
        else:
            items = cls.repository.search_by_name(query, limit)

        return {
            "query": query,
            "total": len(items),
            "items": items,
        }

    @classmethod
    def find_by_inep(cls, inep_code: str) -> Optional[dict[str, Any]]:
        Validator.required(inep_code, "inep_code")
        return cls.repository.find_by_inep(inep_code)

    @classmethod
    def list_by_organization(
        cls,
        organization_id: str,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        Validator.required(organization_id, "organization_id")

        return cls.repository.list_by_organization(
            organization_id=organization_id,
            limit=limit,
        )

    @classmethod
    def create_manual_school(cls, data: dict[str, Any]) -> dict[str, Any]:
        Validator.required(data.get("organization_id"), "organization_id")
        Validator.required(data.get("name"), "name")

        payload = {
            **data,
            "official_registry": False,
            "manually_created": True,
            "pending_validation": True,
            "active": True,
        }

        return cls.repository.create(payload)