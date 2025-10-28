from sqlalchemy import text, bindparam, String
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any, Optional, Tuple
from ..schemas.metrics_schemas import OrderRow, OrdersPage, OrderStatus

# Observação do modelo de estoque:
# "Em estoque em T"  <=>  timestamp_entrada <= T  AND  (timestamp_saida IS NULL OR timestamp_saida > T)

STOCK_COUNTS_SQL = text("""
WITH
    now_ts AS (SELECT now() AS ts),
    month_start AS (SELECT date_trunc('month', (SELECT ts FROM now_ts)) AS ts),
    last_month_end AS (SELECT (SELECT ts FROM month_start) - interval '1 second' AS ts)
SELECT
    -- itens em estoque agora
    (SELECT COUNT(*) FROM itens i
      WHERE i.timestamp_entrada <= (SELECT ts FROM now_ts)
        AND (i.timestamp_saida IS NULL OR i.timestamp_saida > (SELECT ts FROM now_ts))
    ) AS on_hand_now,

    -- itens em estoque no fim do mês anterior
    (SELECT COUNT(*) FROM itens i
      WHERE i.timestamp_entrada <= (SELECT ts FROM last_month_end)
        AND (i.timestamp_saida IS NULL OR i.timestamp_saida > (SELECT ts FROM last_month_end))
    ) AS on_hand_last_month_end,

    -- quantos produtos distintos têm pelo menos 1 item em estoque agora
    (SELECT COUNT(DISTINCT i.codigo_produto) FROM itens i
      WHERE i.timestamp_entrada <= (SELECT ts FROM now_ts)
        AND (i.timestamp_saida IS NULL OR i.timestamp_saida > (SELECT ts FROM now_ts))
    ) AS distinct_products_now
;
""")

async def get_stock_amount(session: AsyncSession) -> dict:
    """
    Retorna:
      - total_on_hand
      - abs_change_since_last_month
      - pct_change_since_last_month
      - distinct_products_on_hand
    """
    result = await session.execute(STOCK_COUNTS_SQL)
    row = result.mappings().one()

    on_hand_now = int(row["on_hand_now"])
    on_hand_prev = int(row["on_hand_last_month_end"])
    distinct_products_now = int(row["distinct_products_now"])

    abs_change = on_hand_now - on_hand_prev
    if on_hand_prev == 0:
        pct_change = 0.0 if on_hand_now == 0 else 100.0
    else:
        pct_change = (abs_change / on_hand_prev) * 100.0

    return {
        "total_on_hand": on_hand_now,
        "abs_change_since_last_month": abs_change,
        "pct_change_since_last_month": round(pct_change, 2),
        "distinct_products_on_hand": distinct_products_now,
      }


LOW_STOCK_SQL = text("""
WITH
  ts_now AS (SELECT now() AS ts),
  month_start AS (SELECT date_trunc('month', (SELECT ts FROM ts_now)) AS ts),
  last_month_end AS (SELECT (SELECT ts FROM month_start) - interval '1 second' AS ts),

  -- on hand por produto em T = agora
  on_now AS (
    SELECT i.codigo_produto, COUNT(*) AS on_hand
    FROM itens i
    WHERE i.timestamp_entrada <= (SELECT ts FROM ts_now)
      AND (i.timestamp_saida IS NULL OR i.timestamp_saida > (SELECT ts FROM ts_now))
    GROUP BY i.codigo_produto
  ),

  -- on hand por produto em T = fim do mês anterior
  on_prev AS (
    SELECT i.codigo_produto, COUNT(*) AS on_hand
    FROM itens i
    WHERE i.timestamp_entrada <= (SELECT ts FROM last_month_end)
      AND (i.timestamp_saida IS NULL OR i.timestamp_saida > (SELECT ts FROM last_month_end))
    GROUP BY i.codigo_produto
  )

SELECT
  -- produtos com estoque atual <= :threshold (contando 0 para quem não aparece em on_now)
  (SELECT COUNT(*)
     FROM produtos p
     LEFT JOIN on_now n ON n.codigo_produto = p.codigo
     WHERE COALESCE(n.on_hand, 0) <= :threshold
  ) AS low_now,

  -- produtos com estoque no fim do mês anterior <= :threshold
  (SELECT COUNT(*)
     FROM produtos p
     LEFT JOIN on_prev pr ON pr.codigo_produto = p.codigo
     WHERE COALESCE(pr.on_hand, 0) <= :threshold
  ) AS low_prev;
""")

