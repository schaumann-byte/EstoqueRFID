from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from ..db import get_session
from ..repositories.users_repo import (
    get_users_page,
    get_user_by_id,
    update_user_admin_status,
    delete_user,
    update_user_active_status,
    count_active_admins,
    UserNotFoundError,
    CannotDeleteSelfError,
)
from ..schemas.users_schemas import (
    UsersPage,
    UserListItem,
    UserUpdateAdmin,
    UserUpdateActive,
)

# TODO: Importar a dependência de autenticação e verificação de admin
# from ..auth import get_current_user, require_admin


router = APIRouter(prefix="/users", tags=["users"])


# Dependência temporária - substituir pela sua implementação real de auth
async def get_current_user_id() -> int:
    """
    TODO: Substituir por sua implementação real de autenticação.
    Esta função deve retornar o ID do usuário autenticado.
    """
    # Exemplo: return request.state.user_id
    return 1  # Placeholder


async def require_admin(user_id: int = Depends(get_current_user_id)) -> int:
    """
    TODO: Substituir por sua implementação real de verificação de admin.
    Esta função deve verificar se o usuário autenticado é admin.
    """
    # Exemplo de como seria:
    # user = await get_user_by_id(session, user_id)
    # if not user["is_admin"]:
    #     raise HTTPException(status_code=403, detail="Acesso negado: privilégios de admin necessários")
    return user_id


# ============================================================================
# ⚠️ IMPORTANTE: ORDEM DOS ENDPOINTS
# /me DEVE VIR ANTES DE /{user_id} para não ser capturado!
# ============================================================================

@router.get("/me", response_model=UserListItem)
async def get_current_user_data(
    session: AsyncSession = Depends(get_session),
    current_user_id: int = Depends(get_current_user_id),
) -> UserListItem:
    """
    🔵 ENDPOINT PÚBLICO (não requer admin)
    
    Retorna os dados do usuário atualmente autenticado.
    
    Este endpoint pode ser acessado por qualquer usuário autenticado
    para obter seus próprios dados (não requer privilégios de admin).
    
    Usado para:
    - Exibir informações do usuário na sidebar
    - Perfil do usuário
    - Verificar permissões (is_admin)
    """
    try:
        user = await get_user_by_id(session, current_user_id)
        return UserListItem(**user)
    except UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário autenticado não encontrado no sistema"
        )


@router.get("", response_model=UsersPage)
async def list_users(
    session: AsyncSession = Depends(get_session),
    current_user_id: int = Depends(require_admin),
    page: int = Query(1, ge=1, description="Número da página"),
    page_size: int = Query(20, ge=1, le=100, description="Itens por página"),
    search: Optional[str] = Query(None, description="Buscar por nome, email ou posto"),
    is_active: Optional[bool] = Query(None, description="Filtrar por status ativo"),
    is_admin: Optional[bool] = Query(None, description="Filtrar por status admin"),
) -> UsersPage:
    """
    🔴 ENDPOINT ADMINISTRATIVO (requer admin)
    
    Lista todos os usuários do sistema (somente admins).
    
    Filtros disponíveis:
    - search: Busca por username, email ou posto_graduacao
    - is_active: true/false para filtrar por status
    - is_admin: true/false para filtrar por permissão
    """
    data = await get_users_page(
        session,
        page=page,
        page_size=page_size,
        search=search,
        is_active=is_active,
        is_admin=is_admin,
    )
    return UsersPage(**data)


@router.get("/{user_id}", response_model=UserListItem)
async def get_user(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    current_user_id: int = Depends(require_admin),
) -> UserListItem:
    """
    🔴 ENDPOINT ADMINISTRATIVO (requer admin)
    
    Busca um usuário específico por ID (somente admins).
    
    ⚠️ Este endpoint DEVE vir DEPOIS do /me!
    """
    try:
        user = await get_user_by_id(session, user_id)
        return UserListItem(**user)
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.patch("/{user_id}/admin", response_model=dict)
async def update_admin_status(
    user_id: int,
    data: UserUpdateAdmin,
    session: AsyncSession = Depends(get_session),
    current_user_id: int = Depends(require_admin),
) -> dict:
    """
    🔴 ENDPOINT ADMINISTRATIVO (requer admin)
    
    Promove ou remove privilégios de admin de um usuário (somente admins).
    
    Validações:
    - Não permite remover admin do próprio usuário se for o último admin
    - Retorna erro se o usuário não existir
    """
    try:
        # Verificar se está tentando remover admin de si mesmo
        if user_id == current_user_id and not data.is_admin:
            # Verificar se é o último admin
            admin_count = await count_active_admins(session)
            if admin_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Não é possível remover privilégios de admin do único admin ativo do sistema"
                )
        
        user = await update_user_admin_status(session, user_id, data.is_admin)
        
        return {
            "message": f"Usuário {'promovido a' if data.is_admin else 'removido de'} admin com sucesso",
            "user": user
        }
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.patch("/{user_id}/active", response_model=dict)
async def update_active_status(
    user_id: int,
    data: UserUpdateActive,
    session: AsyncSession = Depends(get_session),
    current_user_id: int = Depends(require_admin),
) -> dict:
    """
    🔴 ENDPOINT ADMINISTRATIVO (requer admin)
    
    Ativa ou desativa um usuário (somente admins).
    
    Validações:
    - Não permite desativar o próprio usuário
    - Retorna erro se o usuário não existir
    """
    try:
        if user_id == current_user_id and not data.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não é possível desativar o próprio usuário"
            )
        
        user = await update_user_active_status(session, user_id, data.is_active)
        
        return {
            "message": f"Usuário {'ativado' if data.is_active else 'desativado'} com sucesso",
            "user": user
        }
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete("/{user_id}", response_model=dict)
async def delete_user_endpoint(
    user_id: int,
    session: AsyncSession = Depends(get_session),
    current_user_id: int = Depends(require_admin),
) -> dict:
    """
    🔴 ENDPOINT ADMINISTRATIVO (requer admin)
    
    Deleta um usuário do sistema (somente admins).
    
    Validações:
    - Não permite deletar o próprio usuário
    - Retorna erro se o usuário não existir
    
    ATENÇÃO: Esta ação é irreversível!
    """
    try:
        user = await delete_user(session, user_id, current_user_id)
        
        return {
            "message": "Usuário deletado com sucesso",
            "user": user
        }
    except UserNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except CannotDeleteSelfError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )