from fastapi import FastAPI
from .core.config import APP_NAME
from .routers.metrics import router as metrics_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title=APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas
app.include_router(metrics_router)

# Healthcheck simples
@app.get("/health")
def health():
    return {"status": "ok"}