async def get_low_stock_summary(session: AsyncSession, threshold: int = 1) -> dict:
    row = (await session.execute(LOW_STOCK_SQL, {"threshold": threshold})).mappings().one()
    low_now = int(row["low_now"])
    low_prev = int(row["low_prev"])
    abs_change = low_now - low_prev
    if low_prev == 0:
        pct_change = 0.0 if low_now == 0 else 100.0
    else:
        pct_change = round((abs_change / low_prev) * 100.0, 2)

    return {
        "threshold": threshold,
        "count_low_stock": low_now,
        "abs_change_since_last_month": abs_change,
        "pct_change_since_last_month": pct_change,
    }


NEAR_EXPIRY_SQL = text("""
-- Itens em estoque com validade dentro da janela [hoje, hoje + :months meses]
SELECT COUNT(*) AS cnt
FROM itens i
WHERE
  -- em estoque agora
  i.timestamp_entrada <= now()
  AND (i.timestamp_saida IS NULL OR i.timestamp_saida > now())
  -- tem validade definida
  AND i.data_validade IS NOT NULL
  -- dentro da janela (exclui vencidos)
  AND i.data_validade >= current_date
  AND i.data_validade <= (current_date + make_interval(months => :months))
;""")

async def get_near_expiry_count(session: AsyncSession, months: int = 2) -> int:
    row = (await session.execute(NEAR_EXPIRY_SQL, {"months": months})).mappings().one()
    return int(row["cnt"])


OUT_OF_STOCK_SQL = text("""
SELECT COUNT(*) AS cnt
FROM itens
WHERE timestamp_saida IS NOT NULL;
""")

async def get_out_of_stock_count(session: AsyncSession) -> int:
    row = (await session.execute(OUT_OF_STOCK_SQL)).mappings().one()
    return int(row["cnt"])


STOCK_SUMMARY_SQL = text("""
    SELECT
        p.codigo,
        p.descricao,
        p.categoria,
        p.marca,
        COALESCE(
          SUM(CASE WHEN i.timestamp_saida IS NULL THEN 1 ELSE 0 END), 0
        ) AS estoque_total
    FROM produtos p
    LEFT JOIN itens i ON i.codigo_produto = p.codigo
    GROUP BY p.codigo, p.descricao, p.categoria, p.marca
    ORDER BY p.codigo;
""")

async def get_stock_summary(session: AsyncSession) -> List[Dict[str, Any]]:
    rows = (await session.execute(STOCK_SUMMARY_SQL)).mappings().all()
    return [
        {
            "codigo": r["codigo"],
            "descricao": r["descricao"],
            "categoria": r["categoria"],
            "marca": r["marca"],
            "estoque_total": int(r["estoque_total"]),
        }
        for r in rows
    ]


ITEMS_BASE_SQL = """
FROM itens i
JOIN produtos p ON p.codigo = i.codigo_produto
WHERE 1=1
{where_extra}
"""

ITEMS_SELECT_SQL_TEMPLATE = """
SELECT
  i.id,
  i.codigo_produto,
  i.etiqueta_rfid,
  i.timestamp_entrada,
  i.data_validade,
  i.timestamp_saida,
  i.ultima_verificacao,            -- 👈 novo campo
  p.descricao,
  p.marca,
  p.categoria,
  (i.timestamp_saida IS NULL) AS em_estoque
{base}
ORDER BY i.id DESC
LIMIT :limit OFFSET :offset
"""

ITEMS_COUNT_SQL_TEMPLATE = """
SELECT COUNT(*) AS total
{base}
"""

def _build_where(
    filters: Dict[str, Any]
) -> Tuple[str, Dict[str, Any]]:
    where_parts = []
    params: Dict[str, Any] = {}

    # somente itens em estoque
    if filters.get("in_stock") is True:
        where_parts.append(" AND i.timestamp_saida IS NULL")
    elif filters.get("in_stock") is False:
        where_parts.append(" AND i.timestamp_saida IS NOT NULL")

    # busca texto
    q = filters.get("q")
    if q:
        where_parts.append(
            " AND (i.etiqueta_rfid ILIKE :q OR p.descricao ILIKE :q OR p.marca ILIKE :q OR p.categoria ILIKE :q)"
        )
        params["q"] = f"%{q}%"

    # validade até
    validade_ate = filters.get("validade_ate")
    if validade_ate:
        where_parts.append(" AND i.data_validade <= :validade_ate")
        params["validade_ate"] = validade_ate

    where_extra = "".join(where_parts)
    return where_extra, params


