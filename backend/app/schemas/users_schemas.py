from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserBase(BaseModel):
    username: str
    email: EmailStr
    posto_graduacao: str


class UserInDB(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    om_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class UserListItem(BaseModel):
    """Schema para listagem de usuários (sem informações sensíveis)"""
    id: int
    username: str
    email: str
    posto_graduacao: str
    is_active: bool
    is_admin: bool
    om_id: Optional[int] = None
    created_at: datetime


class UsersPage(BaseModel):
    """Resposta paginada de usuários"""
    items: list[UserListItem]
    total: int
    page: int
    page_size: int


class UserUpdateAdmin(BaseModel):
    """Schema para promover/remover admin"""
    is_admin: bool


class UserUpdateActive(BaseModel):
    """Schema para ativar/desativar usuário"""
    is_active: bool