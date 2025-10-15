import os
from dotenv import load_dotenv

# Carrega variáveis do .env (se existir)
load_dotenv()

# Sem pydantic_settings: leitura direta do ambiente
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/postgres",
)

APP_NAME = os.getenv("APP_NAME", "Estoque API")