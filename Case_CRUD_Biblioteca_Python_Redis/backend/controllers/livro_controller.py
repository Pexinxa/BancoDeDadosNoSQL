import json
import os
import time
import unicodedata

import aiofiles
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from pydantic import ValidationError
from redis.exceptions import RedisError

from controllers.auth_controller import exigir_admin, exigir_user, tratar_erro_redis
from database.redis_db import r
from enums.status_enum import Status
from models.livro_model import Livro
from schemas.livro_schema import LivroCreate, LivroUpdate

router = APIRouter(tags=["Livros"])

PRAZO_EMPRESTIMO_SEGUNDOS = 600   # 10 minutos
MAX_EMPRESTIMOS_USUARIO   = 3
COVERS_DIR                = os.getenv("COVERS_DIR", "/covers")
ALLOWED_IMAGE_TYPES       = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_FILE_SIZE             = 5 * 1024 * 1024


# ── Helpers de chave ──────────────────────────────────────────────────────────

def chave_livro(livro_id: int) -> str:
    return f"livro:{livro_id}"


def chave_emprestimo(username: str, livro_id: int) -> str:
    return f"emprestimo:{username}:{livro_id}"


def chave_emprestimos_usuario(username: str) -> str:
    return f"usuario:{username}:emprestimos"


def chave_favoritos_usuario(username: str) -> str:
    return f"usuario:{username}:favoritos"


def chave_espera_usuario(username: str) -> str:
    return f"usuario:{username}:espera"


def chave_espera_livro(livro_id: int) -> str:
    return f"livro:{livro_id}:espera"


def chave_notificacoes_usuario(username: str) -> str:
    return f"usuario:{username}:notificacoes"


# ── Helpers ───────────────────────────────────────────────────────────────────

def titulo_para_filename(titulo: str) -> str:
    
    import re
    s = unicodedata.normalize("NFD", titulo)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.lower().strip()
    s = "".join(c if c.isalnum() or c == " " else " " for c in s)  # especiais → espaço
    s = re.sub(r"\s+", "_", s.strip())   # colapsa espaços consecutivos → _ único
    s = re.sub(r"_+", "_", s)            # garante que nunca há __ duplo
    return s


def validar_livro(dados_livro: dict):
    try:
        return Livro(**dados_livro)
    except ValidationError as exc:
        raise HTTPException(
            status_code=500,
            detail="Dados do livro armazenados em formato invalido",
        ) from exc


def gerar_id():
    try:
        return r.incr("livro_id")
    except RedisError:
        tratar_erro_redis()


def atualizar_status_livro(livro_id: int):
    livro = r.hgetall(chave_livro(livro_id))
    if not livro:
        return
    quantidade = int(livro.get("quantidade", 0))
    status = Status.Disponivel.value if quantidade > 0 else Status.Emprestado.value
    r.hset(chave_livro(livro_id), mapping={"status": status})


def notificar_usuarios_em_espera(livro_id: int):
    usuarios = r.smembers(chave_espera_livro(livro_id))
    livro = r.hgetall(chave_livro(livro_id))
    titulo = livro.get("titulo", f"Livro #{livro_id}")

    for username in usuarios:
        notif = json.dumps({"mensagem": f'"{titulo}" voltou ao estoque', "lida": False})
        r.rpush(chave_notificacoes_usuario(username), notif)
        r.srem(chave_espera_usuario(username), livro_id)

    r.delete(chave_espera_livro(livro_id))


