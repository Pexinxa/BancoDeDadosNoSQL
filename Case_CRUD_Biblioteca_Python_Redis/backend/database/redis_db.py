import redis
import os
from dotenv import load_dotenv

load_dotenv()

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")
REDIS_DB   = os.getenv("REDIS_DB", "1")

try:
    REDIS_PORT = int(REDIS_PORT)
except ValueError as exc:
    raise RuntimeError("REDIS_PORT deve ser um numero inteiro valido") from exc

if not 1 <= REDIS_PORT <= 65535:
    raise RuntimeError("REDIS_PORT deve estar entre 1 e 65535")

r = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    db=int(REDIS_DB),
    decode_responses=True,
)
