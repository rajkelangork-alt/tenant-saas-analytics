import json
from typing import Any

from app.core.config import settings

aioredis: Any = None
try:
    import redis.asyncio as _aioredis  # type: ignore
    aioredis = _aioredis
except ImportError:
    aioredis = None

class CacheService:
    _client: Any = None

    @classmethod
    async def get_client(cls) -> Any:
        if cls._client is None and aioredis is not None:
            redis_url = getattr(settings, "REDIS_URL", "redis://localhost:6379/0")
            cls._client = aioredis.from_url(
                redis_url,
                encoding="utf-8",
                decode_responses=True,
            )
        return cls._client

    @classmethod
    async def get(cls, key: str) -> Any | None:
        client = await cls.get_client()
        if not client:
            return None
        try:
            val = await client.get(key)
            return json.loads(val) if val else None
        except (ConnectionError, TimeoutError, json.JSONDecodeError, TypeError, OSError):
            return None

    @classmethod
    async def set(cls, key: str, value: Any, expire_seconds: int = 300) -> bool:
        client = await cls.get_client()
        if not client:
            return False
        try:
            payload = json.dumps(value)
            await client.set(key, payload, ex=expire_seconds)
            return True
        except (ConnectionError, TimeoutError, TypeError, ValueError, OSError):
            return False

    @classmethod
    async def delete(cls, key: str) -> bool:
        client = await cls.get_client()
        if not client:
            return False
        try:
            await client.delete(key)
            return True
        except (ConnectionError, TimeoutError, OSError):
            return False

    @classmethod
    async def clear_tenant_cache(cls, tenant_id: str) -> None:
        client = await cls.get_client()
        if not client:
            return
        try:
            keys = await client.keys(f"tenant:{tenant_id}:*")
            if keys:
                await client.delete(*keys)
        except (ConnectionError, TimeoutError, OSError):
            pass