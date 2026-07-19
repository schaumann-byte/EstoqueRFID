from datetime import datetime, timedelta, timezone
from jose import jwt
# pyrefly: ignore [missing-import]
import bcrypt
from app.core.config import settings
import uuid

def hash_password(plain: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(plain.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def _utcnow():
    return datetime.now(timezone.utc)

def create_access_token(sub: str):
    exp = _utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": sub, "exp": exp}, settings.JWT_SECRET, algorithm=settings.JWT_ALG)

def create_refresh_token(sub: str):
    exp = _utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    jti = str(uuid.uuid4())
    token = jwt.encode({"sub": sub, "exp": exp, "jti": jti}, settings.JWT_SECRET, algorithm=settings.JWT_ALG)
    return token, jti, exp

def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])