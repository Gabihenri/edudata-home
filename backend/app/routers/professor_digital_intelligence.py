from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from app.core.responses.api_response import ApiResponse
from app.services.capabilities.dispatcher import capability_dispatcher
from app.services.capabilities.exceptions import CapabilityError
from app.services.capabilities.professor_digital_capabilities import (
    PROFESSIONAL_TRAJECTORY_INTELLIGENCE_ID,
)


router = APIRouter(
    prefix="/api/v1/intelligence/professor-digital",
    tags=["EDI Professor Digital Intelligence"],
)

DEFAULT_ROLE = "professor"
CONTRACT_VERSION = "professional-trajectory-analysis-v1"


def _as_record(value: Any) -> dict[str, Any]:
    return {**value} if isinstance(value, dict) else {}


def _as_records(value: Any) -> list[dict[str, Any]]:
    return [{**item} for item in value if isinstance(item, dict)] if isinstance(value, list) else []


def _normalize_role(payload: dict[str, Any]) -> str:
    context = _as_record(payload.get("context"))
    role = context.get("role") or payload.get("role") or DEFAULT_ROLE
    return role.strip().lower() if isinstance(role, str) and role.strip() else DEFAULT_ROLE


def _build_resolution_context(payload: dict[str, Any]) -> dict[str, bool]:
    user_context = bool(_as_record(payload.get("user_context")))
    history = bool(_as_records(payload.get("history")))
    return {
        "user_context": user_context,
        "objectives": bool(_as_record(payload.get("user_context"))),
        "history": history,
    }


def _capability_metadata(dispatch_result: Any) -> dict[str, Any]:
    return {
        "capability_id": dispatch_result.capability_id,
        "identity": dispatch_result.capability.identity(),
        "duration_ms": dispatch_result.duration_ms,
        "execution_mode": dispatch_result.capability.execution_mode.value,
        "risk_level": dispatch_result.capability.risk_level.value,
        "audit_required": dispatch_result.capability.audit_required,
    }


@router.get("/health")
def professor_digital_intelligence_health() -> dict[str, Any]:
    return ApiResponse.success(
        data={
            "service": "edi-professor-digital-intelligence",
            "module": "professor_digital",
            "status": "available",
            "execution_layer": "educational-capability-platform",
            "capability": PROFESSIONAL_TRAJECTORY_INTELLIGENCE_ID,
            "contract_version": CONTRACT_VERSION,
            "database_accessed": False,
            "generative_ai_used": False,
        },
        message="Inteligência da trajetória profissional disponível.",
    )


@router.post("/trajectory-analysis")
def generate_professional_trajectory_analysis(payload: dict[str, Any]) -> dict[str, Any]:
    """Executa a leitura reflexiva da trajetória por meio do EIOS.

    A rota trabalha apenas com o contexto e histórico enviados pelo consumidor.
    Não consulta banco diretamente, não realiza avaliação institucional e não
    produz diagnóstico psicológico ou decisões automáticas.
    """
    try:
        normalized_payload = payload if isinstance(payload, dict) else {}
        user_context = _as_record(normalized_payload.get("user_context"))
        history = _as_records(normalized_payload.get("history"))

        dispatch_result = capability_dispatcher.dispatch(
            PROFESSIONAL_TRAJECTORY_INTELLIGENCE_ID,
            payload={
                "user_context": user_context,
                "history": history,
            },
            role=_normalize_role(normalized_payload),
            context=_build_resolution_context(normalized_payload),
            confirmation_provided=False,
            allow_experimental=False,
            allow_beta=False,
            allow_deprecated=False,
            require_stable=True,
            metadata={
                "source": "professor-digital-intelligence-api",
                "contract_version": CONTRACT_VERSION,
                "transport": "fastapi",
                "user_authorized_data_only": True,
            },
        )

        result = dispatch_result.result
        if not isinstance(result, dict):
            raise HTTPException(
                status_code=500,
                detail="A capacidade de inteligência da trajetória retornou um contrato inválido.",
            )

        return ApiResponse.success(
            data={
                "module": "professor_digital",
                "contract_version": CONTRACT_VERSION,
                "capability": _capability_metadata(dispatch_result),
                "result": result,
            },
            message="Leitura da trajetória profissional processada com sucesso.",
        )

    except HTTPException:
        raise
    except CapabilityError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
    except Exception as exc:
        print(
            "[PROFESSOR_DIGITAL_TRAJECTORY_ANALYSIS_ERROR]",
            {"error_type": type(exc).__name__, "message": str(exc)},
        )
        raise HTTPException(
            status_code=500,
            detail="Não foi possível processar a leitura da trajetória profissional.",
        ) from exc
