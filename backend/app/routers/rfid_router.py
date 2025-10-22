from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from ..db import get_session
from ..repositories.metrics_repo import update_item_heartbeat, bulk_update_item_heartbeat

router = APIRouter(prefix="/rfid", tags=["rfid"])

class HeartbeatIn(BaseModel):
    etiqueta_rfid: str
    origem: Optional[str] = None            # ex: "porta-A", "esp32-01"
    evento: Optional[str] = None            # "READ" | "SEEN" | "FOUND" (opcional, só p/ log)

class HeartbeatOut(BaseModel):
    id: int
    codigo_produto: int
    etiqueta_rfid: str
    ultima_verificacao: str
    origem_ultima_verificacao: Optional[str] = None
    em_estoque: bool

@router.post("/heartbeat", response_model=HeartbeatOut)
async def heartbeat(
    payload: HeartbeatIn,
    session: AsyncSession = Depends(get_session),
):
    row = await update_item_heartbeat(session, payload.etiqueta_rfid, payload.origem)
    if not row:
        # 404 se não existe; 409 se está fora de estoque (ver abaixo)
        raise HTTPException(status_code=404, detail="RFID não encontrado ou não está em estoque")
    return row

class BulkHeartbeatIn(BaseModel):
    itens: List[HeartbeatIn]

@router.post("/heartbeat/bulk", response_model=List[HeartbeatOut])
async def heartbeat_bulk(
    payload: BulkHeartbeatIn,
    session: AsyncSession = Depends(get_session),
):
    return await bulk_update_item_heartbeat(session, payload.itens)
