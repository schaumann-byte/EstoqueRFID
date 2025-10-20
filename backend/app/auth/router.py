# app/auth/router.py
from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.auth.schemas import SignupIn, LoginIn, UserOut, TokenPair, AccessToken
from app.auth.repo import (
    get_user_by_username, get_user_by_email, create_user,
    save_refresh, is_refresh_revoked, revoke_refresh
)
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.auth.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

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
    return {"id": user["id"], "username": user["username"], "email": user["email"], "posto_graduacao": user["posto_graduacao"]}

@router.post("/login", response_model=TokenPair)
async def login(payload: LoginIn, session: AsyncSession = Depends(get_session)):
    user = await get_user_by_username(session, payload.username)
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    access = create_access_token(sub=user["username"])
    refresh, jti, exp = create_refresh_token(sub=user["username"])
    await save_refresh(session, user_id=user["id"], jti=jti, exp=exp)
    return {"access_token": access, "refresh_token": refresh}

@router.get("/me", response_model=UserOut)
async def me(current=Depends(get_current_user)):
    return {
        "id": current["id"],
        "username": current["username"],
        "email": current["email"],
        "posto_graduacao": current["posto_graduacao"],
    }

@router.post("/refresh", response_model=AccessToken)
async def refresh_token(refresh_token: str, session: AsyncSession = Depends(get_session)):
    try:
        payload = decode_token(refresh_token)
        username = payload.get("sub")
        jti = payload.get("jti")
        if not username or not jti:
            raise HTTPException(status_code=401, detail="Refresh inválido")
    except JWTError:
        raise HTTPException(status_code=401, detail="Refresh expirado/inválido")

    if await is_refresh_revoked(session, jti):
        raise HTTPException(status_code=401, detail="Refresh revogado ou desconhecido")

    access = create_access_token(sub=username)
    return {"access_token": access}

@router.post("/logout")
async def logout(refresh_token: str, session: AsyncSession = Depends(get_session)):
    try:
        jti = decode_token(refresh_token).get("jti")
        if not jti:
            raise HTTPException(status_code=400, detail="Refresh inválido")
    except JWTError:
        raise HTTPException(status_code=400, detail="Refresh inválido")

    await revoke_refresh(session, jti)
    return {"ok": True}
