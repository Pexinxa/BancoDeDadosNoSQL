from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, EmailStr, field_validator


class StatusLivro(str, Enum):
    disponivel = "Disponível"
    emprestado = "Emprestado"


# ══════════════════════════════════════════════════════════════════════════════
# LIVROS
# ══════════════════════════════════════════════════════════════════════════════

class LivroCreate(BaseModel):
    titulo: str = Field(..., min_length=1, max_length=200)
    autor: str  = Field(..., min_length=1, max_length=150)
    categoria: str = Field(..., min_length=1, max_length=100)
    ano_publicacao: int = Field(..., ge=1000, le=2100)
    quantidade_disponivel: int = Field(..., ge=0)
    status: StatusLivro = Field(default=StatusLivro.disponivel)

    @field_validator("titulo", "autor", "categoria", mode="before")
    @classmethod
    def strip_strings(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v


class LivroUpdate(BaseModel):
    titulo: Optional[str] = Field(None, min_length=1, max_length=200)
    autor: Optional[str]  = Field(None, min_length=1, max_length=150)
    categoria: Optional[str] = Field(None, min_length=1, max_length=100)
    ano_publicacao: Optional[int] = Field(None, ge=1000, le=2100)
    quantidade_disponivel: Optional[int] = Field(None, ge=0)
    status: Optional[StatusLivro] = None

    @field_validator("titulo", "autor", "categoria", mode="before")
    @classmethod
    def strip_strings(cls, v: Optional[str]) -> Optional[str]:
        return v.strip() if isinstance(v, str) else v


class LivroResponse(BaseModel):
    id: str
    titulo: str
    autor: str
    categoria: str
    ano_publicacao: int
    quantidade_disponivel: int
    status: StatusLivro
    capa_url: Optional[str] = None      # ex: "/covers/abc123.jpg"
    emprestado_por: Optional[str] = None  # user_id de quem emprestou
    criado_em: str
    atualizado_em: str


class LivroListResponse(BaseModel):
    total: int
    pagina: int
    por_pagina: int
    livros: list[LivroResponse]


class EstatisticasResponse(BaseModel):
    total_livros: int
    disponiveis: int
    emprestados: int
    total_exemplares: int
    categorias: dict[str, int]


# ══════════════════════════════════════════════════════════════════════════════
# USUÁRIOS
# ══════════════════════════════════════════════════════════════════════════════

class UsuarioCreate(BaseModel):
    name: str  = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=150)
    password: str = Field(..., min_length=6, max_length=100)

    @field_validator("name", "email", mode="before")
    @classmethod
    def strip(cls, v: str) -> str:
        return v.strip() if isinstance(v, str) else v


class UsuarioResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str


# ══════════════════════════════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════════════════════════════

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UsuarioResponse


class TokenData(BaseModel):
    user_id: str
    role: str
    name: str


# ══════════════════════════════════════════════════════════════════════════════
# EMPRÉSTIMOS
# ══════════════════════════════════════════════════════════════════════════════

class EmprestimoResponse(BaseModel):
    livro_id: str
    user_id: str
    user_name: str
    livro_titulo: str


class MeusEmprestimosResponse(BaseModel):
    total: int
    limite: int
    emprestimos: list[LivroResponse]
