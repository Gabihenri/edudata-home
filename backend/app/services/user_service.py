from typing import Any, Optional

from app.repositories.user_repository import UserRepository


class UserService:
    """
    Serviço responsável pelas regras de negócio dos usuários.
    """

    @staticmethod
    def list(limit: int = 100) -> list[dict[str, Any]]:
        return UserRepository.list(limit=limit)

    @staticmethod
    def find_by_id(user_id: str) -> Optional[dict[str, Any]]:
        return UserRepository.find_by_id(user_id)

    @staticmethod
    def find_by_email(email: str) -> Optional[dict[str, Any]]:
        return UserRepository.find_by_email(email)

    @staticmethod
    def list_by_school(
        school_id: str,
        limit: int = 100
    ) -> list[dict[str, Any]]:
        return UserRepository.list_by_school(
            school_id=school_id,
            limit=limit,
        )

    @staticmethod
    def create(data: dict[str, Any]) -> dict[str, Any]:
        existing = UserRepository.find_by_email(data["email"])

        if existing:
            raise ValueError(
                "Já existe um usuário cadastrado com este e-mail."
            )

        return UserRepository.create(data)

    @staticmethod
    def update(
        user_id: str,
        data: dict[str, Any]
    ) -> Optional[dict[str, Any]]:
        return UserRepository.update(
            user_id=user_id,
            data=data,
        )

    @staticmethod
    def activate(user_id: str) -> Optional[dict[str, Any]]:
        return UserRepository.activate(user_id)

    @staticmethod
    def deactivate(user_id: str) -> Optional[dict[str, Any]]:
        return UserRepository.deactivate(user_id)