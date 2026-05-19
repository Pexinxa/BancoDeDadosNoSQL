import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status

from config import settings
from database import redis_client
from models import LivroCreate, LivroUpdate, LivroResponse, StatusLivro

logger = logging.getLogger(__name__)

# ── Chaves Redis ───────────────────────────────────────────────────────────────
BOOK_PREFIX      = "livro:"
BOOK_INDEX       = "livros:index"
LOAN_USER_PREFIX = "emprestimos:usuario:"   # Set de livro_ids por usuário
LOAN_BOOK_PREFIX = "livro:emprestado_por:"  # user_id de quem emprestou


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _key(livro_id: str) -> str:
    return BOOK_PREFIX + livro_id


def _get_raw_or_404(livro_id: str) -> dict:
    data = redis_client.get(_key(livro_id))
    if not data:
        raise HTTPException(status.HTTP_404_NOT_FOUND,
                            f"Livro '{livro_id}' não encontrado.")
    return json.loads(data)


def _save(livro: dict) -> None:
    pipe = redis_client.pipeline()
    pipe.set(_key(livro["id"]), json.dumps(livro, ensure_ascii=False))
    pipe.sadd(BOOK_INDEX, livro["id"])
    pipe.execute()


# ══════════════════════════════════════════════════════════════════════════════
# LIVROS — CRUD
# ══════════════════════════════════════════════════════════════════════════════

def criar_livro(payload: LivroCreate) -> LivroResponse:
    agora = _now_iso()
    livro = {
        "id": str(uuid.uuid4()),
        **payload.model_dump(),
        "status":       payload.status.value,
        "capa_url":     None,
        "emprestado_por": None,
        "criado_em":    agora,
        "atualizado_em": agora,
    }
    _save(livro)
    logger.info("Livro criado: %s — '%s'", livro["id"], payload.titulo)
    return LivroResponse(**livro)


def listar_livros(
    pagina: int = 1,
    por_pagina: int = 20,
    busca: Optional[str] = None,
    categoria: Optional[str] = None,
    status_filtro: Optional[StatusLivro] = None,
) -> tuple[list[LivroResponse], int]:
    ids = redis_client.smembers(BOOK_INDEX)
    livros: list[dict] = []
    for lid in ids:
        raw = redis_client.get(_key(lid))
        if raw:
            livros.append(json.loads(raw))

    if busca:
        q = busca.lower()
        livros = [l for l in livros if
                  q in l["titulo"].lower() or
                  q in l["autor"].lower()  or
                  q in l["categoria"].lower()]
    if categoria:
        livros = [l for l in livros if l["categoria"].lower() == categoria.lower()]
    if status_filtro:
        livros = [l for l in livros if l["status"] == status_filtro.value]

    livros.sort(key=lambda x: x["titulo"].lower())
    total = len(livros)
    inicio = (pagina - 1) * por_pagina
    return [LivroResponse(**l) for l in livros[inicio: inicio + por_pagina]], total


def buscar_livro(livro_id: str) -> LivroResponse:
    return LivroResponse(**_get_raw_or_404(livro_id))


def atualizar_livro(livro_id: str, payload: LivroUpdate) -> LivroResponse:
    livro = _get_raw_or_404(livro_id)
    updates = payload.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY,
                            "Nenhum campo para atualizar.")
    if "status" in updates and isinstance(updates["status"], StatusLivro):
        updates["status"] = updates["status"].value
    livro.update(updates)
    livro["atualizado_em"] = _now_iso()
    _save(livro)
    logger.info("Livro atualizado: %s", livro_id)
    return LivroResponse(**livro)


def excluir_livro(livro_id: str) -> dict:
    livro = _get_raw_or_404(livro_id)
    # Remove rastro de empréstimo se houver
    emprestado_por = livro.get("emprestado_por")
    pipe = redis_client.pipeline()
    pipe.delete(_key(livro_id))
    pipe.srem(BOOK_INDEX, livro_id)
    pipe.delete(LOAN_BOOK_PREFIX + livro_id)
    if emprestado_por:
        pipe.srem(LOAN_USER_PREFIX + emprestado_por, livro_id)
    pipe.execute()
    logger.info("Livro excluído: %s", livro_id)
    return {"mensagem": f"Livro '{livro_id}' excluído com sucesso."}


def atualizar_capa(livro_id: str, capa_url: str) -> LivroResponse:
    livro = _get_raw_or_404(livro_id)
    livro["capa_url"] = capa_url
    livro["atualizado_em"] = _now_iso()
    _save(livro)
    return LivroResponse(**livro)


