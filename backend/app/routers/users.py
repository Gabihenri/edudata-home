from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.exceptions.exceptions import EduDataException
from app.core.responses.api_response import ApiResponse
from app.core.security.supabase_user import get_supabase_user
from app.schemas.user import UserBase
from app.services.user_service import UserService

router = APIRouter(prefix="/api/v1/users", tags=["Users"])


def _require_self_profile(actor: dict[str, Any], user: dict[str, Any]) -> None:
    actor_id = actor.get("id")
    linked_id = user.get("auth_provider_id")
    if not isinstance(actor_id, str) or not actor_id:
        raise HTTPException(status_code=401, detail="Identidade autenticada inválida.")
    if linked_id != actor_id:
        raise HTTPException(status_code=403, detail="Acesso ao perfil não autorizado.")


def _management_not_ready() -> None:
    # Fail closed until a verified, database-backed can_manage_users scope
    # resolver is integrated. Authentication alone does not grant admin access.
    raise HTTPException(
        status_code=403,
        detail="Gestão de usuários indisponível até a validação do escopo administrativo.",
    )


@router.get("/")
def list_users(
    limit: int = Query(100, ge=1, le=200),
    actor: dict[str, Any] = Depends(get_supabase_user),
) -> dict[str, Any]:
    _management_not_ready()


@router.get("/email/{email}")
def get_user_by_email(
    email: str,
    actor: dict[str, Any] = Depends(get_supabase_user),
) -> dict[str, Any]:
    actor_email = actor.get("email")
    if not isinstance(actor_email, str) or actor_email.casefold() != email.casefold():
        raise HTTPException(status_code=403, detail="Acesso ao perfil não autorizado.")
    try:
        user = UserService.find_by_email(email)
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")
        _require_self_profile(actor, user)
        return ApiResponse.success(data=user, message="Perfil encontrado com sucesso.")
    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.get("/school/{school_id}")
def list_users_by_school(
    school_id: str,
    limit: int = Query(100, ge=1, le=200),
    actor: dict[str, Any] = Depends(get_supabase_user),
) -> dict[str, Any]:
    _management_not_ready()


@router.get("/{user_id}")
def get_user(
    user_id: str,
    actor: dict[str, Any] = Depends(get_supabase_user),
) -> dict[str, Any]:
    try:
        user = UserService.find_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="Usuário não encontrado.")
        _require_self_profile(actor, user)
        return ApiResponse.success(data=user, message="Perfil encontrado com sucesso.")
    except EduDataException as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message)


@router.post("/", response_model=None)
def create_user(
    payload: UserBase,
    actor: dict[str, Any] = Depends(get_supabase_user),
) -> dict[str, Any]:
    _management_not_ready()


@router.put("/{user_id}")
def update_user(
    user_id: str,
    payload: UserBase,
    actor: dict[str, Any] = Depends(get_supabase_user),
) -> dict[str, Any]:
    _management_not_ready()


@router.patch("/{user_id}/activate")
def activate_user(
    user_id: str,
    actor: dict[str, Any] = Depends(get_supabase_user),
) -> dict[str, Any]:
    _management_not_ready()


@router.patch("/{user_id}/deactivate")
def deactivate_user(
    user_id: str,
    actor: dict[str, Any] = Depends(get_supabase_user),
) -> dict[str, Any]:
    _management_not_ready()