async def get_items_page(
    session: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    *,
    q: Optional[str] = None,
    in_stock: Optional[bool] = None,
    validade_ate: Optional[str] = None,
) -> Dict[str, Any]:
    page = max(1, page)
    page_size = max(1, min(page_size, 100))
    offset = (page - 1) * page_size

    where_extra, params = _build_where(
        {"q": q, "in_stock": in_stock, "validade_ate": validade_ate}
    )

    # SELECT
    select_sql = ITEMS_SELECT_SQL_TEMPLATE.format(
        base=ITEMS_BASE_SQL.format(where_extra=where_extra)
    )
    rows = (
        await session.execute(
            text(select_sql),
            {"limit": page_size, "offset": offset, **params},
        )
    ).mappings().all()

    # COUNT
    count_sql = ITEMS_COUNT_SQL_TEMPLATE.format(
        base=ITEMS_BASE_SQL.format(where_extra=where_extra)
    )
    total = (await session.execute(text(count_sql), params)).scalar_one()

    return {
        "items": [
            {
                "id": r["id"],
                "codigo_produto": r["codigo_produto"],
                "etiqueta_rfid": r["etiqueta_rfid"],
                "timestamp_entrada": r["timestamp_entrada"],
                "data_validade": r["data_validade"],
                "timestamp_saida": r["timestamp_saida"],
                "ultima_verificacao": r["ultima_verificacao"],  
                "descricao": r["descricao"],
                "marca": r["marca"],
                "categoria": r["categoria"],
                "em_estoque": r["em_estoque"],
            }
            for r in rows
        ],
        "total": int(total),
        "page": page,
        "page_size": page_size,
    }




ORDERS_OVERVIEW_PAGE_SQL = text("""
SELECT
  id,
  om_sigla,
  data_pedido,
  status,
  observacoes,
  total_solicitada,
  total_atendida,
  percentual_entregue
FROM public.vw_pedidos_overview
WHERE (:status IS NULL OR status = :status)
ORDER BY data_pedido DESC, id DESC
OFFSET :offset ROWS
FETCH NEXT :limit ROWS ONLY;
""").bindparams(bindparam("status", type_=String))

ORDERS_OVERVIEW_COUNT_SQL = text("""
SELECT COUNT(*) AS cnt
FROM public.vw_pedidos_overview
WHERE (:status IS NULL OR status = :status);
""").bindparams(bindparam("status", type_=String))


async def get_orders_overview_page(
    session: AsyncSession,
    *,
    status: Optional[OrderStatus] = None,
    page: int = 1,
    page_size: int = 20,
) -> dict:
    page = max(page, 1)
    page_size = max(min(page_size, 100), 1)
    offset = (page - 1) * page_size

    params = {"status": status, "offset": offset, "limit": page_size}

    total = int((await session.execute(ORDERS_OVERVIEW_COUNT_SQL, params))
                .mappings().one()["cnt"])

    rows = (await session.execute(ORDERS_OVERVIEW_PAGE_SQL, params)).mappings().all()
    items: List[OrderRow] = [dict(r) for r in rows]

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


_HEADER_SQL = text("""
SELECT
  p.id,
  p.status,
  p.data_pedido,
  p.data_entrega,
  p.observacoes,
  p.cadastrado_por,
  o.id        AS om_id,
  o.sigla     AS om_sigla,
  o.nome      AS om_nome,
  ov.total_solicitada,
  ov.total_atendida,
  ov.percentual_entregue
FROM pedidos p
JOIN oms o                ON o.id = p.om_id
JOIN vw_pedidos_overview ov ON ov.id = p.id
WHERE p.id = :pedido_id
""")

# 2.2 Linhas + Vínculos RFID (flat; agregamos em Python)
_LINES_SQL = text("""
SELECT
  pi.id                      AS pedido_item_id,
  pi.codigo_produto,
  pr.descricao               AS produto_descricao,
  pr.categoria               AS produto_categoria,
  pr.marca                   AS produto_marca,
  pi.quantidade_solicitada,
  pi.quantidade_atendida,
  (pi.quantidade_solicitada - pi.quantidade_atendida) AS pendente,

  v.id                       AS vinculo_id,
  v.item_id,
  it.etiqueta_rfid,
  v.vinculado_por,
  v.vinculado_em,
  v.origem_vinculo
FROM pedido_itens pi
JOIN produtos pr               ON pr.codigo = pi.codigo_produto
LEFT JOIN pedido_item_vinculos v ON v.pedido_item_id = pi.id
LEFT JOIN itens it               ON it.id = v.item_id
WHERE pi.pedido_id = :pedido_id
ORDER BY pi.id, v.vinculado_em NULLS LAST, v.id NULLS LAST
""")

class NotFoundError(Exception):
    pass

