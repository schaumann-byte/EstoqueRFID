from fastapi import FastAPI
from .routers.metrics_router import router as metrics_router
from fastapi.middleware.cors import CORSMiddleware
from .routers import rfid_router
from .auth.router import router as auth_router

app = FastAPI(title="EstoqueRFID")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rotas
app.include_router(metrics_router)
app.include_router(rfid_router.router)
app.include_router(auth_router)


# Healthcheck simples
@app.get("/health")
def health():
    return {"status": "ok"}
