# app/auth/deps.py
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Depends, HTTPException, status
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.security import decode_token
from app.db import get_session

security = HTTPBearer(auto_error=False)

async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_session),
):
    if not creds:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    try:
        payload = decode_token(creds.credentials)
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    row = (await session.execute(
        text("SELECT id, username, email, posto_graduacao, is_active FROM users WHERE username = :u"),
        {"u": username}
    )).mappings().first()

    if not row or not row["is_active"]:
        raise HTTPException(status_code=401, detail="User disabled or not found")

    return dict(row)
