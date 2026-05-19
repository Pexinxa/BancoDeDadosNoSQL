from typing import Optional
from pydantic import BaseModel


class Emprestimo(BaseModel):
    username: str
    livro_id: int
    devolucao_em: int


class EmprestimoDetalhado(BaseModel):
    id: int
    username: str
    livro_id: int
    devolucao_em: int
    titulo: str = ""
    autor: str = ""
    categoria: str = ""
