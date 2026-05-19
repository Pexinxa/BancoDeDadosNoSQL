import json

from fastapi import APIRouter, Depends, HTTPException
from redis.exceptions import RedisError

from controllers.auth_controller import (
    ADMIN_USERNAME,
    chave_usuario,
    exigir_admin,
    exigir_user,
    tratar_erro_redis,
)
from controllers.livro_controller import (
    chave_emprestimo,
    chave_emprestimos_usuario,
    chave_espera_livro,
    chave_espera_usuario,
    chave_favoritos_usuario,
    chave_livro,
    chave_notificacoes_usuario,
    devolver_emprestimo,
    processar_emprestimos_vencidos,
    validar_livro,
)
from database.redis_db import r
from models.emprestimo_model import EmprestimoDetalhado
from models.livro_model import Livro

router = APIRouter(tags=["Usuarios"])


def _parse_notif(raw: str, index: int) -> dict:
    """Converte uma string ou JSON de notificação em dict padronizado."""
    try:
        obj = json.loads(raw)
        return {"mensagem": obj.get("mensagem", raw), "lida": obj.get("lida", False), "index": index}
    except (json.JSONDecodeError, TypeError):
        return {"mensagem": raw, "lida": False, "index": index}


# ── Admin ─────────────────────────────────────────────────────────────────────

@router.get("/auth/usuarios", dependencies=[Depends(exigir_admin)])
def listar_usuarios():
    usuarios = []
    processar_emprestimos_vencidos()
    try:
        for chave in r.scan_iter("usuario:*"):
            if chave.count(":") > 1:
                continue
            usuario = r.hgetall(chave)
            if usuario:
                usuarios.append({
                    "username": usuario["username"],
                    "cargo": usuario["cargo"],
                    "emprestimos_ativos": r.scard(chave_emprestimos_usuario(usuario["username"])),
                })
    except RedisError:
        tratar_erro_redis()
    return usuarios


@router.delete("/auth/usuarios/{username}", dependencies=[Depends(exigir_admin)])
def deletar_usuario(username: str):
    if username == ADMIN_USERNAME:
        raise HTTPException(status_code=400, detail="Usuario admin nao pode ser deletado")
    try:
        if not r.exists(chave_usuario(username)):
            raise HTTPException(status_code=404, detail="Usuario nao encontrado")

        livros_emprestados = list(r.smembers(chave_emprestimos_usuario(username)))
        for livro_id in livros_emprestados:
            devolver_emprestimo(username, int(livro_id))

        for livro_id in r.smembers(chave_espera_usuario(username)):
            r.srem(chave_espera_livro(int(livro_id)), username)

        r.delete(
            chave_usuario(username),
            chave_emprestimos_usuario(username),
            chave_favoritos_usuario(username),
            chave_espera_usuario(username),
            chave_notificacoes_usuario(username),
        )
    except RedisError:
        tratar_erro_redis()
    return {"msg": "Usuario deletado com sucesso"}


# ── Empréstimos ───────────────────────────────────────────────────────────────

@router.get("/usuarios/me/emprestimos", response_model=list[EmprestimoDetalhado])
def listar_emprestimos(usuario: dict = Depends(exigir_user)):
    emprestimos = []
    processar_emprestimos_vencidos()
    try:
        livros_ids = r.smembers(chave_emprestimos_usuario(usuario["username"]))
        for livro_id in livros_ids:
            dados_emp = r.hgetall(chave_emprestimo(usuario["username"], int(livro_id)))
            if not dados_emp:
                continue
            dados_livro = r.hgetall(chave_livro(int(livro_id)))
            emprestimos.append(EmprestimoDetalhado(
                id=int(livro_id),
                username=dados_emp.get("username", usuario["username"]),
                livro_id=int(livro_id),
                devolucao_em=int(dados_emp.get("devolucao_em", 0)),
                titulo=dados_livro.get("titulo", ""),
                autor=dados_livro.get("autor", ""),
                categoria=dados_livro.get("categoria", ""),
            ))
    except RedisError:
        tratar_erro_redis()
    return emprestimos


# ── Favoritos ─────────────────────────────────────────────────────────────────

