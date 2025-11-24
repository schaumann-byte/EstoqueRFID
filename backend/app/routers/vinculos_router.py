from fastapi import APIRouter, Depends, Query, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from ..db import get_session
from ..repositories.vinculo_repo import (
    search_out_of_stock_items,
    vincular_item_ao_pedido,
    desvincular_item,
    check_item_availability,
)
from ..repositories.metrics_repo import get_order_detail, NotFoundError

from ..schemas.vinculo_schemas import (
    OutOfStockItemsPage,
    VincularItemRequest,
    VincularItemResponse,
    DesvincularItemRequest,
    DesvincularItemResponse,
    CheckItemAvailabilityResponse,
)


router = APIRouter(prefix="/vinculos", tags=["vinculos"])


@router.get("/search/{pedido_id}/{codigo_produto}", response_model=OutOfStockItemsPage)
async def search_items_for_order(
    pedido_id: int = Path(..., description="ID do pedido"),
    codigo_produto: int = Path(..., description="Código do produto a buscar"),
    q: Optional[str] = Query(None, description="Busca por RFID, descrição ou marca"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_session),
) -> OutOfStockItemsPage:
    """
    Busca itens FORA de estoque que correspondem ao produto solicitado.
    Usado para vincular itens a um pedido específico.
    """
    # Verificar se o pedido existe
    try:
        await get_order_detail(session, pedido_id)
    except NotFoundError:
        raise HTTPException(status_code=404, detail=f"Pedido {pedido_id} não encontrado")
    
    # Buscar itens
    data = await search_out_of_stock_items(
        session,
        codigo_produto=codigo_produto,
        q=q,
        page=page,
        page_size=page_size,
    )
    
    return OutOfStockItemsPage(**data)


@router.post("/{pedido_id}/{codigo_produto}", response_model=VincularItemResponse)
async def vincular_item(
    pedido_id: int = Path(..., description="ID do pedido"),
    codigo_produto: int = Path(..., description="Código do produto"),
    body: VincularItemRequest = ...,
    session: AsyncSession = Depends(get_session),
) -> VincularItemResponse:
    """
    Vincula um item (RFID) a uma linha do pedido.
    
    O item deve:
    - Estar FORA de estoque (timestamp_saida preenchido)
    - Corresponder ao código do produto
    - Não estar já vinculado a outro pedido
    
    O pedido deve estar com status 'aberto' ou 'entregue'.
    """
    try:
        await vincular_item_ao_pedido(
            session,
            pedido_id=pedido_id,
            codigo_produto=codigo_produto,
            etiqueta_rfid=body.etiqueta_rfid,
            vinculado_por=body.vinculado_por,
            origem=body.origem,
        )
        
        return VincularItemResponse(
            success=True,
            message="Item vinculado com sucesso",
            pedido_id=pedido_id,
            etiqueta_rfid=body.etiqueta_rfid,
        )
    
    except Exception as e:
        error_msg = str(e)
        
        # Mapear erros comuns do banco
        if "não pode ser vinculado" in error_msg.lower():
            raise HTTPException(status_code=400, detail=error_msg)
        elif "cancelado" in error_msg.lower():
            raise HTTPException(status_code=409, detail="Pedido cancelado não permite vinculação")
        elif "não corresponde" in error_msg.lower():
            raise HTTPException(status_code=400, detail="Item não corresponde ao produto solicitado")
        elif "já atingiu a quantidade" in error_msg.lower():
            raise HTTPException(status_code=409, detail="Quantidade solicitada já foi atingida")
        elif "não encontrado" in error_msg.lower():
            raise HTTPException(status_code=404, detail=error_msg)
        else:
            raise HTTPException(status_code=500, detail=f"Erro ao vincular item: {error_msg}")


@router.delete("/{pedido_item_id}/item/{item_id}", response_model=DesvincularItemResponse)
async def desvincular_item_endpoint(
    pedido_item_id: int = Path(..., description="ID da linha do pedido"),
    item_id: int = Path(..., description="ID do item a desvincular"),
    session: AsyncSession = Depends(get_session),
) -> DesvincularItemResponse:
    """
    Remove o vínculo de um item de uma linha do pedido.
    
    Isso:
    - Decrementa quantidade_atendida da linha
    - Pode reabrir o pedido se ele estava 'entregue' e ficou com pendência
    """
    try:
        success = await desvincular_item(session, pedido_item_id, item_id)
        
        if not success:
            raise HTTPException(
                status_code=404, 
                detail="Vínculo não encontrado ou já removido"
            )
        
        return DesvincularItemResponse(
            success=True,
            message="Item desvinculado com sucesso",
            pedido_item_id=pedido_item_id,
            item_id=item_id,
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao desvincular item: {str(e)}")


@router.get("/check/{codigo_produto}/{etiqueta_rfid}", response_model=CheckItemAvailabilityResponse)
async def check_item(
    codigo_produto: int = Path(..., description="Código do produto esperado"),
    etiqueta_rfid: str = Path(..., description="RFID do item a verificar"),
    session: AsyncSession = Depends(get_session),
) -> CheckItemAvailabilityResponse:
    """
    Verifica se um item específico está disponível para vinculação.
    
    Útil para validação em tempo real ao escanear um RFID.
    """
    data = await check_item_availability(session, etiqueta_rfid, codigo_produto)
    return CheckItemAvailabilityResponse(**data)