async def get_order_detail(session: AsyncSession, pedido_id: int) -> Dict[str, Any]:
    # --- Header ---
    hdr = (await session.execute(_HEADER_SQL, {"pedido_id": pedido_id})).mappings().first()
    if not hdr:
        raise NotFoundError(f"Pedido {pedido_id} não encontrado")

    # --- Linhas (com vínculos) ---
    rows = (await session.execute(_LINES_SQL, {"pedido_id": pedido_id})).mappings().all()

    lines_dict: Dict[int, Dict[str, Any]] = {}
    for r in rows:
        pid = r["pedido_item_id"]
        if pid not in lines_dict:
            lines_dict[pid] = {
                "pedido_item_id": pid,
                "codigo_produto": r["codigo_produto"],
                "produto_descricao": r["produto_descricao"],
                "produto_categoria": r["produto_categoria"],
                "produto_marca": r["produto_marca"],
                "quantidade_solicitada": int(r["quantidade_solicitada"]),
                "quantidade_atendida": int(r["quantidade_atendida"]),
                "pendente": int(r["pendente"]),
                "vinculos": [],
            }

        # Pode não haver vínculo (LEFT JOIN)
        if r["item_id"] is not None:
            lines_dict[pid]["vinculos"].append({
                "item_id": int(r["item_id"]),
                "etiqueta_rfid": r["etiqueta_rfid"],
                "vinculado_por": r["vinculado_por"],
                "vinculado_em": r["vinculado_em"],
                "origem_vinculo": r["origem_vinculo"],
            })

    # --- Montagem do payload ---
    detail = {
        "header": {
            "id": int(hdr["id"]),
            "status": hdr["status"],
            "data_pedido": hdr["data_pedido"],
            "data_entrega": hdr["data_entrega"],
            "observacoes": hdr["observacoes"],
            "cadastrado_por": hdr["cadastrado_por"],
        },
        "om": {
            "id": int(hdr["om_id"]),
            "sigla": hdr["om_sigla"],
            "nome": hdr["om_nome"],
        },
        "totals": {
            "total_solicitada": int(hdr["total_solicitada"]),
            "total_atendida": int(hdr["total_atendida"]),
            "percentual_entregue": float(hdr["percentual_entregue"]),
        },
        "lines": list(lines_dict.values()),
    }

    return detail


_UPDATE_HEARTBEAT_SQL = text("""
UPDATE itens
SET ultima_verificacao = now(),
    origem_ultima_verificacao = COALESCE(:origem, origem_ultima_verificacao)
WHERE etiqueta_rfid = :rfid
  AND timestamp_saida IS NULL
RETURNING id, codigo_produto, etiqueta_rfid, ultima_verificacao, origem_ultima_verificacao,
          (timestamp_saida IS NULL) AS em_estoque;
""")

_SELECT_ITEM_SQL = text("""
SELECT id, codigo_produto, etiqueta_rfid, ultima_verificacao, origem_ultima_verificacao,
       (timestamp_saida IS NULL) AS em_estoque
FROM itens
WHERE etiqueta_rfid = :rfid
""")

async def update_item_heartbeat(session: AsyncSession, etiqueta_rfid: str, origem: str | None) -> dict | None:
    etiqueta_rfid = etiqueta_rfid.strip()
    if not etiqueta_rfid:
        return None

    res = (await session.execute(_UPDATE_HEARTBEAT_SQL, {"rfid": etiqueta_rfid, "origem": origem})).mappings().first()
    if res:
        await session.commit()
        r = dict(res)
        r["em_estoque"] = bool(r["em_estoque"])
        return r

    # Se não atualizou, ver se existe e está fora de estoque (para diferenciar 404 vs 409)
    exist = (await session.execute(_SELECT_ITEM_SQL, {"rfid": etiqueta_rfid})).mappings().first()
    if exist:
        # Existe mas não está em estoque -> por coerência do schema ( :contentReference[oaicite:0]{index=0} )
        # não aceitamos heartbeat após saída
        raise Exception("409: item fora de estoque")
    return None

async def bulk_update_item_heartbeat(session: AsyncSession, itens: list[dict]) -> list[dict]:
    out: list[dict] = []
    for it in itens:
        try:
            r = await update_item_heartbeat(session, it.get("etiqueta_rfid", ""), it.get("origem"))
            if r:
                out.append(r)
        except Exception as e:
            # se quiser, pode anexar info do erro por item; por enquanto, ignora conflitos 409
            if "409" in str(e):
                # opcional: anexar com flag de conflito
                pass
            else:
                raise
    return out