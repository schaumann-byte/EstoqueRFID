from sqlalchemy import text, bindparam, String, Boolean, Integer
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, Dict, Any


class UserNotFoundError(Exception):
    """Exceção quando usuário não é encontrado"""
    pass


class CannotDeleteSelfError(Exception):
    """Exceção quando tenta deletar o próprio usuário"""
    pass


# SQL para listar usuários com paginação e filtros
USERS_LIST_SQL = text("""
SELECT 
    u.id,
    u.username,
    u.email,
    u.posto_graduacao,
    u.is_active,
    u.is_admin,
    u.om_id,
    u.created_at,
    u.updated_at
FROM users u
WHERE 
    (:search IS NULL OR 
     u.username ILIKE :search OR 
     u.email ILIKE :search OR 
     u.posto_graduacao ILIKE :search)
    AND (:is_active IS NULL OR u.is_active = :is_active)
    AND (:is_admin IS NULL OR u.is_admin = :is_admin)
ORDER BY u.created_at DESC
LIMIT :limit OFFSET :offset
""").bindparams(
    bindparam("search", type_=String),
    bindparam("is_active", type_=Boolean),
    bindparam("is_admin", type_=Boolean),
    bindparam("limit", type_=Integer),
    bindparam("offset", type_=Integer)
)

USERS_COUNT_SQL = text("""
SELECT COUNT(*) AS total
FROM users u
WHERE 
    (:search IS NULL OR 
     u.username ILIKE :search OR 
     u.email ILIKE :search OR 
     u.posto_graduacao ILIKE :search)
    AND (:is_active IS NULL OR u.is_active = :is_active)
    AND (:is_admin IS NULL OR u.is_admin = :is_admin)
""").bindparams(
    bindparam("search", type_=String),
    bindparam("is_active", type_=Boolean),
    bindparam("is_admin", type_=Boolean)
)


async def get_users_page(
    session: AsyncSession,
    page: int = 1,
    page_size: int = 20,
    *,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    is_admin: Optional[bool] = None,
) -> Dict[str, Any]:
    """
    Lista usuários com paginação e filtros.
    
    Args:
        session: Sessão do banco de dados
        page: Número da página (começa em 1)
        page_size: Tamanho da página
        search: Termo de busca (username, email ou posto_graduacao)
        is_active: Filtrar por status ativo
        is_admin: Filtrar por status admin
    
    Returns:
        Dict com items, total, page e page_size
    """
    page = max(page, 1)
    page_size = max(min(page_size, 100), 1)
    offset = (page - 1) * page_size
    
    # Preparar parâmetros
    search_param = f"%{search}%" if search else None
    params = {
        "search": search_param,
        "is_active": is_active,
        "is_admin": is_admin,
        "limit": page_size,
        "offset": offset,
    }
    
    # Buscar total
    total_result = await session.execute(USERS_COUNT_SQL, params)
    total = int(total_result.scalar_one())
    
    # Buscar usuários
    rows_result = await session.execute(USERS_LIST_SQL, params)
    rows = rows_result.mappings().all()
    
    items = [
        {
            "id": r["id"],
            "username": r["username"],
            "email": r["email"],
            "posto_graduacao": r["posto_graduacao"],
            "is_active": r["is_active"],
            "is_admin": r["is_admin"],
            "om_id": r["om_id"],
            "created_at": r["created_at"],
        }
        for r in rows
    ]
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# SQL para buscar usuário por ID
GET_USER_SQL = text("""
SELECT 
    id, username, email, posto_graduacao, 
    is_active, is_admin, om_id, created_at, updated_at
FROM users 
WHERE id = :user_id
""")


