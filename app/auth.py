from __future__ import annotations

import os
import secrets
from functools import wraps
from typing import Callable

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer(auto_error=False)

# simple in-memory token store
_SESSIONS: set[str] = set()


def admin_password() -> str:
    return os.getenv("ADMIN_PASSWORD", "changeme")


def public_question_bank() -> bool:
    return os.getenv("PUBLIC_QUESTION_BANK", "false").lower() in {"1", "true", "yes"}


def login(password: str) -> str:
    if not secrets.compare_digest(password, admin_password()):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = secrets.token_urlsafe(32)
    _SESSIONS.add(token)
    return token


def logout(token: str) -> None:
    _SESSIONS.discard(token)


def require_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    x_admin_token: str | None = Header(default=None),
) -> str:
    token = None
    if credentials and credentials.scheme.lower() == "bearer":
        token = credentials.credentials
    elif x_admin_token:
        token = x_admin_token
    if not token or token not in _SESSIONS:
        # also allow direct password header for scripts: X-Admin-Password
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Admin authorization required")
    return token


def optional_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    x_admin_token: str | None = Header(default=None),
) -> str | None:
    token = None
    if credentials and credentials.scheme.lower() == "bearer":
        token = credentials.credentials
    elif x_admin_token:
        token = x_admin_token
    if token and token in _SESSIONS:
        return token
    return None
