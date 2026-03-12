# EstoqueRFID

Sistema de controle de estoque com rastreamento por **RFID**.  
Frontend (Next.js) + Backend (FastAPI) + PostgreSQL.

## 🔧 Requisitos

- **Node.js** 18+ (ou 20+ recomendado) e **npm**
- **Python** 3.10+ e **pip**
- **PostgreSQL** rodando localmente
- (Opcional) **virtualenv** / `python -m venv` para isolar o backend

## 📦 Clonar o repositório

```bash
git clone https://github.com/SEU_USUARIO/EstoqueRFID.git
cd EstoqueRFID
```

> Ajuste a URL acima para o seu repositório real.

---

## 🗂️ Estrutura (resumo)

```
EstoqueRFID/
├─ frontend/           # Next.js
│  ├─ package.json
│  └─ .env             # (crie você)
├─ backend/            # FastAPI
│  ├─ app/
│  │  └─ main.py       # app.main:app
│  ├─ requirements.txt
│  └─ .env             # (crie você)
└─ README.md
```

---

## 🔐 Variáveis de ambiente

Crie um arquivo **`.env`** dentro de **`backend/`** com:

```dotenv
# Ajuste os valores conforme seu Postgres (Do back)
DATABASE_URL=postgresql+asyncpg://postgres:**********@localhost:5432/estoque
APP_NAME=EstoqueRFID
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
JWT_SECRET=*********
CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
```

Crie um arquivo **`.env`** dentro de **`frontend/`** com:

```dotenv
# Ajuste os valores (Do front)
NEXT_PUBLIC_API_BASE_URL="http://127.0.0.1:8000"
```

> **Importante:** mantenha esses arquivos fora do controle de versão público.

---

## ▶️ Rodando o Frontend

1. Entre na pasta do frontend:
   ```bash
   cd frontend
   ```
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   # ou, se o seu script se chama "deve" no package.json:
   npm run deve
   ```
4. Acesse: **http://localhost:3000**

---

## 🐍 Rodando o Backend (FastAPI)

1. Entre na pasta do backend:
   ```bash
   cd backend
   ```

2. (Recomendado) Crie e ative um ambiente virtual:

   **Windows (PowerShell):**
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate
   ```

   **Linux/macOS:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   ```

3. Instale os requirements:
   ```bash
   pip install -r requirements.txt
   ```

4. Suba a API com **Uvicorn** (hot-reload):
   ```bash
   uvicorn app.main:app --reload
   ```
   A API ficará em **http://127.0.0.1:8000**

---

## 🔗 Integração Front ↔ Back

- Garanta que **`NEXT_PUBLIC_API_BASE_URL`** no **frontend/.env** aponte para o endereço do backend (ex.: `http://127.0.0.1:8000`).
- Garanta que **`CORS_ORIGINS`** no **backend/.env** inclua as origens do frontend:
  ```dotenv
  CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
  ```

---

## 🧪 Teste rápido

- Frontend: abra **http://localhost:3000**
- Backend: abra **http://127.0.0.1:8000/docs** para a UI do Swagger

---

## 🛠️ Dicas & Troubleshooting

- **Porta 3000 ocupada** no frontend:  
  Rode com outra porta:
  ```bash
  PORT=3001 npm run dev
  ```
- **Porta 8000 ocupada** no backend:  
  ```bash
  uvicorn app.main:app --reload --port 8001
  ```
- **Erro de CORS**: verifique `CORS_ORIGINS` no backend e a URL do frontend.
- **Conexão com Postgres**: confira `DATABASE_URL` e se o serviço está acessível:
  - Host, porta, usuário, senha e nome do DB.
  - Ex.: `postgresql+asyncpg://postgres:senha@localhost:5432/estoque`.

---

## 📜 Scripts úteis

**Frontend**
```bash
# dentro de frontend/
npm install
npm run dev     # ou npm run deve (se seu script tiver esse nome)
```

**Backend**
```bash
# dentro de backend/
python -m venv .venv
# Windows:
.\.venv\Scripts\Activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

## 📜 Bibliotecas necessárias para os códigos Arduino

**Esp32**
```bash
# dentro de frontend/
npm install
npm run dev     # ou npm run deve (se seu script tiver esse nome)
```

**Nano**
```bash
LiquidCrystal_I2C by johnrickman (https://github.com/johnrickman/LiquidCrystal_I2C)
MFRC522 by github community (https://github.com/miguelbalboa/rfid)
Esp_Software_Serial by Dirk Kaar (https://github.com/sndnvaps/espsoftwareserial/)

```
