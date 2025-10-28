from sqlalchemy import text 
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime

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