"""Authenticated user directory endpoints.

Administrative mutations remain intentionally unavailable until the Auth-user
lifecycle and profile-to-membership identity contract are implemented.
"""
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials

from app.core.security.current_membership import get_current_membership
from app.core.security.current_user import security
from app.repositories.user_access_repository import (
    get_user_for_membership,
    list_users_for_membership,
)
from app.core.responses.api_response import ApiResponse


router = APIRouter(
    prefix="/api/v1/users",
    tags=["Users"],
)


def _access_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    return credentials.credentials


@router.get("/")
def list_users(
    limit: int = Query(100, ge=1, le=200),
    access_token: str = Depends(_access_token),
    membership: dict[str, Any] = Depends(get_current_membership),
) -> dict[str, Any]:
    users = list_users_for_membership(
        access_token=access_token,
        membership=membership,
        limit=limit,
    )
    return ApiResponse.success(
        data={"total": len(users), "items": users},
        message="Usuários listados com sucesso.",
    )


@router.get("/{user_id}")
def get_user(
    user_id: str,
    access_token: str = Depends(_access_token),
    membership: dict[str, Any] = Depends(get_current_membership),
) -> dict[str, Any]:
    user = get_user_for_membership(
        access_token=access_token,
        membership=membership,
        user_id=user_id,
    )
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado.")

    return ApiResponse.success(
        data=user,
        message="Usuário encontrado com sucesso.",
    )


@router.get("/school/{school_id}")
def list_users_by_school(
    school_id: str,
    limit: int = Query(100, ge=1, le=200),
    access_token: str = Depends(_access_token),
    membership: dict[str, Any] = Depends(get_current_membership),
) -> dict[str, Any]:
    # A path parameter is a requested filter, never an authorization source.
    authorized_school_id = membership.get("school_id")
    if not isinstance(authorized_school_id, str) or school_id != authorized_school_id:
        raise HTTPException(status_code=403, detail="Escola fora do escopo do vínculo ativo.")

    users = list_users_for_membership(
        access_token=access_token,
        membership=membership,
        limit=limit,
    )
    return ApiResponse.success(
        data={"total": len(users), "items": users},
        message="Usuários da escola listados com sucesso.",
    )


def _mutations_temporarily_disabled() -> None:
    raise HTTPException(
        status_code=501,
        detail=(
            "Operação temporariamente indisponível até a integração segura "
            "do ciclo de vida de usuários com o Supabase Auth."
        ),
    )


@router.post("/", response_model=None)
def create_user() -> None:
    _mutations_temporarily_disabled()


@router.put("/{user_id}")
def update_user(user_id: str) -> None:
    _mutations_temporarily_disabled()


@router.patch("/{user_id}/activate")
def activate_user(user_id: str) -> None:
    _mutations_temporarily_disabled()


@router.patch("/{user_id}/deactivate")
def deactivate_user(user_id: str) -> None:
    _mutations_temporarily_disabled()
