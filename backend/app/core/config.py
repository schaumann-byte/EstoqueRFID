from pydantic_settings import BaseSettings
from typing import List
from ast import literal_eval


class Settings(BaseSettings):
    # -----------------------------#
    # Banco de Dados
    # -----------------------------#
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres"

    # -----------------------------#
    # Configurações gerais
    # -----------------------------#
    APP_NAME: str = "EstoqueRFID"

    # -----------------------------#
    # JWT e autenticação
    # -----------------------------#
    JWT_SECRET: str
    JWT_ALG: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # -----------------------------#
    # CORS (origens permitidas)
    # -----------------------------#
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Instância global
settings = Settings()

# -----------------------------#
# Ajuste pós-carregamento
# -----------------------------#

# Corrige CORS_ORIGINS se vier como string JSON
if isinstance(settings.CORS_ORIGINS, str):
    try:
        settings.CORS_ORIGINS = literal_eval(settings.CORS_ORIGINS)
    except Exception:
        settings.CORS_ORIGINS = [settings.CORS_ORIGINS]

# -----------------------------#
# Exports diretos (para compatibilidade)
# -----------------------------#
APP_NAME = settings.APP_NAME
DATABASE_URL = settings.DATABASE_URL
JWT_SECRET = settings.JWT_SECRET
JWT_ALG = settings.JWT_ALG
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES
REFRESH_TOKEN_EXPIRE_DAYS = settings.REFRESH_TOKEN_EXPIRE_DAYS
CORS_ORIGINS = settings.CORS_ORIGINS



