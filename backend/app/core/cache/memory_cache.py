from datetime import datetime, timedelta
from typing import Any


class MemoryCache:
    _cache: dict[str, dict[str, Any]] = {}

    @classmethod
    def get(cls, key: str):
        item = cls._cache.get(key)

        if not item:
            return None

        if item["expires_at"] < datetime.utcnow():
            del cls._cache[key]
            return None

        return item["value"]

    @classmethod
    def set(
        cls,
        key: str,
        value: Any,
        ttl: int = 300,
    ):
        cls._cache[key] = {
            "value": value,
            "expires_at": datetime.utcnow() + timedelta(seconds=ttl),
        }

    @classmethod
    def delete(cls, key: str):
        cls._cache.pop(key, None)

    @classmethod
    def clear(cls):
        cls._cache.clear()
