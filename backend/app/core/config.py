# app/config.py
from pydantic_settings import BaseSettings
from typing import List
from ast import literal_eval


class Settings(BaseSettings):
    # Banco de dados
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres"

    # Configurações gerais do app
    APP_NAME: str = "Estoque API"

    # JWT e autenticação
    JWT_SECRET: str
    JWT_ALG: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS (origens permitidas para o frontend)
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Inicializa as configurações globais
settings = Settings()

# Permitir string JSON/array no .env
if isinstance(settings.CORS_ORIGINS, str):
    try:
        settings.CORS_ORIGINS = literal_eval(settings.CORS_ORIGINS)
    except Exception:
        settings.CORS_ORIGINS = [settings.CORS_ORIGINS]

