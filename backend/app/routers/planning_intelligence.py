from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from app.core.responses.api_response import ApiResponse
from app.services.capabilities.agenda_capabilities import (
    AGENDA_DASHBOARD_INTELLIGENCE_ID,
    PLANNING_DAILY_PRIORITIES_ID,
    PLANNING_WEEKLY_ANALYSIS_ID,
)
from app.services.capabilities.dispatcher import (
    capability_dispatcher,
)
from app.services.capabilities.exceptions import (
    CapabilityError,
)


router = APIRouter(
    prefix="/api/v1/intelligence/planning",
    tags=[
        "EDI Planning Intelligence",
    ],
)


DEFAULT_ROLE = "professor"
DEFAULT_MAXIMUM_PRIORITIES = 5
MAXIMUM_ALLOWED_PRIORITIES = 5
MAXIMUM_HISTORY_RECORDS = 100


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


def _as_record_list(
    value: Any,
    *,
    field_name: str,
    maximum_records: int,
) -> list[dict[str, Any]]:
    if value is None:
        return []

    if not isinstance(
        value,
        list,
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                f"O campo '{field_name}' deve ser uma lista."
            ),
        )

    if len(
        value,
    ) > maximum_records:
        raise HTTPException(
            status_code=413,
            detail=(
                f"O campo '{field_name}' ultrapassou o limite "
                f"de {maximum_records} registros."
            ),
        )

    return [
        {
            **item,
        }
        for item in value
        if isinstance(
            item,
            dict,
        )
    ]


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


def _normalize_maximum_priorities(
    value: Any,
) -> int:
    if isinstance(
        value,
        bool,
    ):
        return DEFAULT_MAXIMUM_PRIORITIES

    if isinstance(
        value,
        int,
    ):
        normalized_value = value

    elif isinstance(
        value,
        float,
    ):
        normalized_value = int(
            value,
        )

    else:
        normalized_value = (
            DEFAULT_MAXIMUM_PRIORITIES
        )

    if normalized_value <= 0:
        return DEFAULT_MAXIMUM_PRIORITIES

    return min(
        normalized_value,
        MAXIMUM_ALLOWED_PRIORITIES,
    )


def _build_daily_resolution_context(
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
    }


