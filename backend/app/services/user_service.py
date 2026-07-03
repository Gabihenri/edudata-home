from typing import Any, Optional

from app.core.exceptions.exceptions import ConflictException
from app.core.services.base_service import BaseService
from app.core.validators.validator import Validator
from app.repositories.user_repository import UserRepository


class UserService(BaseService):
    """
    Serviço responsável pelas regras de negócio dos usuários.
    """

    repository = UserRepository

    @classmethod
    def validate_create(cls, data: dict[str, Any]) -> None:
        Validator.required(data.get("organization_id"), "organization_id")
        Validator.required(data.get("school_id"), "school_id")
        Validator.required(data.get("full_name"), "full_name")
        Validator.email(data.get("email"))

        existing = cls.repository.find_by_email(data["email"])

        if existing:
            raise ConflictException(
                "Já existe um usuário cadastrado com este e-mail."
            )

    @classmethod
    def validate_update(cls, data: dict[str, Any]) -> None:
        if data.get("email"):
            Validator.email(data["email"])

        if data.get("full_name"):
            Validator.min_length(
                data["full_name"],
                2,
                "full_name",
            )

    @classmethod
    def find_by_email(cls, email: str) -> Optional[dict[str, Any]]:
        Validator.email(email)

        return cls.repository.find_by_email(email)

    @classmethod
    def list_by_school(
        cls,
        school_id: str,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        Validator.required(school_id, "school_id")

        return cls.repository.list_by_school(
            school_id=school_id,
            limit=limit,
        )