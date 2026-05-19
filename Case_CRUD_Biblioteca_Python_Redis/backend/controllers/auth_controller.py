import hashlib
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from redis.exceptions import RedisError

from database.redis_db import r
from schemas.usuario_schema import LoginResponse, UsuarioCreate

router = APIRouter(prefix="/auth", tags=["Autenticacao"])
security = HTTPBasic()

ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin"
ROLE_ADMIN = "Admin"
ROLE_USER = "User"


def tratar_erro_redis():
    raise HTTPException(status_code=503, detail="Redis indisponivel")


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def chave_usuario(username: str) -> str:
    return f"usuario:{username}"


def criar_admin_padrao():
    """Garante que o admin padrão sempre existe com as credenciais corretas."""
    try:
        chave = chave_usuario(ADMIN_USERNAME)
        r.hset(
            chave,
            mapping={
                "username": ADMIN_USERNAME,
                "password_hash": hash_password(ADMIN_PASSWORD),
                "cargo": ROLE_ADMIN,
            },
        )
        print(f"[startup] Admin '{ADMIN_USERNAME}' criado/atualizado com sucesso.")
    except RedisError as exc:
        print(f"[startup] AVISO: nao foi possivel criar admin padrao: {exc}")


def buscar_usuario(username: str):
    try:
        return r.hgetall(chave_usuario(username))
    except RedisError:
        tratar_erro_redis()


def autenticar_usuario(credentials: HTTPBasicCredentials = Depends(security)):
    usuario = buscar_usuario(credentials.username)

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario ou senha invalidos",
            headers={"WWW-Authenticate": "Basic"},
        )

    senha_correta = secrets.compare_digest(
        usuario["password_hash"],
        hash_password(credentials.password),
    )

    if not senha_correta:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario ou senha invalidos",
            headers={"WWW-Authenticate": "Basic"},
        )

    return usuario


def exigir_admin(usuario: dict = Depends(autenticar_usuario)):
    if usuario.get("cargo") != ROLE_ADMIN:
        raise HTTPException(status_code=403, detail="Acesso permitido apenas para Admin")
    return usuario


def exigir_user(usuario: dict = Depends(autenticar_usuario)):
    if usuario.get("cargo") != ROLE_USER:
        raise HTTPException(status_code=403, detail="Acesso permitido apenas para User")
    return usuario


@router.post("/cadastro", status_code=201)
def cadastrar_usuario(usuario: UsuarioCreate):
    chave = chave_usuario(usuario.username)

    try:
        if r.exists(chave):
            raise HTTPException(status_code=409, detail="Usuario ja cadastrado")

        r.hset(
            chave,
            mapping={
                "username": usuario.username,
                "password_hash": hash_password(usuario.password),
                "cargo": ROLE_USER,
            },
        )
    except RedisError:
        tratar_erro_redis()

    return {
        "msg": "Usuario criado com sucesso",
        "username": usuario.username,
        "cargo": ROLE_USER,
    }


@router.get("/login", response_model=LoginResponse)
def login(usuario: dict = Depends(autenticar_usuario)):
    return {
        "msg": "Login realizado com sucesso",
        "username": usuario["username"],
        "cargo": usuario["cargo"],
    }
