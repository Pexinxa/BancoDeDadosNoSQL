from enum import Enum


class Status(str, Enum):
    Disponivel = "Disponivel"
    Emprestado = "Emprestado"
