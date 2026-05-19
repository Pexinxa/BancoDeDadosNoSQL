import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from controllers.auth_controller import criar_admin_padrao, router as auth_router
from controllers.livro_controller import (
    COVERS_DIR,
    processar_emprestimos_vencidos,
    router as livro_router,
)
from controllers.usuario_controller import router as usuario_router


async def verificar_emprestimos_vencidos():
    while True:
        try:
            processar_emprestimos_vencidos()
        except Exception:
            pass
        await asyncio.sleep(30)


@asynccontextmanager
async def lifespan(app: FastAPI):
    criar_admin_padrao()
    tarefa = asyncio.create_task(verificar_emprestimos_vencidos())
    try:
        yield
    finally:
        tarefa.cancel()


app = FastAPI(
    title="Biblioteca Municipal Online",
    description="API REST — Biblioteca Digital com autenticacao HTTP Basic, upload de capas e controle de emprestimos.",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve capas como arquivos estáticos em /covers
os.makedirs(COVERS_DIR, exist_ok=True)
app.mount("/covers", StaticFiles(directory=COVERS_DIR), name="covers")

app.include_router(auth_router)
app.include_router(livro_router)
app.include_router(usuario_router)


@app.get("/", tags=["Health"])
def raiz():
    return {
        "msg": "API Biblioteca em execucao",
        "docs": "Acesse /docs para ver a documentacao",
    }
