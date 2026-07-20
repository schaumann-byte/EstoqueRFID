import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from pathlib import Path

#MUDAR ISSO
DB_NAME = "estoque"
DB_USER = "postgres"
DB_PASSWORD = "postgres478" 
DB_HOST = "localhost"
DB_PORT = "5432"


def database_exists(conn):
    with conn.cursor() as cur:
        cur.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s",
            (DB_NAME,)
        )
        return cur.fetchone() is not None


def create_database(conn):
    #conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute(f"CREATE DATABASE {DB_NAME}")


def run_sql_file(conn, file_path):
    print(f"Running {file_path.name}")
    with conn.cursor() as cur:
        with open(file_path, "r", encoding="utf-8") as f:
            cur.execute(f.read())
    conn.commit()


def init_database():

    # conecta no postgres padrão
    conn = psycopg2.connect(
        dbname="postgres",
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT) # Necessário para CREATE DATABASE

    if database_exists(conn):
        print(f"Database '{DB_NAME}' already exists.")
        # falta checar se as tabelas já existem também
        return

    print(f"Creating database '{DB_NAME}'...")
    create_database(conn)
    conn.close()

    # conecta na nova database
    conn = psycopg2.connect(
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
    )

    db_folder = Path(__file__).resolve().parents[3] / "db"

    sql_order = [
        "reset_schema.sql",
        "schema1.sql",
        "schema2.sql",
        "schema3.sql",
        "seed.sql",
    ]

    for file in sql_order:
        run_sql_file(conn, db_folder / file)

    conn.close()

    print("Database initialized successfully.")