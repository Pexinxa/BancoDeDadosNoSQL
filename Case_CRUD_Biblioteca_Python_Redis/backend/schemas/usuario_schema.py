from pydantic import BaseModel, Field


class UsuarioCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=3, max_length=100)


class LoginResponse(BaseModel):
    msg: str
    username: str
    cargo: str
