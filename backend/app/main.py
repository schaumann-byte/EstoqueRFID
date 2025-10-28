from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers.metrics_router import router as metrics_router
from .routers import rfid_router
from .auth.router import router as auth_router
from app.core.config import settings   # <- use settings

app = FastAPI(title="EstoqueRFID")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # <- use somente as origens configuradas
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(metrics_router)
app.include_router(rfid_router.router)
app.include_router(auth_router)

@app.get("/health")
def health():
    return {"status": "ok"}
