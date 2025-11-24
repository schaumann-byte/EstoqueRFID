from sqlalchemy import text, bindparam, String
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Optional


# Buscar itens FORA de estoque que correspondem ao produto
SEARCH_OUT_OF_STOCK_ITEMS_SQL = text("""
SELECT
  i.id,
  i.codigo_produto,
  i.etiqueta_rfid,
  i.timestamp_entrada,
  i.timestamp_saida,
  i.data_validade,
  i.ultima_verificacao,
  i.origem_ultima_verificacao,
  p.descricao,
  p.categoria,
  p.marca,
  -- Verifica se já está vinculado a algum pedido
  (SELECT COUNT(*) FROM pedido_item_vinculos v WHERE v.item_id = i.id) > 0 AS ja_vinculado
FROM itens i
JOIN produtos p ON p.codigo = i.codigo_produto
WHERE i.timestamp_saida IS NOT NULL  -- FORA de estoque
  AND i.codigo_produto = :codigo_produto
  AND (:q IS NULL OR 
       i.etiqueta_rfid ILIKE :q OR 
       p.descricao ILIKE :q OR 
       p.marca ILIKE :q)
ORDER BY i.timestamp_saida DESC
LIMIT :limit OFFSET :offset
""").bindparams(bindparam("q", type_=String))

SEARCH_OUT_OF_STOCK_ITEMS_COUNT_SQL = text("""
SELECT COUNT(*) AS total
FROM itens i
JOIN produtos p ON p.codigo = i.codigo_produto
WHERE i.timestamp_saida IS NOT NULL
  AND i.codigo_produto = :codigo_produto
  AND (:q IS NULL OR 
       i.etiqueta_rfid ILIKE :q OR 
       p.descricao ILIKE :q OR 
       p.marca ILIKE :q)
""").bindparams(bindparam("q", type_=String))


async def search_out_of_stock_items(
    session: AsyncSession,
    codigo_produto: int,
    *,
    q: Optional[str] = None,
    page: int = 1,
    page_size: int = 20,
) -> Dict[str, Any]:
    """
    Busca itens FORA de estoque para um determinado produto.
    Retorna paginado com informação se já está vinculado.
    """
    page = max(page, 1)
    page_size = max(min(page_size, 100), 1)
    offset = (page - 1) * page_size
    
    # Se q for string vazia, converter para None
    search_param = f"%{q}%" if q and q.strip() else None
    
    params = {
        "codigo_produto": codigo_produto,
        "q": search_param,
        "limit": page_size,
        "offset": offset
    }
    
    # Buscar itens
    rows = (await session.execute(SEARCH_OUT_OF_STOCK_ITEMS_SQL, params)).mappings().all()
    
    # Contar total
    total = int((await session.execute(SEARCH_OUT_OF_STOCK_ITEMS_COUNT_SQL, params)).scalar_one())
    
    items = [
        {
            "id": r["id"],
            "codigo_produto": r["codigo_produto"],
            "etiqueta_rfid": r["etiqueta_rfid"],
            "timestamp_entrada": r["timestamp_entrada"],
            "timestamp_saida": r["timestamp_saida"],
            "data_validade": r["data_validade"],
            "ultima_verificacao": r["ultima_verificacao"],
            "origem_ultima_verificacao": r["origem_ultima_verificacao"],
            "descricao": r["descricao"],
            "categoria": r["categoria"],
            "marca": r["marca"],
            "ja_vinculado": bool(r["ja_vinculado"]),
        }
        for r in rows
    ]
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# Vincular item ao pedido (chama a stored procedure)
VINCULAR_ITEM_SQL = text("""
SELECT sp_vincular_item_por_rfid(
    :pedido_id,
    :codigo_produto,
    :etiqueta_rfid,
    :vinculado_por,
    :origem
) AS result
""")


