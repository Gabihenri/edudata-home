"""Authenticate requests using the official Supabase Auth access token.

This dependency validates the bearer token with Supabase Auth instead of
assuming that a Supabase-issued JWT was signed with the API's private secret.
It does not grant institutional permissions; membership and resource scope must
be resolved separately for each protected operation.
"""
from typing import Any

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

security = HTTPBearer(auto_error=False)


def get_supabase_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict[str, Any]:
    """Return the authenticated Supabase user or fail closed."""
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Token não informado.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Import lazily so importing this dependency does not initialize a client
    # or prevent unrelated unit tests and health modules from loading.
    from app.core.config import SUPABASE_KEY, SUPABASE_URL

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(
            status_code=503,
            detail="Autenticação indisponível: configuração do Supabase ausente.",
        )

    try:
        from supabase import create_client

        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        response = client.auth.get_user(credentials.credentials)
        user = getattr(response, "user", None)
        if user is None:
            raise HTTPException(
                status_code=401,
                detail="Token inválido ou expirado.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_id = getattr(user, "id", None)
        if not isinstance(user_id, str) or not user_id.strip():
            raise HTTPException(
                status_code=401,
                detail="Identidade inválida no provedor de autenticação.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return {
            "id": user_id,
            "email": getattr(user, "email", None),
            "user_metadata": getattr(user, "user_metadata", None) or {},
            "app_metadata": getattr(user, "app_metadata", None) or {},
            "auth_provider": "supabase",
        }
    except HTTPException:
        raise
    except Exception as exc:
        # Auth API errors commonly expose an HTTP status. Treat rejected
        # credentials as 401; transient/network/provider failures as 503.
        status_code = getattr(exc, "status", None)
        if status_code in (400, 401, 403):
            raise HTTPException(
                status_code=401,
                detail="Token inválido ou expirado.",
                headers={"WWW-Authenticate": "Bearer"},
            ) from exc

        raise HTTPException(
            status_code=503,
            detail="Não foi possível validar a sessão no Supabase Auth.",
        ) from exc
