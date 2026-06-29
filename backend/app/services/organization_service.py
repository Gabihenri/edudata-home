from typing import Any, Optional

from app.repositories.organization_repository import OrganizationRepository


class OrganizationService:
    """
    Serviço responsável pelas regras de negócio das organizações.
    """

    @staticmethod
    def list(limit: int = 100) -> list[dict[str, Any]]:
        return OrganizationRepository.list(limit=limit)

    @staticmethod
    def find_by_id(organization_id: str) -> Optional[dict[str, Any]]:
        return OrganizationRepository.find_by_id(organization_id)

    @staticmethod
    def find_by_slug(slug: str) -> Optional[dict[str, Any]]:
        return OrganizationRepository.find_by_slug(slug)

    @staticmethod
    def create(data: dict[str, Any]) -> dict[str, Any]:
        existing = OrganizationRepository.find_by_slug(data["slug"])

        if existing:
            raise ValueError(
                "Já existe uma organização cadastrada com este slug."
            )

        return OrganizationRepository.create(data)

    @staticmethod
    def update(
        organization_id: str,
        data: dict[str, Any]
    ) -> Optional[dict[str, Any]]:

        return OrganizationRepository.update(
            organization_id=organization_id,
            data=data,
        )

    @staticmethod
    def activate(
        organization_id: str
    ) -> Optional[dict[str, Any]]:

        return OrganizationRepository.activate(
            organization_id
        )

    @staticmethod
    def deactivate(
        organization_id: str
    ) -> Optional[dict[str, Any]]:

        return OrganizationRepository.deactivate(
            organization_id
        )
