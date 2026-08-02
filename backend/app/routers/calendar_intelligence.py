from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from app.core.responses.api_response import ApiResponse
from app.services.capabilities.agenda_capabilities import (
    CALENDAR_WORKLOAD_BALANCE_ID,
    PLANNING_WEEKLY_ANALYSIS_ID,
    TASKS_SMART_PRIORITIZATION_ID,
)
from app.services.capabilities.dispatcher import (
    capability_dispatcher,
)
from app.services.capabilities.exceptions import (
    CapabilityError,
)


router = APIRouter(
    prefix="/api/v1/intelligence/calendar",
    tags=[
        "EDI Calendar Intelligence",
    ],
)


DEFAULT_ROLE = "professor"

MAXIMUM_EVENTS = 500
MAXIMUM_LESSONS = 500
MAXIMUM_TASKS = 500


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


def _normalize_period(
    payload: dict[str, Any],
) -> dict[str, Any]:
    period = _as_record(
        payload.get(
            "period",
        ),
    )

    if not period:
        return {}

    start = (
        _optional_text(
            period.get(
                "start",
            ),
        )
        or _optional_text(
            period.get(
                "start_date",
            ),
        )
    )

    end = (
        _optional_text(
            period.get(
                "end",
            ),
        )
        or _optional_text(
            period.get(
                "end_date",
            ),
        )
    )

    normalized_period: dict[str, Any] = {}

    if start is not None:
        normalized_period[
            "start"
        ] = start

    if end is not None:
        normalized_period[
            "end"
        ] = end

    return normalized_period


def _build_resolution_context(
) -> dict[str, bool]:
    return {
        "user_context": True,
        "agenda": True,
        "calendar": True,
        "planning": True,
        "lessons": True,
        "tasks": True,
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
        "[ECP_CALENDAR_WORKLOAD_ERROR]",
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
def calendar_intelligence_health(
) -> dict[str, Any]:
    """
    Verifica a disponibilidade da inteligência de calendário.

    Não executa capacidades, não acessa calendários externos
    e não altera eventos, aulas, tarefas ou prazos.
    """

    return ApiResponse.success(
        data={
            "service": (
                "edi-calendar-intelligence"
            ),
            "module": "agenda",
            "status": "available",
            "execution_layer": (
                "educational-capability-platform"
            ),
            "capability": (
                CALENDAR_WORKLOAD_BALANCE_ID
            ),
            "source_capabilities": [
                PLANNING_WEEKLY_ANALYSIS_ID,
                TASKS_SMART_PRIORITIZATION_ID,
            ],
            "database_accessed": False,
            "external_calendar_accessed": False,
            "automatic_rescheduling": False,
            "automatic_changes": False,
            "generative_ai_used": False,
        },
        message=(
            "Inteligência de calendário disponível."
        ),
    )


@router.post("/workload-balance")
def generate_calendar_workload_balance(
    payload: dict[str, Any],
) -> dict[str, Any]:
    """
    Executa calendar.workload_balance.

    A rota recebe:

    - eventos;
    - aulas;
    - tarefas;
    - análise semanal do planejamento;
    - priorização inteligente das tarefas;
    - período opcional;
    - data de referência opcional.

    A rota não acessa banco de dados, não consulta calendários
    externos e não realiza alterações automáticas.
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

        events = _as_record_list(
            normalized_payload.get(
                "events",
            ),
            field_name="events",
            maximum_records=(
                MAXIMUM_EVENTS
            ),
        )

        lessons = _as_record_list(
            normalized_payload.get(
                "lessons",
            ),
            field_name="lessons",
            maximum_records=(
                MAXIMUM_LESSONS
            ),
        )

        tasks = _as_record_list(
            normalized_payload.get(
                "tasks",
            ),
            field_name="tasks",
            maximum_records=(
                MAXIMUM_TASKS
            ),
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

        prioritized_tasks = (
            _require_record(
                normalized_payload,
                field_name=(
                    "prioritized_tasks"
                ),
                capability_id=(
                    TASKS_SMART_PRIORITIZATION_ID
                ),
            )
        )

        period = _normalize_period(
            normalized_payload,
        )

        reference_datetime = (
            _optional_text(
                normalized_payload.get(
                    "reference_datetime",
                ),
            )
        )

        role = _normalize_role(
            normalized_payload,
        )

        dispatch_payload: dict[
            str,
            Any,
        ] = {
            "events": events,
            "lessons": lessons,
            "tasks": tasks,
            "weekly_analysis": (
                weekly_analysis
            ),
            "prioritized_tasks": (
                prioritized_tasks
            ),
            "reference_datetime": (
                reference_datetime
            ),
        }

        if period:
            dispatch_payload[
                "period"
            ] = period

        dispatch_result = (
            capability_dispatcher.dispatch(
                CALENDAR_WORKLOAD_BALANCE_ID,
                payload=(
                    dispatch_payload
                ),
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
                        "calendar-intelligence-api"
                    ),
                    "contract_version": (
                        "calendar-workload-balance-v1"
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
                    "A capacidade de equilíbrio da carga "
                    "retornou um contrato inválido."
                ),
            )

        return ApiResponse.success(
            data={
                "module": "agenda",
                "contract_version": (
                    "calendar-workload-balance-v1"
                ),
                "capability": (
                    _build_capability_metadata(
                        dispatch_result,
                    )
                ),
                "result": result,
            },
            message=(
                "Análise de equilíbrio da carga semanal "
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
            "[CALENDAR_WORKLOAD_BALANCE_ERROR]",
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
                "de equilíbrio da carga semanal."
            ),
        ) from exc