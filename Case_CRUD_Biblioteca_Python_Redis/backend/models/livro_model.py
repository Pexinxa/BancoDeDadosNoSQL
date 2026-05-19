from typing import Optional
from pydantic import BaseModel
from enums.status_enum import Status


class Livro(BaseModel):
    id: int
    titulo: str
    autor: str
    categoria: str
    ano: int
    quantidade: int
    status: Status
    sinopse: Optional[str] = None
