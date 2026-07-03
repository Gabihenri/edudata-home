from typing import Any

from app.core.cache.memory_cache import MemoryCache


class CacheService:
    """
    Camada de cache da EduData IA.
    """

    @staticmethod
    def get(key: str):
        return MemoryCache.get(key)

    @staticmethod
    def set(
        key: str,
        value: Any,
        ttl: int = 300,
    ):
        MemoryCache.set(
            key=key,
            value=value,
            ttl=ttl,
        )

    @staticmethod
    def delete(key: str):
        MemoryCache.delete(key)

    @staticmethod
    def clear():
        MemoryCache.clear()
