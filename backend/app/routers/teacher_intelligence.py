from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

from app.core.responses.api_response import ApiResponse
from app.services.capabilities.agenda_capabilities import (
    AGENDA_DASHBOARD_INTELLIGENCE_ID,
    CALENDAR_WORKLOAD_BALANCE_ID,
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
from app.services.capabilities.teacher_capabilities import (
    TEACHER_PERFORMANCE_SNAPSHOT_ID,
)


router = APIRouter(
    prefix="/api/v1/intelligence/teacher",
    tags=[
        "EDI Teacher Intelligence",
    ],
)


DEFAULT_ROLE = "professor"
MAXIMUM_HISTORY_RECORDS = 20


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

    teacher_context = _as_record(
        payload.get(
            "teacher_context",
        ),
    )

    role = (
        _optional_text(
            context.get(
                "role",
            ),
        )
        or _optional_text(
            teacher_context.get(
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
    record = _as_record(
        payload.get(
            field_name,
        ),
    )

    if record:
        return record

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
        "calendar": True,
        "planning": True,
        "objectives": True,
        "lessons": True,
        "evidences": True,
        "tasks": True,
        "indicators": True,
        "recommendations": True,
        "analytics": True,
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
) -> None:
    print(
        "[ECP_TEACHER_SNAPSHOT_ERROR]",
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
def teacher_intelligence_health(
) -> dict[str, Any]:
    """
    Verifica a disponibilidade da inteligência docente.

    Não executa capacidades e não acessa dados operacionais.
    """

    return ApiResponse.success(
        data={
            "service": (
                "edi-teacher-intelligence"
            ),
            "module": "teacher",
            "status": "available",
            "execution_layer": (
                "educational-capability-platform"
            ),
            "capability": (
                TEACHER_PERFORMANCE_SNAPSHOT_ID
            ),
            "source_capabilities": [
                AGENDA_DASHBOARD_INTELLIGENCE_ID,
                PLANNING_DAILY_PRIORITIES_ID,
                PLANNING_WEEKLY_ANALYSIS_ID,
                EVIDENCE_COMPLETION_ANALYSIS_ID,
                TASKS_SMART_PRIORITIZATION_ID,
                CALENDAR_WORKLOAD_BALANCE_ID,
            ],
            "generative_ai_used": False,
        },
        message=(
            "Inteligência docente disponível."
        ),
    )


@router.post("/performance-snapshot")
def generate_teacher_performance_snapshot(
    payload: dict[str, Any],
) -> dict[str, Any]:
    """
    Executa teacher.performance_snapshot.

    A rota recebe resultados já produzidos pelas capacidades
    dependentes. Ela não executa automaticamente a cadeia
    anterior e não acessa banco ou Storage.
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

        workload_balance = (
            _require_record(
                normalized_payload,
                field_name=(
                    "workload_balance"
                ),
                capability_id=(
                    CALENDAR_WORKLOAD_BALANCE_ID
                ),
            )
        )

        teacher_context = _as_record(
            normalized_payload.get(
                "teacher_context",
            ),
        )

        history = _as_record_list(
            normalized_payload.get(
                "history",
            ),
            field_name="history",
            maximum_records=(
                MAXIMUM_HISTORY_RECORDS
            ),
        )

        role = _normalize_role(
            normalized_payload,
        )

        dispatch_result = (
            capability_dispatcher.dispatch(
                TEACHER_PERFORMANCE_SNAPSHOT_ID,
                payload={
                    "dashboard_intelligence": (
                        dashboard_intelligence
                    ),
                    "daily_priorities": (
                        daily_priorities
                    ),
                    "weekly_analysis": (
                        weekly_analysis
                    ),
                    "evidence_analysis": (
                        evidence_analysis
                    ),
                    "prioritized_tasks": (
                        prioritized_tasks
                    ),
                    "workload_balance": (
                        workload_balance
                    ),
                    "teacher_context": (
                        teacher_context
                    ),
                    "history": history,
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
                        "teacher-intelligence-api"
                    ),
                    "contract_version": (
                        "teacher-performance-snapshot-v1"
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
                    "A capacidade de snapshot docente "
                    "retornou um contrato inválido."
                ),
            )

        return ApiResponse.success(
            data={
                "module": "teacher",
                "contract_version": (
                    "teacher-performance-snapshot-v1"
                ),
                "capability": (
                    _build_capability_metadata(
                        dispatch_result,
                    )
                ),
                "result": result,
            },
            message=(
                "Snapshot de desempenho operacional docente "
                "processado com sucesso."
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
            "[TEACHER_PERFORMANCE_SNAPSHOT_ERROR]",
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
                "Não foi possível processar o snapshot "
                "de desempenho operacional docente."
            ),
        ) from exc