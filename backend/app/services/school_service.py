from typing import Any, Optional

from app.repositories.school_repository import SchoolRepository


class SchoolService:
    """
    Serviço responsável pelo School Registry da EduData IA.

    Esta camada contém as regras de negócio relacionadas a escolas.
    O acesso ao banco é feito exclusivamente pelo SchoolRepository.
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
            items = SchoolRepository.search_by_inep(query, limit)
        else:
            items = SchoolRepository.search_by_name(query, limit)

        return {
            "query": query,
            "total": len(items),
            "items": items
        }

    @staticmethod
    def find_by_id(school_id: str) -> Optional[dict[str, Any]]:
        return SchoolRepository.find_by_id(school_id)

    @staticmethod
    def find_by_inep(inep_code: str) -> Optional[dict[str, Any]]:
        return SchoolRepository.find_by_inep(inep_code)

    @staticmethod
    def list_by_organization(
        organization_id: str,
        limit: int = 100
    ) -> list[dict[str, Any]]:

        return SchoolRepository.list_by_organization(
            organization_id=organization_id,
            limit=limit
        )

    @staticmethod
    def create(data: dict[str, Any]) -> dict[str, Any]:
        if data.get("inep_code"):
            existing_school = SchoolRepository.find_by_inep(data["inep_code"])

            if existing_school:
                return existing_school

        return SchoolRepository.create(data)

    @staticmethod
    def create_manual_school(data: dict[str, Any]) -> dict[str, Any]:
        payload = {
            **data,
            "official_registry": False,
            "manually_created": True,
            "pending_validation": True,
            "active": True,
        }

        return SchoolRepository.create(payload)

    @staticmethod
    def update(
        school_id: str,
        data: dict[str, Any]
    ) -> Optional[dict[str, Any]]:

        return SchoolRepository.update(
            school_id=school_id,
            data=data
        )

    @staticmethod
    def deactivate(school_id: str) -> Optional[dict[str, Any]]:
        return SchoolRepository.deactivate(school_id)

    @staticmethod
    def activate(school_id: str) -> Optional[dict[str, Any]]:
        return SchoolRepository.activate(school_id)
