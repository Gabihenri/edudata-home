from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from app.core.responses.api_response import ApiResponse
from app.services.capabilities.agenda_capabilities import (
    EVIDENCE_COMPLETION_ANALYSIS_ID,
    PLANNING_DAILY_PRIORITIES_ID,
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
    prefix="/api/v1/intelligence/tasks",
    tags=[
        "EDI Task Intelligence",
    ],
)


DEFAULT_ROLE = "professor"
MAXIMUM_TASKS = 500
MAXIMUM_PRIORITIZED_TASKS = 20


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


def _normalize_maximum_tasks(
    value: Any,
) -> int:
    if isinstance(
        value,
        bool,
    ):
        return MAXIMUM_PRIORITIZED_TASKS

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
            MAXIMUM_PRIORITIZED_TASKS
        )

    if normalized_value <= 0:
        return MAXIMUM_PRIORITIZED_TASKS

    return min(
        normalized_value,
        MAXIMUM_PRIORITIZED_TASKS,
    )


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
        "tasks": True,
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
        "[ECP_TASK_SMART_PRIORITIZATION_ERROR]",
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
def task_intelligence_health(
) -> dict[str, Any]:
    return ApiResponse.success(
        data={
            "service": (
                "edi-task-intelligence"
            ),
            "module": "agenda",
            "status": "available",
            "execution_layer": (
                "educational-capability-platform"
            ),
            "capability": (
                TASKS_SMART_PRIORITIZATION_ID
            ),
            "source_capabilities": [
                PLANNING_DAILY_PRIORITIES_ID,
                PLANNING_WEEKLY_ANALYSIS_ID,
                EVIDENCE_COMPLETION_ANALYSIS_ID,
            ],
            "database_accessed": False,
            "automatic_changes": False,
            "automatic_completion": False,
            "automatic_notifications": False,
            "generative_ai_used": False,
        },
        message=(
            "Inteligência de tarefas disponível."
        ),
    )


@router.post("/smart-prioritization")
def generate_task_smart_prioritization(
    payload: dict[str, Any],
) -> dict[str, Any]:
    try:
        normalized_payload = (
            payload
            if isinstance(
                payload,
                dict,
            )
            else {}
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

        daily_priorities = (
            _require_record(
                normalized_payload,
                field_name=(
                    "daily_priorities"
                ),
                capability_id=(
                    PLANNING_DAILY_PRIORITIES_ID
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

        evidence_analysis = (
            _require_record(
                normalized_payload,
                field_name=(
                    "evidence_analysis"
                ),
                capability_id=(
                    EVIDENCE_COMPLETION_ANALYSIS_ID
                ),
            )
        )

        reference_datetime = (
            _optional_text(
                normalized_payload.get(
                    "reference_datetime",
                ),
            )
        )

        maximum_tasks = (
            _normalize_maximum_tasks(
                normalized_payload.get(
                    "maximum_tasks",
                ),
            )
        )

        role = _normalize_role(
            normalized_payload,
        )

        dispatch_result = (
            capability_dispatcher.dispatch(
                TASKS_SMART_PRIORITIZATION_ID,
                payload={
                    "tasks": tasks,
                    "daily_priorities": (
                        daily_priorities
                    ),
                    "weekly_analysis": (
                        weekly_analysis
                    ),
                    "evidence_analysis": (
                        evidence_analysis
                    ),
                    "reference_datetime": (
                        reference_datetime
                    ),
                    "maximum_tasks": (
                        maximum_tasks
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
                        "task-intelligence-api"
                    ),
                    "contract_version": (
                        "tasks-smart-prioritization-v1"
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
                    "A capacidade de priorização de tarefas "
                    "retornou um contrato inválido."
                ),
            )

        return ApiResponse.success(
            data={
                "module": "agenda",
                "contract_version": (
                    "tasks-smart-prioritization-v1"
                ),
                "capability": (
                    _build_capability_metadata(
                        dispatch_result,
                    )
                ),
                "result": result,
            },
            message=(
                "Priorização inteligente de tarefas "
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
            "[TASK_SMART_PRIORITIZATION_ERROR]",
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
                "Não foi possível processar a priorização "
                "inteligente das tarefas."
            ),
        ) from exc