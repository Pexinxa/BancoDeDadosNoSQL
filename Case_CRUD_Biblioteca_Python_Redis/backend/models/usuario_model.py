from pydantic import BaseModel


class Usuario(BaseModel):
    username: str
    cargo: str
