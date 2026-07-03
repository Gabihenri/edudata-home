from typing import Any, Callable


class EngineRegistry:
    """
    Registro central de capacidades do EDI Intelligence Engine.
    """

    _services: dict[str, Callable[..., Any]] = {}

    @classmethod
    def register(
        cls,
        name: str,
        service: Callable[..., Any],
    ) -> None:
        cls._services[name] = service

    @classmethod
    def get(
        cls,
        name: str,
    ) -> Callable[..., Any] | None:
        return cls._services.get(name)

    @classmethod
    def list_services(cls) -> list[str]:
        return list(cls._services.keys())

    @classmethod
    def clear(cls) -> None:
        cls._services.clear()
