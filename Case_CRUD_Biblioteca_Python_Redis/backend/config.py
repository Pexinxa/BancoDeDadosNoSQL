from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Redis
    redis_host: str = "redis"
    redis_port: int = 6379
    redis_db: int = 0
    redis_password: str | None = None

    # App
    app_title: str = "Biblioteca Digital API"
    app_version: str = "3.0.0"
    debug: bool = False

    # Admin hardcoded (não pode ser criado pelo cadastro)
    admin_username: str = "admin"
    admin_password: str = "admin123"
    admin_email: str = "admin@biblioteca.com"

    # JWT
    jwt_secret: str = "TROQUE_ESTA_CHAVE_EM_PRODUCAO"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 120

    # Uploads
    covers_dir: str = "/covers"
    loan_limit: int = 3          # máximo de empréstimos simultâneos por usuário

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
