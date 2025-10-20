# app/auth/repo.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

async def get_user_by_username(session: AsyncSession, username: str):
    q = text("SELECT id, username, email, posto_graduacao, password_hash, is_active FROM users WHERE username = :u")
    row = (await session.execute(q, {"u": username})).mappings().first()
    return dict(row) if row else None

async def get_user_by_email(session: AsyncSession, email: str):
    q = text("SELECT id, username, email, posto_graduacao, password_hash, is_active FROM users WHERE email = :e")
    row = (await session.execute(q, {"e": email})).mappings().first()
    return dict(row) if row else None

async def create_user(session: AsyncSession, *, username: str, email: str, posto_graduacao: str, password_hash: str):
    q = text("""
        INSERT INTO users (username, email, posto_graduacao, password_hash)
        VALUES (:u, :e, :p, :h)
        RETURNING id, username, email, posto_graduacao, is_active
    """)
    row = (await session.execute(q, {"u": username, "e": email, "p": posto_graduacao, "h": password_hash})).mappings().one()
    await session.commit()
    return dict(row)

# Refresh tokens persistidos (revogação)
async def save_refresh(session: AsyncSession, user_id: int, jti: str, exp):
    q = text("""
      INSERT INTO refresh_tokens (user_id, token_jti, expires_at)
      VALUES (:uid, :jti, :exp)
      ON CONFLICT (token_jti) DO NOTHING
    """)
    await session.execute(q, {"uid": user_id, "jti": jti, "exp": exp})
    await session.commit()

async def is_refresh_revoked(session: AsyncSession, jti: str) -> bool:
    q = text("SELECT revoked_at FROM refresh_tokens WHERE token_jti = :jti")
    row = (await session.execute(q, {"jti": jti})).mappings().first()
    if not row:
        return True
    return row["revoked_at"] is not None

async def revoke_refresh(session: AsyncSession, jti: str):
    q = text("UPDATE refresh_tokens SET revoked_at = now() WHERE token_jti = :jti")
    await session.execute(q, {"jti": jti})
    await session.commit()
