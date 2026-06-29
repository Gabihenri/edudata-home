from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.schemas.user import UserBase, UserResponse
from app.services.user_service import UserService


router = APIRouter(
    prefix="/api/v1/users",
    tags=["Users"],
)


@router.get("/")
def list_users(
    limit: int = Query(100, ge=1, le=200),
) -> dict[str, Any]:
    users = UserService.list(limit=limit)

    return {
        "total": len(users),
        "items": users,
    }


@router.get("/{user_id}")
def get_user(user_id: str) -> dict[str, Any]:
    user = UserService.find_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado.",
        )

    return user


@router.get("/email/{email}")
def get_user_by_email(email: str) -> dict[str, Any]:
    user = UserService.find_by_email(email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado.",
        )

    return user


@router.get("/school/{school_id}")
def list_users_by_school(
    school_id: str,
    limit: int = Query(100, ge=1, le=200),
) -> dict[str, Any]:
    users = UserService.list_by_school(
        school_id=school_id,
        limit=limit,
    )

    return {
        "total": len(users),
        "items": users,
    }


@router.post("/", response_model=UserResponse)
def create_user(payload: UserBase) -> dict[str, Any]:
    try:
        return UserService.create(payload.model_dump())

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )


@router.put("/{user_id}")
def update_user(
    user_id: str,
    payload: UserBase,
) -> dict[str, Any]:
    user = UserService.update(
        user_id=user_id,
        data=payload.model_dump(),
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado.",
        )

    return user


@router.patch("/{user_id}/activate")
def activate_user(user_id: str):
    user = UserService.activate(user_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado.",
        )

    return {
        "message": "Usuário ativado com sucesso.",
        "user": user,
    }


@router.patch("/{user_id}/deactivate")
def deactivate_user(user_id: str):
    user = UserService.deactivate(user_id)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado.",
        )

    return {
        "message": "Usuário desativado com sucesso.",
        "user": user,
    }