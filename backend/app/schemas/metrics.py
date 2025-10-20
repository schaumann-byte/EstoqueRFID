from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional, List, Literal


OrderStatus = Literal["aberto", "entregue", "cancelado"]

class StockSummary(BaseModel):
    total_on_hand: int                # itens em estoque agora (etiquetas únicas)
    abs_change_since_last_month: int  # variação absoluta vs. fim do mês anterior
    pct_change_since_last_month: float  # variação % (0.0 se base = 0)
    distinct_products_on_hand: int    # quantos códigos de produto têm pelo menos 1 item em estoque

class LowStockSummary(BaseModel):
    threshold: int
    count_low_stock: int
    abs_change_since_last_month: int
    pct_change_since_last_month: float

class NearExpirySummary(BaseModel):
    months: int
    count: int
    window_start: str  # YYYY-MM-DD
    window_end: str    # YYYY-MM-DD


class OutOfStockCount(BaseModel):
    count: int

class ProductStock(BaseModel):
    codigo: int
    descricao: str
    categoria: str | None = None
    marca: str | None = None
    estoque_total: int

class StockSummaryResponse(BaseModel):
    items: list[ProductStock]


class ItemRow(BaseModel):
    id: int
    codigo_produto: int
    etiqueta_rfid: str
    timestamp_entrada: datetime
    data_validade: Optional[date] = None
    timestamp_saida: Optional[datetime] = None
    descricao: str
    marca: str
    categoria: str

class ItemsPage(BaseModel):
    items: List[ItemRow]
    total: int
    page: int
    page_size: int


class OrderRow(BaseModel):
    id: int
    om_nome: str
    data_pedido: str
    status: str
    observacoes: Optional[str]
    total_solicitada: int
    total_atendida: int
    percentual_entregue: float


class OrdersPage(BaseModel):
    items: list[OrderRow]
    total: int
    page: int
    page_size: int