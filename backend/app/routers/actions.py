from typing import Any

from fastapi import APIRouter

from app.core.responses.api_response import ApiResponse


router = APIRouter(
    prefix="/api/v1/actions",
    tags=["Actions"],
)


@router.get("/")
def list_actions() -> dict[str, Any]:
    """
    Endpoint inicial do módulo de Ações.

    Será conectado futuramente ao ActionService.
    """

    return ApiResponse.success(
        data={
            "total": 0,
            "items": [],
        },
        message="Módulo de Ações inicializado com sucesso.",
    )