def devolver_emprestimo(username: str, livro_id: int, notificar_atraso: bool = False):
    chave = chave_emprestimo(username, livro_id)

    if not r.exists(chave):
        raise HTTPException(status_code=404, detail="Emprestimo nao encontrado")

    livro = r.hgetall(chave_livro(livro_id))
    titulo = livro.get("titulo", f"Livro #{livro_id}")

    r.delete(chave)
    r.srem(chave_emprestimos_usuario(username), livro_id)
    r.zrem("emprestimos_vencimento", f"{username}:{livro_id}")
    r.hincrby(chave_livro(livro_id), "quantidade", 1)
    atualizar_status_livro(livro_id)

    if notificar_atraso:
        notif = json.dumps({
            "mensagem": f'Removemos "{titulo}" da sua conta. Tempo limite atingido',
            "lida": False,
        })
        r.rpush(chave_notificacoes_usuario(username), notif)

    notificar_usuarios_em_espera(livro_id)


def processar_emprestimos_vencidos():
    agora = int(time.time())
    try:
        vencidos = r.zrangebyscore("emprestimos_vencimento", 0, agora)
        for item in vencidos:
            username, livro_id_texto = item.split(":", 1)
            livro_id = int(livro_id_texto)
            if r.exists(chave_emprestimo(username, livro_id)):
                devolver_emprestimo(username, livro_id, notificar_atraso=True)
            else:
                r.zrem("emprestimos_vencimento", item)
    except RedisError:
        tratar_erro_redis()


def livro_tem_emprestimos_ativos(livro_id: int) -> bool:
    for chave in r.scan_iter(f"emprestimo:*:{livro_id}"):
        if r.exists(chave):
            return True
    return False


def emprestar_livro(username: str, livro_id: int):
    processar_emprestimos_vencidos()
    try:
        livro = r.hgetall(chave_livro(livro_id))
        if not livro:
            raise HTTPException(status_code=404, detail="Livro nao encontrado")
        if r.exists(chave_emprestimo(username, livro_id)):
            raise HTTPException(status_code=409, detail="Usuario ja esta com este livro")

        total_emprestimos = r.scard(chave_emprestimos_usuario(username))
        if total_emprestimos >= MAX_EMPRESTIMOS_USUARIO:
            raise HTTPException(
                status_code=400,
                detail="Usuario pode ter no maximo 3 livros emprestados",
            )

        quantidade = int(livro.get("quantidade", 0))
        if quantidade <= 0:
            raise HTTPException(
                status_code=409,
                detail="Livro sem estoque. Adicione na espera para ser notificado",
            )

        devolucao_em = int(time.time()) + PRAZO_EMPRESTIMO_SEGUNDOS
        r.hincrby(chave_livro(livro_id), "quantidade", -1)
        atualizar_status_livro(livro_id)
        r.hset(
            chave_emprestimo(username, livro_id),
            mapping={
                "username": username,
                "livro_id": livro_id,
                "devolucao_em": devolucao_em,
            },
        )
        r.sadd(chave_emprestimos_usuario(username), livro_id)
        r.zadd("emprestimos_vencimento", {f"{username}:{livro_id}": devolucao_em})
    except RedisError:
        tratar_erro_redis()

    return {
        "msg": "Livro emprestado com sucesso",
        "livro_id": livro_id,
        "devolucao_em": devolucao_em,
    }


def devolver_livro(username: str, livro_id: int):
    processar_emprestimos_vencidos()
    try:
        devolver_emprestimo(username, livro_id)
    except RedisError:
        tratar_erro_redis()
    return {"msg": "Livro devolvido com sucesso", "livro_id": livro_id}


# ── Rotas ─────────────────────────────────────────────────────────────────────

@router.post("/livros", status_code=201, dependencies=[Depends(exigir_admin)])
def criar_livro(livro: LivroCreate):
    novo_id = gerar_id()
    chave = chave_livro(novo_id)
    dados_livro = livro.model_dump()
    dados_livro["id"] = novo_id
    dados_livro["status"] = Status.Disponivel.value
    # None → string vazia no Redis (hash não suporta None)
    if dados_livro.get("sinopse") is None:
        dados_livro["sinopse"] = ""
    try:
        r.hset(chave, mapping=dados_livro)
    except RedisError:
        tratar_erro_redis()
    return {"msg": "Livro criado com sucesso", "id": novo_id}


