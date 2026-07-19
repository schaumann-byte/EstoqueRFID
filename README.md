# EstoqueRFID

Sistema de controle de estoque com rastreamento por **RFID**.  
Frontend (Next.js) + Backend (FastAPI) + PostgreSQL.

---

## 🔧 Requisitos Prévia

- **Node.js** 18+ e **npm**
- **Python** 3.10+ e **pip**
- **PostgreSQL** rodando localmente (porta 5432)

---

## 🚀 Passo a Passo Rápidos (Do Clone ao Executar)

### 1. Clonar o repositório
```bash
git clone https://github.com/schaumann-byte/EstoqueRFID.git
cd EstoqueRFID
```

---

### 2. Configurar o Banco de Dados (PostgreSQL)

Abra o PostgreSQL e execute os comandos para criar o usuário e o banco de dados esperados pela aplicação:

```bash
# 1. Definir a senha do usuário postgres e criar o banco 'estoque'
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres478';"
sudo -u postgres psql -c "CREATE DATABASE estoque;"

# 2. Executar os scripts de tabela e dados iniciais
sudo -u postgres psql -d estoque -f db/schema1.sql
sudo -u postgres psql -d estoque -f db/schema2.sql
sudo -u postgres psql -d estoque -f db/schema3.sql
sudo -u postgres psql -d estoque -f db/seed.sql
```

> **Nota:** Se a sua senha ou usuário do Postgres forem diferentes, ajuste no arquivo `backend/.env`.

---

### 3. Configurar e Rodar o Backend (FastAPI)

Em um terminal:

```bash
cd backend

# Criar o ambiente virtual
python -m venv .venv

# Ativar o ambiente virtual:
# Linux / macOS (Bash / Zsh):
source .venv/bin/activate
# Linux (Fish Shell):
source .venv/bin/activate.fish
# Windows (PowerShell):
.\.venv\Scripts\Activate.ps1

# Instalar dependências
pip install -r requirements.txt

# Iniciar o servidor backend
uvicorn app.main:app --reload
```

A API ficará disponível em: **`http://127.0.0.1:8000`**  
Documentação (Swagger UI): **`http://127.0.0.1:8000/docs`**

---

### 4. Configurar e Rodar o Frontend (Next.js)

Em um **segundo terminal**:

```bash
cd frontend

# Instalar dependências do Node
npm install

# Iniciar o frontend em modo de desenvolvimento
npm run dev
```

O Frontend ficará disponível em: **`http://localhost:3000`**

---

## 🔐 Variáveis de Ambiente (`.env`)

### `backend/.env`
```dotenv
DATABASE_URL=postgresql+asyncpg://postgres:postgres478@localhost:5432/estoque
APP_NAME=EstoqueRFID
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
JWT_SECRET=12345678
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

### `frontend/.env`
```dotenv
NEXT_PUBLIC_API_BASE_URL="http://127.0.0.1:8000"
```

---

## 🗂️ Estrutura do Projeto

```
EstoqueRFID/
├─ frontend/           # Next.js 15 (React 19, TailwindCSS)
│  ├─ src/
│  ├─ package.json
│  └─ .env
├─ backend/            # FastAPI (SQLAlchemy async, JWT, bcrypt)
│  ├─ app/
│  │  └─ main.py
│  ├─ requirements.txt
│  └─ .env
├─ db/                 # Schemas SQL e dados iniciais (seed)
└─ códigos_arduino/    # Sketches C++ para ESP32 e Arduino Nano
```

---

## 📜 Bibliotecas necessárias para os códigos Arduino

**Nano (Arduino)**
- `LiquidCrystal_I2C` por johnrickman ([GitHub](https://github.com/johnrickman/LiquidCrystal_I2C))
- `MFRC522` pela comunidade GitHub ([GitHub](https://github.com/miguelbalboa/rfid))
- `Esp_Software_Serial` por Dirk Kaar ([GitHub](https://github.com/sndnvaps/espsoftwareserial/))
