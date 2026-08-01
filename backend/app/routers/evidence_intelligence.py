from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from app.core.responses.api_response import ApiResponse
from app.services.capabilities.agenda_capabilities import (
    AGENDA_DASHBOARD_INTELLIGENCE_ID,
    EVIDENCE_COMPLETION_ANALYSIS_ID,
    PLANNING_WEEKLY_ANALYSIS_ID,
)
from app.services.capabilities.dispatcher import (
    capability_dispatcher,
)
from app.services.capabilities.exceptions import (
    CapabilityError,
)


router = APIRouter(
    prefix="/api/v1/intelligence/evidence",
    tags=[
        "EDI Evidence Intelligence",
    ],
)


DEFAULT_ROLE = "professor"


def _as_record(
    value: Any,
) -> dict[str, Any]:
    if not isinstance(
        value,
        dict,
    ):
        return {}

    return {
        **value,
    }


def _optional_text(
    value: Any,
) -> str | None:
    if (
        isinstance(
            value,
            str,
        )
        and value.strip()
    ):
        return value.strip()

    return None


def _normalize_role(
    payload: dict[str, Any],
) -> str:
    context = _as_record(
        payload.get(
            "context",
        ),
    )

    role = (
        _optional_text(
            context.get(
                "role",
            ),
        )
        or _optional_text(
            payload.get(
                "role",
            ),
        )
        or DEFAULT_ROLE
    )

    return role.lower()


def _require_record(
    payload: dict[str, Any],
    *,
    field_name: str,
    capability_id: str,
) -> dict[str, Any]:
    value = _as_record(
        payload.get(
            field_name,
        ),
    )

    if value:
        return value

    raise HTTPException(
        status_code=400,
        detail=(
            f"O campo '{field_name}' é obrigatório e deve "
            f"conter o resultado de '{capability_id}'."
        ),
    )


def _build_resolution_context(
) -> dict[str, bool]:
    return {
        "user_context": True,
        "agenda": True,
        "planning": True,
        "objectives": True,
        "lessons": True,
        "evidences": True,
        "indicators": True,
        "recommendations": True,
        "analytics": True,
    }


def _build_capability_metadata(
    dispatch_result: Any,
) -> dict[str, Any]:
    return {
        "capability_id": (
            dispatch_result.capability_id
        ),
        "identity": (
            dispatch_result
            .capability
            .identity()
        ),
        "duration_ms": (
            dispatch_result.duration_ms
        ),
        "execution_mode": (
            dispatch_result
            .capability
            .execution_mode
            .value
        ),
        "risk_level": (
            dispatch_result
            .capability
            .risk_level
            .value
        ),
        "audit_required": (
            dispatch_result
            .capability
            .audit_required
        ),
    }


def _raise_capability_http_error(
    exc: CapabilityError,
) -> None:
    print(
        "[ECP_EVIDENCE_COMPLETION_ERROR]",
        {
            "capability_id": (
                exc.capability_id
            ),
            "error_code": (
                exc.error_code
            ),
            "status_code": (
                exc.status_code
            ),
        },
    )

    raise HTTPException(
        status_code=(
            exc.status_code
        ),
        detail=(
            exc.message
        ),
    ) from exc


@router.get("/health")
def evidence_intelligence_health(
) -> dict[str, Any]:
    """
    Verifica a disponibilidade da inteligência de evidências.

    Não executa capacidades e não acessa dados operacionais.
    """

    return ApiResponse.success(
        data={
            "service": (
                "edi-evidence-intelligence"
            ),
            "module": "agenda",
            "status": "available",
            "execution_layer": (
                "educational-capability-platform"
            ),
            "capability": (
                EVIDENCE_COMPLETION_ANALYSIS_ID
            ),
            "source_capabilities": [
                AGENDA_DASHBOARD_INTELLIGENCE_ID,
                PLANNING_WEEKLY_ANALYSIS_ID,
            ],
            "database_accessed": False,
            "storage_accessed": False,
            "generative_ai_used": False,
        },
        message=(
            "Inteligência de evidências disponível."
        ),
    )


@router.post("/completion-analysis")
def generate_evidence_completion_analysis(
    payload: dict[str, Any],
) -> dict[str, Any]:
    """
    Executa evidence.completion_analysis.

    O consumidor deve enviar os resultados previamente
    processados de:

    - agenda.dashboard_intelligence;
    - planning.weekly_planning_analysis.

    A rota não acessa banco, Storage ou conteúdo de arquivos.
    """

    try:
        normalized_payload = (
            payload
            if isinstance(
                payload,
                dict,
            )
            else {}
        )

        dashboard_intelligence = (
            _require_record(
                normalized_payload,
                field_name=(
                    "dashboard_intelligence"
                ),
                capability_id=(
                    AGENDA_DASHBOARD_INTELLIGENCE_ID
                ),
            )
        )

        weekly_analysis = (
            _require_record(
                normalized_payload,
                field_name=(
                    "weekly_analysis"
                ),
                capability_id=(
                    PLANNING_WEEKLY_ANALYSIS_ID
                ),
            )
        )

        role = _normalize_role(
            normalized_payload,
        )

        dispatch_result = (
            capability_dispatcher.dispatch(
                EVIDENCE_COMPLETION_ANALYSIS_ID,
                payload={
                    "dashboard_intelligence": (
                        dashboard_intelligence
                    ),
                    "weekly_analysis": (
                        weekly_analysis
                    ),
                },
                role=role,
                context=(
                    _build_resolution_context()
                ),
                confirmation_provided=False,
                allow_experimental=False,
                allow_beta=False,
                allow_deprecated=False,
                require_stable=True,
                metadata={
                    "source": (
                        "evidence-intelligence-api"
                    ),
                    "contract_version": (
                        "evidence-completion-analysis-v1"
                    ),
                    "transport": "fastapi",
                },
            )
        )

        result = (
            dispatch_result.result
        )

        if not isinstance(
            result,
            dict,
        ):
            raise HTTPException(
                status_code=500,
                detail=(
                    "A capacidade de análise de evidências "
                    "retornou um contrato inválido."
                ),
            )

        return ApiResponse.success(
            data={
                "module": "agenda",
                "contract_version": (
                    "evidence-completion-analysis-v1"
                ),
                "capability": (
                    _build_capability_metadata(
                        dispatch_result,
                    )
                ),
                "result": result,
            },
            message=(
                "Análise de conclusão das evidências "
                "processada com sucesso."
            ),
        )

    except HTTPException:
        raise

    except CapabilityError as exc:
        _raise_capability_http_error(
            exc,
        )

    except Exception as exc:
        print(
            "[EVIDENCE_COMPLETION_ANALYSIS_ERROR]",
            {
                "error_type": (
                    type(
                        exc,
                    ).__name__
                ),
                "message": str(
                    exc,
                ),
            },
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Não foi possível processar a análise "
                "de conclusão das evidências."
            ),
        ) from exc