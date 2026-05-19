import logging
import redis
from config import settings

logger = logging.getLogger(__name__)


def get_redis_client() -> redis.Redis:
    """Retorna um cliente Redis com connection pool."""
    pool = redis.ConnectionPool(
        host=settings.redis_host,
        port=settings.redis_port,
        db=settings.redis_db,
        password=settings.redis_password,
        decode_responses=True,
        max_connections=20,
        socket_timeout=5,
        socket_connect_timeout=5,
        retry_on_timeout=True,
    )
    client = redis.Redis(connection_pool=pool)
    logger.info(
        "Redis client criado: %s:%s db=%s",
        settings.redis_host,
        settings.redis_port,
        settings.redis_db,
    )
    return client


# instância global
redis_client: redis.Redis = get_redis_client()
