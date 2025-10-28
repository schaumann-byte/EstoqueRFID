# app/auth/router.py
from fastapi import APIRouter, Depends, HTTPException, Response, Cookie
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.db import get_session
from app.auth.schemas import SignupIn, LoginIn, UserOut, TokenPair, AccessToken
from app.auth.repo import (
    get_user_by_username, get_user_by_email, create_user,
    save_refresh, is_refresh_revoked, revoke_refresh
)
from app.core.security import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
)
from app.auth.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

# Configurações de cookie centralizadas
COOKIE_CONFIG = {
    "key": "refresh_token",
    "httponly": True,
    "samesite": "lax",
    "secure": False,  # True em produção
    "path": "/",
    "max_age": 60 * 60 * 24 * 7,  # 7 dias
}

@router.post("/signup", response_model=UserOut, status_code=201)
async def signup(payload: SignupIn, session: AsyncSession = Depends(get_session)):
    if await get_user_by_username(session, payload.username):
        raise HTTPException(status_code=409, detail="Username já em uso")
    if await get_user_by_email(session, payload.email):
        raise HTTPException(status_code=409, detail="E-mail já em uso")

    user = await create_user(
        session,
        username=payload.username,
        email=payload.email,
        posto_graduacao=payload.posto_graduacao,
        password_hash=hash_password(payload.password),
    )
    return {
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "posto_graduacao": user["posto_graduacao"]
    }

@router.post("/login", response_model=TokenPair)
async def login(
    payload: LoginIn,
    response: Response,
    session: AsyncSession = Depends(get_session)
):
    user = await get_user_by_email(session, payload.email)
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    if not user.get("is_active"):
        raise HTTPException(status_code=403, detail="Usuário inativo")

    access = create_access_token(sub=str(user["id"]))
    refresh, jti, exp = create_refresh_token(sub=str(user["id"]))
    await save_refresh(session, user_id=user["id"], jti=jti, exp=exp)

    response.set_cookie(**COOKIE_CONFIG, value=refresh)

    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserOut)
async def me(current=Depends(get_current_user)):
    return {
        "id": current["id"],
        "username": current["username"],
        "email": current["email"],
        "posto_graduacao": current["posto_graduacao"],
    }

@router.post("/refresh", response_model=AccessToken)
async def refresh_token(
    session: AsyncSession = Depends(get_session),
    refresh_token: Optional[str] = Cookie(default=None),
):
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token ausente")

    try:
        payload = decode_token(refresh_token)
        sub = payload.get("sub")
        jti = payload.get("jti")
        if not sub or not jti:
            raise HTTPException(status_code=401, detail="Token inválido")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expirado ou inválido")

    if await is_refresh_revoked(session, jti):
        raise HTTPException(status_code=401, detail="Token revogado")

    access = create_access_token(sub=sub)
    return {"access_token": access, "token_type": "bearer"}

@router.post("/logout")
async def logout(
    response: Response,
    session: AsyncSession = Depends(get_session),
    refresh_token: Optional[str] = Cookie(default=None),
):
    if refresh_token:
        try:
            payload = decode_token(refresh_token)
            jti = payload.get("jti")
            if jti:
                await revoke_refresh(session, jti)
        except JWTError:
            pass  # Token já inválido, apenas remove cookie
    
    # Remove cookie com EXATAMENTE as mesmas configurações do set_cookie
    response.delete_cookie(
        key=COOKIE_CONFIG["key"],
        path=COOKIE_CONFIG["path"],
        samesite=COOKIE_CONFIG["samesite"],
    )
    
    return {"ok": True}