def _build_weekly_resolution_context(
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
        "history": True,
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
    *,
    log_event: str,
) -> None:
    print(
        log_event,
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
def planning_intelligence_health(
) -> dict[str, Any]:
    """
    Verifica a disponibilidade do router de inteligência
    de planejamento.

    Não executa capacidades e não acessa dados operacionais.
    """

    return ApiResponse.success(
        data={
            "service": (
                "edi-planning-intelligence"
            ),
            "module": "agenda",
            "status": "available",
            "execution_layer": (
                "educational-capability-platform"
            ),
            "capabilities": [
                PLANNING_DAILY_PRIORITIES_ID,
                PLANNING_WEEKLY_ANALYSIS_ID,
            ],
            "source_capability": (
                AGENDA_DASHBOARD_INTELLIGENCE_ID
            ),
            "generative_ai_used": False,
        },
        message=(
            "Inteligência de planejamento disponível."
        ),
    )


@router.post("/daily-priorities")
def generate_daily_priorities(
    payload: dict[str, Any],
) -> dict[str, Any]:
    """
    Executa a capacidade planning.daily_priorities.

    O consumidor deve enviar em dashboard_intelligence
    o resultado previamente produzido por
    agenda.dashboard_intelligence.

    Esta rota não:

    - acessa o banco;
    - chama diretamente o PipelineEngine;
    - cria ou altera planejamentos;
    - altera tarefas;
    - executa ações automáticas;
    - utiliza IA generativa.
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
            _as_record(
                normalized_payload.get(
                    "dashboard_intelligence",
                ),
            )
        )

        if not dashboard_intelligence:
            raise HTTPException(
                status_code=400,
                detail=(
                    "O campo 'dashboard_intelligence' "
                    "é obrigatório."
                ),
            )

        role = _normalize_role(
            normalized_payload,
        )

        maximum_priorities = (
            _normalize_maximum_priorities(
                normalized_payload.get(
                    "maximum_priorities",
                ),
            )
        )

        dispatch_result = (
            capability_dispatcher.dispatch(
                PLANNING_DAILY_PRIORITIES_ID,
                payload={
                    "dashboard_intelligence": (
                        dashboard_intelligence
                    ),
                    "maximum_priorities": (
                        maximum_priorities
                    ),
                },
                role=role,
                context=(
                    _build_daily_resolution_context()
                ),
                confirmation_provided=False,
                allow_experimental=False,
                allow_beta=False,
                allow_deprecated=False,
                require_stable=True,
                metadata={
                    "source": (
                        "planning-intelligence-api"
                    ),
                    "contract_version": (
                        "planning-daily-priorities-v1"
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
                    "A capacidade de prioridades diárias "
                    "retornou um contrato inválido."
                ),
            )

        return ApiResponse.success(
            data={
                "module": "agenda",
                "contract_version": (
                    "planning-daily-priorities-v1"
                ),
                "capability": (
                    _build_capability_metadata(
                        dispatch_result,
                    )
                ),
                "result": result,
            },
            message=(
                "Prioridades diárias processadas "
                "com sucesso."
            ),
        )

    except HTTPException:
        raise

    except CapabilityError as exc:
        _raise_capability_http_error(
            exc,
            log_event=(
                "[ECP_DAILY_PRIORITIES_ERROR]"
            ),
        )

    except Exception as exc:
        print(
            "[PLANNING_DAILY_PRIORITIES_ERROR]",
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
                "Não foi possível processar "
                "as prioridades diárias."
            ),
        ) from exc


@router.post("/weekly-analysis")
def generate_weekly_analysis(
    payload: dict[str, Any],
) -> dict[str, Any]:
    """
    Executa a capacidade planning.weekly_planning_analysis.

    O consumidor deve enviar:

    - dashboard_intelligence;
    - daily_priorities;
    - history, quando disponível;
    - period, quando disponível.

    Esta rota não executa automaticamente as capacidades
    dependentes. Ela recebe os resultados previamente
    autorizados e processados pelo consumidor.
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
            _as_record(
                normalized_payload.get(
                    "dashboard_intelligence",
                ),
            )
        )

        daily_priorities = (
            _as_record(
                normalized_payload.get(
                    "daily_priorities",
                ),
            )
        )

        if not dashboard_intelligence:
            raise HTTPException(
                status_code=400,
                detail=(
                    "O campo 'dashboard_intelligence' "
                    "é obrigatório."
                ),
            )

        if not daily_priorities:
            raise HTTPException(
                status_code=400,
                detail=(
                    "O campo 'daily_priorities' "
                    "é obrigatório."
                ),
            )

        history = (
            _as_record_list(
                normalized_payload.get(
                    "history",
                ),
                field_name="history",
                maximum_records=(
                    MAXIMUM_HISTORY_RECORDS
                ),
            )
        )

        period = (
            _as_record(
                normalized_payload.get(
                    "period",
                ),
            )
        )

        role = _normalize_role(
            normalized_payload,
        )

        dispatch_result = (
            capability_dispatcher.dispatch(
                PLANNING_WEEKLY_ANALYSIS_ID,
                payload={
                    "dashboard_intelligence": (
                        dashboard_intelligence
                    ),
                    "daily_priorities": (
                        daily_priorities
                    ),
                    "history": history,
                    "period": period,
                },
                role=role,
                context=(
                    _build_weekly_resolution_context()
                ),
                confirmation_provided=False,
                allow_experimental=False,
                allow_beta=False,
                allow_deprecated=False,
                require_stable=True,
                metadata={
                    "source": (
                        "planning-intelligence-api"
                    ),
                    "contract_version": (
                        "planning-weekly-analysis-v1"
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
                    "A capacidade de análise semanal "
                    "retornou um contrato inválido."
                ),
            )

        return ApiResponse.success(
            data={
                "module": "agenda",
                "contract_version": (
                    "planning-weekly-analysis-v1"
                ),
                "capability": (
                    _build_capability_metadata(
                        dispatch_result,
                    )
                ),
                "result": result,
            },
            message=(
                "Análise semanal do planejamento "
                "processada com sucesso."
            ),
        )

    except HTTPException:
        raise

    except CapabilityError as exc:
        _raise_capability_http_error(
            exc,
            log_event=(
                "[ECP_WEEKLY_PLANNING_ERROR]"
            ),
        )

    except Exception as exc:
        print(
            "[PLANNING_WEEKLY_ANALYSIS_ERROR]",
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
                "Não foi possível processar "
                "a análise semanal do planejamento."
            ),
        ) from exc