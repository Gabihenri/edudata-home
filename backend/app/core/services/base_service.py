from typing import Any, Optional


class BaseService:
    """
    Classe base para todos os Services da EduData IA.

    Centraliza comportamentos comuns da camada de negócio.
    """

    repository = None

    @classmethod
    def list(cls, limit: int = 100) -> list[dict[str, Any]]:
        cls._ensure_repository()
        return cls.repository.list(limit=limit)

    @classmethod
    def find_by_id(cls, record_id: str) -> Optional[dict[str, Any]]:
        cls._ensure_repository()
        return cls.repository.find_by_id(record_id)

    @classmethod
    def create(cls, data: dict[str, Any]) -> dict[str, Any]:
        cls._ensure_repository()
        cls.validate_create(data)
        return cls.repository.create(data)

    @classmethod
    def update(
        cls,
        record_id: str,
        data: dict[str, Any],
    ) -> Optional[dict[str, Any]]:
        cls._ensure_repository()
        cls.validate_update(data)
        return cls.repository.update(record_id, data)

    @classmethod
    def delete(cls, record_id: str) -> bool:
        cls._ensure_repository()
        return cls.repository.delete(record_id)

    @classmethod
    def activate(cls, record_id: str) -> Optional[dict[str, Any]]:
        cls._ensure_repository()
        return cls.repository.update(record_id, {"active": True})

    @classmethod
    def deactivate(cls, record_id: str) -> Optional[dict[str, Any]]:
        cls._ensure_repository()
        return cls.repository.update(record_id, {"active": False})

    @classmethod
    def exists(cls, record_id: str) -> bool:
        cls._ensure_repository()
        return cls.repository.exists(record_id)

    @classmethod
    def validate_create(cls, data: dict[str, Any]) -> None:
        return None

    @classmethod
    def validate_update(cls, data: dict[str, Any]) -> None:
        return None

    @classmethod
    def _ensure_repository(cls) -> None:
        if cls.repository is None:
            raise RuntimeError(
                f"{cls.__name__} precisa definir um repository."
            )