async def get_user_by_id(session: AsyncSession, user_id: int) -> Dict[str, Any]:
    """
    Busca um usuário por ID.
    
    Args:
        session: Sessão do banco de dados
        user_id: ID do usuário
    
    Returns:
        Dados do usuário
    
    Raises:
        UserNotFoundError: Se o usuário não for encontrado
    """
    result = await session.execute(GET_USER_SQL, {"user_id": user_id})
    row = result.mappings().first()
    
    if not row:
        raise UserNotFoundError(f"Usuário {user_id} não encontrado")
    
    return dict(row)


# SQL para atualizar status admin
UPDATE_ADMIN_SQL = text("""
UPDATE users 
SET is_admin = :is_admin, updated_at = now()
WHERE id = :user_id
RETURNING id, username, email, is_admin
""")


async def update_user_admin_status(
    session: AsyncSession, 
    user_id: int, 
    is_admin: bool
) -> Dict[str, Any]:
    """
    Atualiza o status de admin de um usuário.
    
    Args:
        session: Sessão do banco de dados
        user_id: ID do usuário
        is_admin: Novo status de admin
    
    Returns:
        Dados atualizados do usuário
    
    Raises:
        UserNotFoundError: Se o usuário não for encontrado
    """
    result = await session.execute(
        UPDATE_ADMIN_SQL, 
        {"user_id": user_id, "is_admin": is_admin}
    )
    row = result.mappings().first()
    
    if not row:
        raise UserNotFoundError(f"Usuário {user_id} não encontrado")
    
    await session.commit()
    return dict(row)


# SQL para deletar usuário
DELETE_USER_SQL = text("""
DELETE FROM users 
WHERE id = :user_id
RETURNING id, username, email
""")


async def delete_user(
    session: AsyncSession, 
    user_id: int,
    current_user_id: int
) -> Dict[str, Any]:
    """
    Deleta um usuário do sistema.
    
    Args:
        session: Sessão do banco de dados
        user_id: ID do usuário a ser deletado
        current_user_id: ID do usuário atual (para evitar auto-exclusão)
    
    Returns:
        Dados do usuário deletado
    
    Raises:
        UserNotFoundError: Se o usuário não for encontrado
        CannotDeleteSelfError: Se tentar deletar o próprio usuário
    """
    if user_id == current_user_id:
        raise CannotDeleteSelfError("Não é possível deletar o próprio usuário")
    
    result = await session.execute(DELETE_USER_SQL, {"user_id": user_id})
    row = result.mappings().first()
    
    if not row:
        raise UserNotFoundError(f"Usuário {user_id} não encontrado")
    
    await session.commit()
    return dict(row)


# SQL para atualizar status ativo
UPDATE_ACTIVE_SQL = text("""
UPDATE users 
SET is_active = :is_active, updated_at = now()
WHERE id = :user_id
RETURNING id, username, email, is_active
""")


async def update_user_active_status(
    session: AsyncSession, 
    user_id: int, 
    is_active: bool
) -> Dict[str, Any]:
    """
    Atualiza o status ativo de um usuário.
    
    Args:
        session: Sessão do banco de dados
        user_id: ID do usuário
        is_active: Novo status ativo
    
    Returns:
        Dados atualizados do usuário
    
    Raises:
        UserNotFoundError: Se o usuário não for encontrado
    """
    result = await session.execute(
        UPDATE_ACTIVE_SQL, 
        {"user_id": user_id, "is_active": is_active}
    )
    row = result.mappings().first()
    
    if not row:
        raise UserNotFoundError(f"Usuário {user_id} não encontrado")
    
    await session.commit()
    return dict(row)


# SQL para contar admins
COUNT_ADMINS_SQL = text("""
SELECT COUNT(*) AS total
FROM users
WHERE is_admin = TRUE AND is_active = TRUE
""")


async def count_active_admins(session: AsyncSession) -> int:
    """
    Conta quantos admins ativos existem no sistema.
    
    Args:
        session: Sessão do banco de dados
    
    Returns:
        Número de admins ativos
    """
    result = await session.execute(COUNT_ADMINS_SQL)
    return int(result.scalar_one())