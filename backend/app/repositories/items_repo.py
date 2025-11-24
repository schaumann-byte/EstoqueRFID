from sqlalchemy import text, select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List
from datetime import date


class DuplicateRFIDError(Exception):
    """Exceção quando a etiqueta RFID já existe"""
    pass


class ProductNotFoundError(Exception):
    """Exceção quando o produto não é encontrado"""
    pass


class CategoryMismatchError(Exception):
    """Exceção quando a categoria informada não corresponde à categoria do produto existente"""
    pass


# SQL para buscar produto por (descrição + marca)
GET_PRODUCT_BY_DESC_MARCA_SQL = text("""
SELECT codigo, descricao, categoria, marca
FROM produtos
WHERE descricao = :descricao
  AND marca = :marca
LIMIT 1;
""")


# SQL para criar produto
CREATE_PRODUCT_SQL = text("""
INSERT INTO produtos (descricao, categoria, marca)
VALUES (:descricao, :categoria, :marca)
RETURNING codigo, descricao, categoria, marca;
""")


# SQL para verificar se RFID já existe
CHECK_RFID_EXISTS_SQL = text("""
SELECT id FROM itens WHERE etiqueta_rfid = :rfid LIMIT 1;
""")


# SQL para criar item
CREATE_ITEM_SQL = text("""
INSERT INTO itens (
    codigo_produto,
    etiqueta_rfid,
    data_validade,
    timestamp_entrada,
    cadastrado_por
)
VALUES (
    :codigo_produto,
    :etiqueta_rfid,
    :data_validade,
    CURRENT_TIMESTAMP,
    :cadastrado_por
)
RETURNING 
    id,
    codigo_produto,
    etiqueta_rfid,
    data_validade,
    timestamp_entrada;
""")


# SQL para buscar produto por código
GET_PRODUCT_SQL = text("""
SELECT codigo, descricao, categoria, marca
FROM produtos
WHERE codigo = :codigo;
""")


# SQL para buscar descrições únicas de produtos com todas as informações
GET_PRODUCT_DESCRIPTIONS_SQL = text("""
SELECT DISTINCT descricao, categoria, marca
FROM produtos
ORDER BY descricao, marca;
""")


async def create_item(
    session: AsyncSession,
    etiqueta_rfid: str,
    descricao: str,
    categoria: str,
    marca: str,
    data_validade: date | None = None,
    cadastrado_por: str = "Sistema",
) -> Dict[str, Any]:
    """
    Cria um novo item no estoque.
    
    Fluxo:
    1. Verifica se a etiqueta RFID já existe
    2. Busca produto por (descrição + marca)
       - Se encontrar: valida se a categoria bate
       - Se não encontrar: cria novo produto com os dados fornecidos
    3. Cria o item vinculado ao produto
    
    Args:
        session: Sessão do banco de dados
        etiqueta_rfid: Etiqueta RFID única
        descricao: Descrição do produto
        categoria: Categoria do produto
        marca: Marca do produto
        data_validade: Data de validade (opcional)
        cadastrado_por: Usuário que cadastrou
    
    Returns:
        Dict com os dados do item criado
    
    Raises:
        DuplicateRFIDError: Se a etiqueta RFID já existir
        CategoryMismatchError: Se produto existe mas categoria não bate
    """
    # 1. Verificar se RFID já existe
    existing_rfid = (
        await session.execute(CHECK_RFID_EXISTS_SQL, {"rfid": etiqueta_rfid.strip()})
    ).scalar_one_or_none()
    
    if existing_rfid:
        raise DuplicateRFIDError(
            f"A etiqueta RFID '{etiqueta_rfid}' já está cadastrada no sistema"
        )
    
    # 2. Buscar produto por (descrição + marca)
    produto_result = await session.execute(
        GET_PRODUCT_BY_DESC_MARCA_SQL,
        {
            "descricao": descricao.strip(),
            "marca": marca.strip(),
        }
    )
    produto_row = produto_result.mappings().one_or_none()
    
    if produto_row:
        # Produto já existe - validar categoria
        if produto_row["categoria"] != categoria.strip():
            raise CategoryMismatchError(
                f"Produto '{descricao}' da marca '{marca}' já existe com categoria '{produto_row['categoria']}'. "
                f"Não é possível criar com categoria '{categoria}'."
            )
        codigo_produto = produto_row["codigo"]
    else:
        # Produto não existe - criar novo
        create_result = await session.execute(
            CREATE_PRODUCT_SQL,
            {
                "descricao": descricao.strip(),
                "categoria": categoria.strip(),
                "marca": marca.strip(),
            }
        )
        produto_row = create_result.mappings().one()
        codigo_produto = produto_row["codigo"]
    
    # 3. Criar item
    item_result = await session.execute(
        CREATE_ITEM_SQL,
        {
            "codigo_produto": codigo_produto,
            "etiqueta_rfid": etiqueta_rfid.strip(),
            "data_validade": data_validade,
            "cadastrado_por": cadastrado_por,
        }
    )
    item_row = item_result.mappings().one()
    
    await session.commit()
    
    return {
        "id": item_row["id"],
        "codigo_produto": codigo_produto,
        "etiqueta_rfid": item_row["etiqueta_rfid"],
        "descricao": produto_row["descricao"],
        "categoria": produto_row["categoria"],
        "marca": produto_row["marca"],
        "data_validade": item_row["data_validade"],
        "timestamp_entrada": item_row["timestamp_entrada"],
    }


async def get_product_descriptions(session: AsyncSession) -> List[Dict[str, Any]]:
    """
    Retorna todas as descrições únicas de produtos cadastrados.
    Útil para autocomplete no frontend.
    
    Args:
        session: Sessão do banco de dados
    
    Returns:
        Lista de dicionários com descricao, categoria e marca
    """
    result = await session.execute(GET_PRODUCT_DESCRIPTIONS_SQL)
    rows = result.mappings().all()
    
    return [
        {
            "descricao": row["descricao"],
            "categoria": row["categoria"],
            "marca": row["marca"],
        }
        for row in rows
    ]