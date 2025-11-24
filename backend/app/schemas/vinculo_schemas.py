from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional, List


class OutOfStockItem(BaseModel):
    """Item fora de estoque disponível para vinculação"""
    id: int
    codigo_produto: int
    etiqueta_rfid: str
    timestamp_entrada: datetime
    timestamp_saida: Optional[datetime]
    data_validade: Optional[date] = None
    ultima_verificacao: Optional[datetime] = None
    origem_ultima_verificacao: Optional[str] = None
    descricao: str
    categoria: Optional[str] = None
    marca: Optional[str] = None
    ja_vinculado: bool


class OutOfStockItemsPage(BaseModel):
    """Página de itens fora de estoque"""
    items: List[OutOfStockItem]
    total: int
    page: int
    page_size: int


class VincularItemRequest(BaseModel):
    """Request para vincular um item ao pedido"""
    etiqueta_rfid: str = Field(..., min_length=1, description="RFID do item a vincular")
    origem: Optional[str] = Field(None, description="Origem do vínculo (ex: leitor, manual)")
    vinculado_por: str = Field(..., min_length=1, description="Usuário que está vinculando")


class VincularItemResponse(BaseModel):
    """Response após vincular item"""
    success: bool
    message: str
    pedido_id: int
    pedido_item_id: Optional[int] = None
    item_id: Optional[int] = None
    etiqueta_rfid: str


class DesvincularItemRequest(BaseModel):
    """Request para desvincular um item"""
    item_id: int = Field(..., description="ID do item a desvincular")


class DesvincularItemResponse(BaseModel):
    """Response após desvincular item"""
    success: bool
    message: str
    pedido_item_id: int
    item_id: int


class CheckItemAvailabilityResponse(BaseModel):
    """Response da verificação de disponibilidade de um item"""
    available: bool
    reason: str
    item_data: Optional[dict] = None