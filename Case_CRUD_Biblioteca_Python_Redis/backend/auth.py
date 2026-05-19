"""
Autenticação JWT para dois tipos de usuário:
  - admin  → credenciais hardcoded, verificadas diretamente
  - user   → credenciais armazenadas no Redis com hash bcrypt

O payload do JWT inclui: sub (user_id), role, name
"""
import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from config import settings
from models import Token, TokenData, UsuarioCreate, UsuarioResponse

# ── Crypto ─────────────────────────────────────────────────────────────────────
pwd_context   = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

# Chaves Redis para usuários
USER_PREFIX     = "usuario:"
USER_EMAIL_IDX  = "usuarios:email:"   # usuario:email:{email} → user_id
USER_INDEX      = "usuarios:index"


# ── JWT ────────────────────────────────────────────────────────────────────────
def _create_token(user_id: str, role: str, name: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    payload = {"sub": user_id, "role": role, "name": name, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def _decode_token(token: str) -> TokenData:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        return TokenData(
            user_id=payload["sub"],
            role=payload["role"],
            name=payload["name"],
        )
    except (JWTError, KeyError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ── Dependências de rota ───────────────────────────────────────────────────────
async def get_current_user(token: Annotated[str | None, Depends(oauth2_scheme)]) -> TokenData:
    """Qualquer usuário autenticado (admin ou user)."""
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Autenticação necessária.")
    return _decode_token(token)


async def get_current_admin(token: Annotated[str | None, Depends(oauth2_scheme)]) -> TokenData:
    """Apenas admin."""
    td = await get_current_user(token)
    if td.role != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Acesso restrito ao administrador.")
    return td


async def get_optional_user(
    token: Annotated[str | None, Depends(oauth2_scheme)]
) -> TokenData | None:
    """Retorna usuário se autenticado, None caso contrário (rotas públicas)."""
    if not token:
        return None
    try:
        return _decode_token(token)
    except HTTPException:
        return None


# ── Operações de usuário no Redis ──────────────────────────────────────────────
def register_user(payload: UsuarioCreate, redis_client) -> Token:
    """Cria um novo usuário com role='user' no Redis. Admin nunca via este endpoint."""
    email = payload.email.strip().lower()

    # Bloqueia e-mail do admin
    if email == settings.admin_email.lower():
        raise HTTPException(status.HTTP_400_BAD_REQUEST,
                            "Este e-mail não pode ser utilizado para cadastro.")

    # Verifica duplicidade
    if redis_client.exists(USER_EMAIL_IDX + email):
        raise HTTPException(status.HTTP_409_CONFLICT, "E-mail já cadastrado.")

    user_id = str(uuid.uuid4())
    hashed  = pwd_context.hash(payload.password)
    user = {
        "id":            user_id,
        "name":          payload.name.strip(),
        "email":         email,
        "password_hash": hashed,
        "role":          "user",          # cadastro SEMPRE cria role='user'
    }

    # Salva no Redis atomicamente
    pipe = redis_client.pipeline()
    pipe.set(USER_PREFIX + user_id, json.dumps(user))
    pipe.set(USER_EMAIL_IDX + email, user_id)
    pipe.sadd(USER_INDEX, user_id)
    pipe.execute()

    token = _create_token(user_id, "user", user["name"])
    return Token(
        access_token=token,
        user=UsuarioResponse(id=user_id, name=user["name"], email=email, role="user"),
    )


def login_user(email: str, password: str, redis_client) -> Token:
    """Login unificado: admin hardcoded ou usuário do Redis."""
    email = email.strip().lower()

    # ── Admin ──────────────────────────────────────────────────────────────────
    if email == settings.admin_email.lower():
        if password != settings.admin_password:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Credenciais inválidas.")
        token = _create_token("admin", "admin", "Administrador")
        return Token(
            access_token=token,
            user=UsuarioResponse(
                id="admin", name="Administrador",
                email=settings.admin_email, role="admin"
            ),
        )

    # ── Usuário comum ──────────────────────────────────────────────────────────
    user_id = redis_client.get(USER_EMAIL_IDX + email)
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "E-mail não cadastrado.")

    raw = redis_client.get(USER_PREFIX + user_id)
    if not raw:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Usuário não encontrado.")

    user = json.loads(raw)
    if not pwd_context.verify(password, user["password_hash"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Senha incorreta.")

    token = _create_token(user["id"], "user", user["name"])
    return Token(
        access_token=token,
        user=UsuarioResponse(id=user["id"], name=user["name"], email=email, role="user"),
    )