@router.post("/livros/{livro_id}/favoritos")
def adicionar_favorito(livro_id: int, usuario: dict = Depends(exigir_user)):
    try:
        if not r.exists(chave_livro(livro_id)):
            raise HTTPException(status_code=404, detail="Livro nao encontrado")
        r.sadd(chave_favoritos_usuario(usuario["username"]), livro_id)
    except RedisError:
        tratar_erro_redis()
    return {"msg": "Livro adicionado aos favoritos", "livro_id": livro_id}


@router.delete("/livros/{livro_id}/favoritos")
def remover_favorito(livro_id: int, usuario: dict = Depends(exigir_user)):
    try:
        r.srem(chave_favoritos_usuario(usuario["username"]), livro_id)
    except RedisError:
        tratar_erro_redis()
    return {"msg": "Livro removido dos favoritos", "livro_id": livro_id}


@router.get("/usuarios/me/favoritos", response_model=list[Livro])
def listar_favoritos(usuario: dict = Depends(exigir_user)):
    livros = []
    processar_emprestimos_vencidos()
    try:
        favoritos = r.smembers(chave_favoritos_usuario(usuario["username"]))
        for livro_id in favoritos:
            dados_livro = r.hgetall(chave_livro(int(livro_id)))
            if dados_livro:
                livros.append(validar_livro(dados_livro))
    except RedisError:
        tratar_erro_redis()
    return livros


# ── Lista de espera ───────────────────────────────────────────────────────────

@router.post("/livros/{livro_id}/espera")
def adicionar_espera(livro_id: int, usuario: dict = Depends(exigir_user)):
    processar_emprestimos_vencidos()
    try:
        livro = r.hgetall(chave_livro(livro_id))
        if not livro:
            raise HTTPException(status_code=404, detail="Livro nao encontrado")
        if int(livro.get("quantidade", 0)) > 0:
            raise HTTPException(
                status_code=400,
                detail="Livro possui estoque disponivel para emprestimo",
            )
        r.sadd(chave_espera_usuario(usuario["username"]), livro_id)
        r.sadd(chave_espera_livro(livro_id), usuario["username"])
    except RedisError:
        tratar_erro_redis()
    return {"msg": "Usuario adicionado na espera do livro", "livro_id": livro_id}


@router.get("/usuarios/me/espera", response_model=list[Livro])
def listar_espera(usuario: dict = Depends(exigir_user)):
    livros = []
    processar_emprestimos_vencidos()
    try:
        espera = r.smembers(chave_espera_usuario(usuario["username"]))
        for livro_id in espera:
            dados_livro = r.hgetall(chave_livro(int(livro_id)))
            if dados_livro:
                livros.append(validar_livro(dados_livro))
    except RedisError:
        tratar_erro_redis()
    return livros


# ── Notificações ──────────────────────────────────────────────────────────────

@router.get("/usuarios/me/notificacoes")
def listar_notificacoes(usuario: dict = Depends(exigir_user)):
    try:
        raws = r.lrange(chave_notificacoes_usuario(usuario["username"]), 0, -1)
    except RedisError:
        tratar_erro_redis()
    return [_parse_notif(raw, i) for i, raw in enumerate(raws)]


@router.patch("/usuarios/me/notificacoes/{notificacao_index}/lida")
def marcar_notificacao_lida(notificacao_index: int, usuario: dict = Depends(exigir_user)):
    chave = chave_notificacoes_usuario(usuario["username"])
    try:
        total = r.llen(chave)
        if notificacao_index < 0 or notificacao_index >= total:
            raise HTTPException(status_code=404, detail="Notificacao nao encontrada")
        raw = r.lindex(chave, notificacao_index)
        obj = _parse_notif(raw, notificacao_index)
        obj["lida"] = True
        r.lset(chave, notificacao_index, json.dumps({"mensagem": obj["mensagem"], "lida": True}))
    except RedisError:
        tratar_erro_redis()
    return {"msg": "Notificacao marcada como lida"}


@router.delete("/usuarios/me/notificacoes/{notificacao_index}")
def remover_notificacao(notificacao_index: int, usuario: dict = Depends(exigir_user)):
    chave = chave_notificacoes_usuario(usuario["username"])
    marcador = "__remover_notificacao__"
    try:
        total = r.llen(chave)
        if notificacao_index < 0 or notificacao_index >= total:
            raise HTTPException(status_code=404, detail="Notificacao nao encontrada")
        r.lset(chave, notificacao_index, marcador)
        r.lrem(chave, 1, marcador)
    except RedisError:
        tratar_erro_redis()
    return {"msg": "Notificacao removida com sucesso"}
