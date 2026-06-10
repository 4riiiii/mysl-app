"""Auth helpers: JWT password auth + Emergent Google session exchange."""
import os
import uuid
import bcrypt
import httpx
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import HTTPException, Request, Response, Cookie, Header

from db import users, sessions_col
from models import User, UserOut

SESSION_DAYS = 7
EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"


def _hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def _verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def _new_user_id() -> str:
    return f"user_{uuid.uuid4().hex[:12]}"


def _new_session_token() -> str:
    return f"st_{uuid.uuid4().hex}"


async def _create_session(user_id: str) -> str:
    token = _new_session_token()
    expires = datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)
    await sessions_col.insert_one({
        "user_id": user_id,
        "session_token": token,
        "expires_at": expires.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return token


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key="session_token",
        value=token,
        max_age=SESSION_DAYS * 24 * 60 * 60,
        path="/",
        httponly=True,
        secure=True,
        samesite="none",
    )


async def register_with_password(email: str, password: str, name: str, response: Response):
    existing = await users.find_one({"email": email.lower()}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user_id = _new_user_id()
    doc = {
        "user_id": user_id,
        "email": email.lower(),
        "name": name,
        "picture": None,
        "auth_provider": "password",
        "password_hash": _hash_password(password),
        "voice": "coral",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await users.insert_one(doc)
    token = await _create_session(user_id)
    _set_session_cookie(response, token)
    return {
        "session_token": token,
        "user": UserOut(user_id=user_id, email=email.lower(), name=name, picture=None, voice="coral").model_dump(),
    }


async def login_with_password(email: str, password: str, response: Response):
    user_doc = await users.find_one({"email": email.lower()}, {"_id": 0})
    if not user_doc or user_doc.get("auth_provider") != "password":
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not _verify_password(password, user_doc.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = await _create_session(user_doc["user_id"])
    _set_session_cookie(response, token)
    return {
        "session_token": token,
        "user": UserOut(
            user_id=user_doc["user_id"],
            email=user_doc["email"],
            name=user_doc["name"],
            picture=user_doc.get("picture"),
            voice=user_doc.get("voice") or "coral",
        ).model_dump(),
    }


async def exchange_google_session(session_id: str, response: Response):
    """Exchange Emergent session_id for a session_token via Emergent backend."""
    async with httpx.AsyncClient(timeout=15.0) as cx:
        r = await cx.get(EMERGENT_AUTH_URL, headers={"X-Session-ID": session_id})
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Google session exchange failed")
    data = r.json()
    email = (data.get("email") or "").lower()
    if not email:
        raise HTTPException(status_code=401, detail="No email from Google")

    existing = await users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": data.get("name") or existing.get("name"),
                "picture": data.get("picture") or existing.get("picture"),
            }}
        )
    else:
        user_id = _new_user_id()
        await users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": data.get("name") or email.split("@")[0],
            "picture": data.get("picture"),
            "auth_provider": "google",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    # Use Emergent's session_token to create matching local session for 7 days
    emergent_token = data.get("session_token")
    token = emergent_token or _new_session_token()
    expires = datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)
    await sessions_col.insert_one({
        "user_id": user_id,
        "session_token": token,
        "expires_at": expires.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    _set_session_cookie(response, token)
    user_doc = await users.find_one({"user_id": user_id}, {"_id": 0})
    return {
        "session_token": token,
        "user": UserOut(
            user_id=user_id,
            email=user_doc["email"],
            name=user_doc["name"],
            picture=user_doc.get("picture"),
        ).model_dump(),
    }


async def _resolve_token(
    session_token: Optional[str],
    authorization: Optional[str],
) -> str:
    if session_token:
        return session_token
    if authorization and authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    raise HTTPException(status_code=401, detail="Not authenticated")


async def get_current_user(
    session_token: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None),
) -> User:
    token = await _resolve_token(session_token, authorization)
    sess = await sessions_col.find_one({"session_token": token}, {"_id": 0})
    if not sess:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = sess["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user_doc = await users.find_one({"user_id": sess["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**{k: v for k, v in user_doc.items() if k in User.model_fields})


async def logout_user(
    response: Response,
    session_token: Optional[str] = Cookie(default=None),
    authorization: Optional[str] = Header(default=None),
):
    try:
        token = await _resolve_token(session_token, authorization)
        await sessions_col.delete_one({"session_token": token})
    except HTTPException:
        pass
    response.delete_cookie("session_token", path="/")
    return {"ok": True}
