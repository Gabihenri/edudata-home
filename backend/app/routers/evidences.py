from typing import Any

from fastapi import APIRouter

from app.core.responses.api_response import ApiResponse


router = APIRouter(
    prefix="/api/v1/evidences",
    tags=["Evidences"],
)


@router.get("/")
def list_evidences() -> dict[str, Any]:
    """
    Endpoint temporário da Agenda Inteligente EDI.

    Será conectado futuramente ao EvidenceService.
    """

    return ApiResponse.success(
        data={
            "total": 0,
            "items": [],
        },
        message="Módulo de Evidências inicializado com sucesso.",
    )