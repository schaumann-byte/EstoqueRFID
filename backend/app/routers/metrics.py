from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, timedelta
from ..db import get_session
from ..repositories.metrics_repo import get_stock_amount, get_low_stock_summary, get_near_expiry_count, get_out_of_stock_count, get_stock_summary, get_items_page
from ..schemas.metrics import StockSummary, LowStockSummary, NearExpirySummary, OutOfStockCount, ProductStock, ItemsPage
from typing import List, Optional


router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/stock-amount", response_model=StockSummary)
async def stock_summary(session: AsyncSession = Depends(get_session)) -> StockSummary:
    data = await get_stock_amount(session)
    return StockSummary(**data)


@router.get("/low-stock", response_model=LowStockSummary)
async def low_stock(
    threshold: int = Query(1, ge=0),  # X; default 1
    session: AsyncSession = Depends(get_session),
) -> LowStockSummary:
    data = await get_low_stock_summary(session, threshold)
    return LowStockSummary(**data)



@router.get("/near-expiry", response_model=NearExpirySummary)
async def near_expiry(
    months: int = Query(2, ge=1, le=12),
    session: AsyncSession = Depends(get_session),
) -> NearExpirySummary:
    # janela de hoje até ~N meses à frente (30 dias por mês)
    start = date.today()
    end = start + timedelta(days=months * 30)

    count = await get_near_expiry_count(session, months)

    return NearExpirySummary(
        months=months,
        count=count,
        window_start=start.isoformat(),
        window_end=end.isoformat(),
    )




@router.get("/out-of-stock", response_model=OutOfStockCount)
async def out_of_stock(session: AsyncSession = Depends(get_session)) -> OutOfStockCount:
    count = await get_out_of_stock_count(session)
    return OutOfStockCount(count=count)

@router.get("/stock-summary", response_model=List[ProductStock])
async def stock_summary(session: AsyncSession = Depends(get_session)) -> List[ProductStock]:
    return await get_stock_summary(session)   # <-- await aqui


@router.get("/items", response_model=ItemsPage)
async def list_items(
    session: AsyncSession = Depends(get_session),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: Optional[str] = Query(None, description="Busca em descrição/marca/etiqueta"),
    in_stock: Optional[bool] = Query(None, description="Somente itens em estoque"),
    validade_ate: Optional[str] = Query(None, description="Filtrar por validade até (YYYY-MM-DD)"),
) -> ItemsPage:
    data = await get_items_page(
        session,
        page=page,
        page_size=page_size,
        q=q,
        in_stock=in_stock,
        validade_ate=validade_ate,
    )
    return ItemsPage(**data)

