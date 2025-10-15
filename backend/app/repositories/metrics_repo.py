from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

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



from typing import List, Dict, Any

def get_stock_summary(conn) -> List[Dict[str, Any]]:
    """
    Resumo de estoque por produto (itens com data_saida IS NULL).
    Tabelas:
      - produtos(codigo PK, descricao, categoria, marca)
      - itens(produto_codigo FK, data_saida TIMESTAMP NULL)
    """
    sql = """
        SELECT
            p.codigo,
            p.descricao,
            p.categoria,
            p.marca,
            COALESCE(COUNT(i.*) FILTER (WHERE i.data_saida IS NULL), 0) AS estoque_total
        FROM produtos p
        LEFT JOIN itens i ON i.produto_codigo = p.codigo
        GROUP BY p.codigo, p.descricao, p.categoria, p.marca
        ORDER BY p.codigo;
    """
    with conn.cursor() as cur:
        cur.execute(sql)
        rows = cur.fetchall()

    result = []
    for row in rows:
        codigo, descricao, categoria, marca, estoque_total = row
        result.append(
            {
                "codigo": codigo,
                "descricao": descricao,
                "categoria": categoria,
                "marca": marca,
                "estoque_total": int(estoque_total),
            }
        )
    return result
