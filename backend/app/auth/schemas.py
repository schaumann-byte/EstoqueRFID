# app/auth/schemas.py
from typing import Annotated
from pydantic import BaseModel, EmailStr, StringConstraints

StrNome = Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=50)]
StrPosto = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=40)]
StrSenha = Annotated[str, StringConstraints(min_length=8)]

class SignupIn(BaseModel):
    username: StrNome
    email: EmailStr
    posto_graduacao: StrPosto
    password: StrSenha

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    posto_graduacao: str

class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class AccessToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