# ══════════════════════════════════════════════════════════════════════════════
# EMPRÉSTIMOS
# ══════════════════════════════════════════════════════════════════════════════

def emprestar_livro(livro_id: str, user_id: str, user_name: str) -> LivroResponse:
    """Registra empréstimo. Limite: settings.loan_limit por usuário."""
    livro = _get_raw_or_404(livro_id)

    # 1. Verifica disponibilidade
    if livro["status"] != StatusLivro.disponivel.value:
        raise HTTPException(status.HTTP_409_CONFLICT,
                            "Este livro já está emprestado.")

    # 2. Verifica limite do usuário
    user_loans = redis_client.scard(LOAN_USER_PREFIX + user_id)
    if user_loans >= settings.loan_limit:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Limite de {settings.loan_limit} empréstimos simultâneos atingido. "
            "Devolva um livro antes de pegar outro."
        )

    # 3. Registra atomicamente
    livro["status"]        = StatusLivro.emprestado.value
    livro["emprestado_por"] = user_id
    livro["atualizado_em"] = _now_iso()

    pipe = redis_client.pipeline()
    pipe.set(_key(livro_id), json.dumps(livro, ensure_ascii=False))
    pipe.sadd(BOOK_INDEX, livro_id)
    pipe.sadd(LOAN_USER_PREFIX + user_id, livro_id)
    pipe.set(LOAN_BOOK_PREFIX + livro_id, user_id)
    pipe.execute()

    logger.info("Empréstimo: livro=%s → usuário=%s (%s)", livro_id, user_id, user_name)
    return LivroResponse(**livro)


def devolver_livro(livro_id: str, user_id: str, is_admin: bool = False) -> LivroResponse:
    """Registra devolução. Usuário só pode devolver o que pegou; admin devolve qualquer um."""
    livro = _get_raw_or_404(livro_id)

    if livro["status"] != StatusLivro.emprestado.value:
        raise HTTPException(status.HTTP_409_CONFLICT, "Este livro não está emprestado.")

    # Valida que é o dono do empréstimo (ou admin)
    emprestado_por = livro.get("emprestado_por") or redis_client.get(LOAN_BOOK_PREFIX + livro_id)
    if not is_admin and emprestado_por != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN,
                            "Você não pode devolver um livro que não pegou emprestado.")

    livro["status"]         = StatusLivro.disponivel.value
    livro["emprestado_por"] = None
    livro["atualizado_em"]  = _now_iso()

    pipe = redis_client.pipeline()
    pipe.set(_key(livro_id), json.dumps(livro, ensure_ascii=False))
    pipe.sadd(BOOK_INDEX, livro_id)
    if emprestado_por:
        pipe.srem(LOAN_USER_PREFIX + emprestado_por, livro_id)
    pipe.delete(LOAN_BOOK_PREFIX + livro_id)
    pipe.execute()

    logger.info("Devolução: livro=%s ← usuário=%s", livro_id, user_id)
    return LivroResponse(**livro)


def listar_emprestimos_usuario(user_id: str) -> list[LivroResponse]:
    """Retorna todos os livros atualmente emprestados pelo usuário."""
    livro_ids = redis_client.smembers(LOAN_USER_PREFIX + user_id)
    livros = []
    for lid in livro_ids:
        raw = redis_client.get(_key(lid))
        if raw:
            livros.append(LivroResponse(**json.loads(raw)))
    livros.sort(key=lambda x: x.titulo.lower())
    return livros


# ══════════════════════════════════════════════════════════════════════════════
# ESTATÍSTICAS
# ══════════════════════════════════════════════════════════════════════════════

def obter_estatisticas() -> dict:
    ids = redis_client.smembers(BOOK_INDEX)
    disponiveis = emprestados = total_exemplares = 0
    categorias: dict[str, int] = {}

    for lid in ids:
        raw = redis_client.get(_key(lid))
        if not raw:
            continue
        l = json.loads(raw)
        total_exemplares += l.get("quantidade_disponivel", 0)
        if l.get("status") == StatusLivro.disponivel.value:
            disponiveis += 1
        else:
            emprestados += 1
        cat = l.get("categoria", "Outro")
        categorias[cat] = categorias.get(cat, 0) + 1

    return {
        "total_livros": len(ids),
        "disponiveis":  disponiveis,
        "emprestados":  emprestados,
        "total_exemplares": total_exemplares,
        "categorias":   categorias,
    }