@router.get("/livros", response_model=list[Livro])
def listar_livros():
    livros = []
    processar_emprestimos_vencidos()
    try:
        for chave in r.scan_iter("livro:*"):
            if ":espera" in chave:
                continue
            dados = r.hgetall(chave)
            if dados:
                livros.append(validar_livro(dados))
    except RedisError:
        tratar_erro_redis()
    return livros


@router.get("/livros/{livro_id}", response_model=Livro)
def buscar_livro(livro_id: int):
    processar_emprestimos_vencidos()
    chave = chave_livro(livro_id)
    try:
        dados_livro = r.hgetall(chave)
    except RedisError:
        tratar_erro_redis()
    if not dados_livro:
        raise HTTPException(status_code=404, detail="Livro nao encontrado")
    return validar_livro(dados_livro)


@router.put("/livros/{livro_id}", dependencies=[Depends(exigir_admin)])
def atualizar_livro(livro_id: int, livro: LivroUpdate):
    chave = chave_livro(livro_id)
    dados_livro = livro.model_dump()
    dados_livro["id"] = livro_id
    dados_livro["status"] = (
        Status.Disponivel.value if dados_livro["quantidade"] > 0 else Status.Emprestado.value
    )
    if dados_livro.get("sinopse") is None:
        dados_livro["sinopse"] = ""
    try:
        if not r.exists(chave):
            raise HTTPException(status_code=404, detail="Livro nao encontrado")
        r.hset(chave, mapping=dados_livro)
    except RedisError:
        tratar_erro_redis()
    return {"msg": "Livro atualizado com sucesso"}


@router.delete("/livros/{livro_id}", dependencies=[Depends(exigir_admin)])
def deletar_livro(livro_id: int):
    chave = chave_livro(livro_id)
    processar_emprestimos_vencidos()
    try:
        if livro_tem_emprestimos_ativos(livro_id):
            raise HTTPException(
                status_code=409,
                detail="Livro possui emprestimos ativos e nao pode ser apagado",
            )
        removidos = r.delete(chave)
    except RedisError:
        tratar_erro_redis()
    if removidos == 0:
        raise HTTPException(status_code=404, detail="Livro nao encontrado")
    return {"msg": "Livro deletado com sucesso"}


@router.post("/livros/{livro_id}/emprestar")
def emprestar(livro_id: int, usuario: dict = Depends(exigir_user)):
    return emprestar_livro(usuario["username"], livro_id)


@router.post("/livros/{livro_id}/devolver")
def devolver(livro_id: int, usuario: dict = Depends(exigir_user)):
    return devolver_livro(usuario["username"], livro_id)


@router.post("/livros/upload-capa", dependencies=[Depends(exigir_admin)])
async def upload_capa(titulo: str, file: UploadFile = File(...)):
    """Salva a capa do livro em /covers/{titulo_normalizado}.png"""
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Tipo nao suportado: {file.content_type}. Use JPEG, PNG ou WebP.",
        )
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Arquivo muito grande. Limite: 5 MB.")

    os.makedirs(COVERS_DIR, exist_ok=True)

    # Determina extensão pelo content-type do arquivo enviado
    ext_map = {
        "image/jpeg": ".jpg",
        "image/png":  ".png",
        "image/webp": ".webp",
        "image/gif":  ".gif",
    }
    ext = ext_map.get(file.content_type, ".png")
    base = titulo_para_filename(titulo)

    # Remove capas anteriores deste livro (qualquer extensão)
    for old_ext in (".png", ".jpg", ".jpeg", ".webp", ".gif"):
        old_path = os.path.join(COVERS_DIR, base + old_ext)
        if os.path.exists(old_path):
            os.remove(old_path)

    filename = base + ext
    filepath = os.path.join(COVERS_DIR, filename)

    async with aiofiles.open(filepath, "wb") as f:
        await f.write(content)

    return {"msg": "Capa salva com sucesso", "filename": filename}
