from typing import Any

from app.engine.context import EngineContext


class MemoryEngine:
    """
    Memória institucional do EDI Intelligence Engine.

    Responsável por armazenar informações que serão utilizadas
    pelos módulos inteligentes da plataforma.
    """

    _memory: dict[str, Any] = {}

    @classmethod
    def save(
        cls,
        context: EngineContext,
        key: str,
        value: Any,
    ) -> None:

        scope = (
            context.organization_id,
            context.school_id,
            context.user_id,
        )

        cls._memory[(scope, key)] = value

    @classmethod
    def load(
        cls,
        context: EngineContext,
        key: str,
    ) -> Any:

        scope = (
            context.organization_id,
            context.school_id,
            context.user_id,
        )

        return cls._memory.get((scope, key))

    @classmethod
    def delete(
        cls,
        context: EngineContext,
        key: str,
    ) -> None:

        scope = (
            context.organization_id,
            context.school_id,
            context.user_id,
        )

        cls._memory.pop((scope, key), None)

    @classmethod
    def clear(cls) -> None:
        cls._memory.clear()