async def vincular_item_ao_pedido(
    session: AsyncSession,
    pedido_id: int,
    codigo_produto: int,
    etiqueta_rfid: str,
    vinculado_por: str,
    origem: Optional[str] = None,
) -> None:
    """
    Vincula um item RFID a uma linha do pedido.
    Usa a stored procedure sp_vincular_item_por_rfid do schema.
    
    Raises:
        Exception: Se houver erro na vinculação (produto incompatível, 
                   item já vinculado, pedido cancelado, etc.)
    """
    params = {
        "pedido_id": pedido_id,
        "codigo_produto": codigo_produto,
        "etiqueta_rfid": etiqueta_rfid.strip(),
        "vinculado_por": vinculado_por,
        "origem": origem,
    }
    
    try:
        await session.execute(VINCULAR_ITEM_SQL, params)
        await session.commit()
    except Exception as e:
        await session.rollback()
        # Re-lança a exceção com mensagem do banco
        raise Exception(f"Erro ao vincular item: {str(e)}")


# Desvincular item (remove o vínculo)
DESVINCULAR_ITEM_SQL = text("""
DELETE FROM pedido_item_vinculos
WHERE pedido_item_id = :pedido_item_id
  AND item_id = :item_id
RETURNING id
""")


async def desvincular_item(
    session: AsyncSession,
    pedido_item_id: int,
    item_id: int,
) -> bool:
    """
    Remove vínculo de um item de uma linha do pedido.
    Os triggers do banco cuidam de ajustar quantidade_atendida e reabrir pedido se necessário.
    
    Returns:
        bool: True se desvinculou, False se não encontrou o vínculo
    """
    params = {
        "pedido_item_id": pedido_item_id,
        "item_id": item_id,
    }
    
    try:
        result = await session.execute(DESVINCULAR_ITEM_SQL, params)
        await session.commit()
        return result.rowcount > 0
    except Exception as e:
        await session.rollback()
        raise Exception(f"Erro ao desvincular item: {str(e)}")


# Verificar se um item específico está disponível para vínculo
CHECK_ITEM_AVAILABLE_SQL = text("""
SELECT
  i.id,
  i.codigo_produto,
  i.etiqueta_rfid,
  i.timestamp_saida IS NOT NULL AS fora_estoque,
  EXISTS(SELECT 1 FROM pedido_item_vinculos v WHERE v.item_id = i.id) AS ja_vinculado,
  p.descricao
FROM itens i
JOIN produtos p ON p.codigo = i.codigo_produto
WHERE i.etiqueta_rfid = :etiqueta_rfid
""")


async def check_item_availability(
    session: AsyncSession,
    etiqueta_rfid: str,
    codigo_produto: int,
) -> Dict[str, Any]:
    """
    Verifica se um item pode ser vinculado (fora de estoque, não vinculado, produto correto).
    
    Returns:
        dict com: available (bool), reason (str), item_data (dict)
    """
    result = (await session.execute(
        CHECK_ITEM_AVAILABLE_SQL, 
        {"etiqueta_rfid": etiqueta_rfid.strip()}
    )).mappings().first()
    
    if not result:
        return {
            "available": False,
            "reason": "Item não encontrado no sistema",
            "item_data": None,
        }
    
    item = dict(result)
    
    # Verificar se é o produto correto
    if item["codigo_produto"] != codigo_produto:
        return {
            "available": False,
            "reason": f"Item pertence ao produto {item['codigo_produto']} ({item['descricao']}), não ao produto solicitado",
            "item_data": item,
        }
    
    # Verificar se está fora de estoque
    if not item["fora_estoque"]:
        return {
            "available": False,
            "reason": "Item ainda está em estoque (não passou pelo leitor de saída)",
            "item_data": item,
        }
    
    # Verificar se já está vinculado
    if item["ja_vinculado"]:
        return {
            "available": False,
            "reason": "Item já vinculado a outro pedido",
            "item_data": item,
        }
    
    return {
        "available": True,
        "reason": "Item disponível para vinculação",
        "item_data": item,
    }