from typing import Any

from fastapi import APIRouter, HTTPException, Query

from app.core.exceptions.exceptions import EduDataException
from app.core.responses.api_response import ApiResponse
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
    try:
        users = UserService.list(limit=limit)

        return ApiResponse.success(
            data={
                "total": len(users),
                "items": users,
            },
            message="Usuários listados com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        )


@router.get("/{user_id}")
def get_user(user_id: str) -> dict[str, Any]:
    try:
        user = UserService.find_by_id(user_id)

        if not user:
            raise HTTPException(
                status_code=404,
                detail="Usuário não encontrado.",
            )

        return ApiResponse.success(
            data=user,
            message="Usuário encontrado com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        )


@router.get("/email/{email}")
def get_user_by_email(email: str) -> dict[str, Any]:
    try:
        user = UserService.find_by_email(email)

        if not user:
            raise HTTPException(
                status_code=404,
                detail="Usuário não encontrado.",
            )

        return ApiResponse.success(
            data=user,
            message="Usuário encontrado com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        )


@router.get("/school/{school_id}")
def list_users_by_school(
    school_id: str,
    limit: int = Query(100, ge=1, le=200),
) -> dict[str, Any]:
    try:
        users = UserService.list_by_school(
            school_id=school_id,
            limit=limit,
        )

        return ApiResponse.success(
            data={
                "total": len(users),
                "items": users,
            },
            message="Usuários da escola listados com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        )


@router.post("/", response_model=None)
def create_user(payload: UserBase) -> dict[str, Any]:
    try:
        user = UserService.create(payload.model_dump())

        return ApiResponse.created(
            data=user,
            message="Usuário criado com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        )


@router.put("/{user_id}")
def update_user(
    user_id: str,
    payload: UserBase,
) -> dict[str, Any]:
    try:
        user = UserService.update(
            record_id=user_id,
            data=payload.model_dump(),
        )

        if not user:
            raise HTTPException(
                status_code=404,
                detail="Usuário não encontrado.",
            )

        return ApiResponse.updated(
            data=user,
            message="Usuário atualizado com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        )


@router.patch("/{user_id}/activate")
def activate_user(user_id: str) -> dict[str, Any]:
    try:
        user = UserService.activate(user_id)

        if not user:
            raise HTTPException(
                status_code=404,
                detail="Usuário não encontrado.",
            )

        return ApiResponse.updated(
            data=user,
            message="Usuário ativado com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        )


@router.patch("/{user_id}/deactivate")
def deactivate_user(user_id: str) -> dict[str, Any]:
    try:
        user = UserService.deactivate(user_id)

        if not user:
            raise HTTPException(
                status_code=404,
                detail="Usuário não encontrado.",
            )

        return ApiResponse.updated(
            data=user,
            message="Usuário desativado com sucesso.",
        )

    except EduDataException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        )