from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ..db import get_session
from ..repositories.items_repo import (
    create_item,
    get_product_descriptions,
    DuplicateRFIDError,
    CategoryMismatchError,
)
from ..schemas.items_schemas import (
    CreateItemRequest,
    CreateItemResponse,
    ProductDescriptionOption,
)

# TODO: Importar a dependência de autenticação
# from ..auth import get_current_user


router = APIRouter(prefix="/items", tags=["items"])


# Dependência temporária - substituir pela sua implementação real de auth
async def get_current_username() -> str:
    """
    TODO: Substituir por sua implementação real de autenticação.
    Esta função deve retornar o username do usuário autenticado.
    """
    # Exemplo: return request.state.username ou extrair do token JWT
    return "Sistema"  # Placeholder


@router.post("", response_model=CreateItemResponse, status_code=status.HTTP_201_CREATED)
async def create_new_item(
    data: CreateItemRequest,
    session: AsyncSession = Depends(get_session),
    username: str = Depends(get_current_username),
) -> CreateItemResponse:
    """
    Cria um novo item no estoque.
    
    Fluxo:
    1. Valida os dados de entrada
    2. Verifica se a etiqueta RFID é única
    3. Busca produto por (descrição + marca):
       - Se existir: valida se a categoria corresponde
       - Se não existir: cria novo produto
    4. Cria o item vinculado ao produto
    
    Validações:
    - Etiqueta RFID deve ser única
    - Produto é identificado por (descrição + marca)
    - Se produto já existe, categoria deve corresponder
    - Categoria, marca e descrição não podem estar vazios
    - Data de validade é opcional
    
    Retorna:
    - Dados completos do item criado
    """
    try:
        item = await create_item(
            session=session,
            etiqueta_rfid=data.etiqueta_rfid,
            descricao=data.descricao,
            categoria=data.categoria,
            marca=data.marca,
            data_validade=data.data_validade,
            cadastrado_por=username,
        )
        
        return CreateItemResponse(
            id=item["id"],
            codigo_produto=item["codigo_produto"],
            etiqueta_rfid=item["etiqueta_rfid"],
            descricao=item["descricao"],
            categoria=item["categoria"],
            marca=item["marca"],
            data_validade=item["data_validade"],
            message="Item cadastrado com sucesso!",
        )
    
    except DuplicateRFIDError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(e)
        )
    
    except CategoryMismatchError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    except Exception as e:
        # Log do erro para debug
        print(f"Erro ao criar item: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao criar item. Verifique os dados e tente novamente."
        )


@router.get("/descriptions", response_model=List[ProductDescriptionOption])
async def list_product_descriptions(
    session: AsyncSession = Depends(get_session),
) -> List[ProductDescriptionOption]:
    """
    Lista todas as descrições únicas de produtos cadastrados.
    
    Útil para:
    - Autocomplete no frontend
    - Sugestões de produtos existentes
    - Evitar duplicação de produtos
    
    Retorna:
    - Lista de produtos com descrição, categoria e marca
    """
    try:
        descriptions = await get_product_descriptions(session)
        return [ProductDescriptionOption(**desc) for desc in descriptions]
    
    except Exception as e:
        print(f"Erro ao buscar descrições: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao buscar descrições de produtos."
        )