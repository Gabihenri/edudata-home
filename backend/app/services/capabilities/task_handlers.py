from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.services.capabilities.agenda_capabilities import (
    EVIDENCE_COMPLETION_ANALYSIS_ID,
    PLANNING_DAILY_PRIORITIES_ID,
    PLANNING_WEEKLY_ANALYSIS_ID,
    TASKS_SMART_PRIORITIZATION_ID,
)
from app.services.capabilities.dispatcher import (
    CapabilityDispatcher,
    capability_dispatcher,
)
from app.services.capabilities.exceptions import (
    CapabilityValidationError,
)
from app.services.capabilities.resolver import (
    CapabilityResolution,
)


MAXIMUM_PRIORITIZED_TASKS = 20

COMPLETED_STATUSES = {
    "concluida",
    "concluída",
    "concluido",
    "concluído",
    "finalizada",
    "finalizado",
    "realizada",
    "realizado",
    "done",
    "completed",
}

CANCELLED_STATUSES = {
    "cancelada",
    "cancelado",
    "arquivada",
    "arquivado",
    "cancelled",
    "canceled",
}

HIGH_PRIORITIES = {
    "alta",
    "alto",
    "urgente",
    "critica",
    "crítica",
    "critico",
    "crítico",
    "high",
    "urgent",
    "critical",
}

MEDIUM_PRIORITIES = {
    "media",
    "média",
    "medio",
    "médio",
    "moderada",
    "moderado",
    "medium",
    "moderate",
}


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
) -> list[dict[str, Any]]:
    if not isinstance(
        value,
        list,
    ):
        return []

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


def _normalized_text(
    value: Any,
) -> str:
    return (
        _optional_text(
            value,
        )
        or ""
    ).lower()


def _non_negative_integer(
    value: Any,
    *,
    default: int = 0,
) -> int:
    if isinstance(
        value,
        bool,
    ):
        return default

    if isinstance(
        value,
        int,
    ):
        return max(
            value,
            0,
        )

    if isinstance(
        value,
        float,
    ):
        return max(
            int(
                value,
            ),
            0,
        )

    return default


def _parse_datetime(
    value: Any,
) -> datetime | None:
    normalized_value = _optional_text(
        value,
    )

    if normalized_value is None:
        return None

    try:
        parsed_value = datetime.fromisoformat(
            normalized_value.replace(
                "Z",
                "+00:00",
            ),
        )

    except ValueError:
        return None

    if parsed_value.tzinfo is None:
        return parsed_value.replace(
            tzinfo=timezone.utc,
        )

    return parsed_value.astimezone(
        timezone.utc,
    )


def _normalize_reference_datetime(
    value: Any,
) -> datetime:
    parsed_value = _parse_datetime(
        value,
    )

    if parsed_value is not None:
        return parsed_value

    return datetime.now(
        timezone.utc,
    )


def _priority_level(
    value: Any,
) -> str:
    normalized_value = _normalized_text(
        value,
    )

    if normalized_value in HIGH_PRIORITIES:
        return "high"

    if normalized_value in MEDIUM_PRIORITIES:
        return "medium"

    return "low"


def _declared_priority_score(
    value: Any,
) -> int:
    priority_level = _priority_level(
        value,
    )

    scores = {
        "high": 30,
        "medium": 20,
        "low": 10,
    }

    return scores[
        priority_level
    ]


def _deadline_analysis(
    due_date: Any,
    *,
    reference_datetime: datetime,
) -> dict[str, Any]:
    parsed_due_date = _parse_datetime(
        due_date,
    )

    if parsed_due_date is None:
        return {
            "due_date": None,
            "days_remaining": None,
            "deadline_status": (
                "without_deadline"
            ),
            "deadline_score": 5,
            "overdue": False,
        }

    difference = (
        parsed_due_date.date()
        - reference_datetime.date()
    ).days

    if difference < 0:
        deadline_status = "overdue"
        deadline_score = 40

    elif difference == 0:
        deadline_status = "due_today"
        deadline_score = 35

    elif difference <= 2:
        deadline_status = "due_soon"
        deadline_score = 30

    elif difference <= 7:
        deadline_status = "due_this_week"
        deadline_score = 20

    else:
        deadline_status = "scheduled"
        deadline_score = 10

    return {
        "due_date": (
            parsed_due_date.isoformat()
        ),
        "days_remaining": difference,
        "deadline_status": (
            deadline_status
        ),
        "deadline_score": (
            deadline_score
        ),
        "overdue": (
            difference < 0
        ),
    }


def _is_completed(
    task: dict[str, Any],
) -> bool:
    return (
        _normalized_text(
            task.get(
                "status",
            ),
        )
        in COMPLETED_STATUSES
    )


def _is_cancelled(
    task: dict[str, Any],
) -> bool:
    return (
        _normalized_text(
            task.get(
                "status",
            ),
        )
        in CANCELLED_STATUSES
    )


def _dependency_status(
    task: dict[str, Any],
) -> dict[str, Any]:
    event_id = _optional_text(
        task.get(
            "event_id",
        ),
    )

    school_id = _optional_text(
        task.get(
            "school_id",
        ),
    )

    dependency_score = 0
    references: list[
        dict[str, str]
    ] = []

    if event_id is not None:
        dependency_score += 8
        references.append(
            {
                "type": "event",
                "id": event_id,
            },
        )

    if school_id is not None:
        dependency_score += 2
        references.append(
            {
                "type": "school",
                "id": school_id,
            },
        )

    return {
        "score": (
            dependency_score
        ),
        "has_event_dependency": (
            event_id is not None
        ),
        "has_school_context": (
            school_id is not None
        ),
        "references": references,
    }


def _daily_priority_context(
    daily_priorities: dict[str, Any],
) -> dict[str, Any]:
    summary = _as_record(
        daily_priorities.get(
            "summary",
        ),
    )

    priorities = _as_record_list(
        daily_priorities.get(
            "priorities",
        ),
    )

    return {
        "high": (
            _non_negative_integer(
                summary.get(
                    "high",
                ),
            )
        ),
        "medium": (
            _non_negative_integer(
                summary.get(
                    "medium",
                ),
            )
        ),
        "low": (
            _non_negative_integer(
                summary.get(
                    "low",
                ),
            )
        ),
        "titles": [
            title
            for priority in priorities
            if (
                title
                := _optional_text(
                    priority.get(
                        "title",
                    ),
                )
            )
        ],
    }


def _weekly_context(
    weekly_analysis: dict[str, Any],
) -> dict[str, Any]:
    summary = _as_record(
        weekly_analysis.get(
            "summary",
        ),
    )

    return {
        "status": (
            _optional_text(
                summary.get(
                    "status",
                ),
            )
        ),
        "overall_score": (
            summary.get(
                "overall_score",
            )
        ),
        "attention_points": (
            _non_negative_integer(
                summary.get(
                    "attention_points",
                ),
            )
        ),
    }


def _evidence_context(
    evidence_analysis: dict[str, Any],
) -> dict[str, Any]:
    summary = _as_record(
        evidence_analysis.get(
            "summary",
        ),
    )

    return {
        "status": (
            _optional_text(
                summary.get(
                    "status",
                ),
            )
        ),
        "overall_score": (
            summary.get(
                "overall_score",
            )
        ),
        "total_pending": (
            _non_negative_integer(
                summary.get(
                    "total_pending",
                ),
            )
        ),
    }


def _pedagogical_context_score(
    *,
    daily_context: dict[str, Any],
    weekly_context: dict[str, Any],
    evidence_context: dict[str, Any],
) -> int:
    score = 0

    high_daily_priorities = (
        _non_negative_integer(
            daily_context.get(
                "high",
            ),
        )
    )

    score += min(
        high_daily_priorities * 3,
        9,
    )

    weekly_status = _normalized_text(
        weekly_context.get(
            "status",
        ),
    )

    if weekly_status == "critical":
        score += 10

    elif weekly_status == "attention":
        score += 6

    evidence_status = _normalized_text(
        evidence_context.get(
            "status",
        ),
    )

    if evidence_status == "critical":
        score += 10

    elif evidence_status == "attention":
        score += 6

    evidence_pending = (
        _non_negative_integer(
            evidence_context.get(
                "total_pending",
            ),
        )
    )

    score += min(
        evidence_pending,
        10,
    )

    return min(
        score,
        30,
    )


def _build_reasons(
    *,
    task: dict[str, Any],
    deadline: dict[str, Any],
    dependency: dict[str, Any],
    pedagogical_score: int,
) -> list[str]:
    reasons: list[str] = []

    deadline_status = (
        deadline.get(
            "deadline_status",
        )
    )

    deadline_messages = {
        "overdue": (
            "A tarefa está atrasada."
        ),
        "due_today": (
            "O prazo da tarefa termina hoje."
        ),
        "due_soon": (
            "O prazo da tarefa está próximo."
        ),
        "due_this_week": (
            "A tarefa vence nesta semana."
        ),
        "without_deadline": (
            "A tarefa ainda não possui prazo definido."
        ),
    }

    if deadline_status in deadline_messages:
        reasons.append(
            deadline_messages[
                deadline_status
            ],
        )

    priority_level = _priority_level(
        task.get(
            "priority",
        ),
    )

    if priority_level == "high":
        reasons.append(
            "A tarefa possui prioridade declarada alta.",
        )

    elif priority_level == "medium":
        reasons.append(
            "A tarefa possui prioridade declarada média.",
        )

    if dependency.get(
        "has_event_dependency",
    ):
        reasons.append(
            "A tarefa está vinculada a um evento da Agenda.",
        )

    if pedagogical_score >= 20:
        reasons.append(
            "O contexto pedagógico atual exige atenção elevada.",
        )

    elif pedagogical_score >= 10:
        reasons.append(
            "O contexto pedagógico atual exige acompanhamento.",
        )

    return reasons


def _priority_band(
    score: int,
) -> str:
    if score >= 80:
        return "critical"

    if score >= 60:
        return "high"

    if score >= 40:
        return "medium"

    return "low"


def _build_prioritized_task(
    task: dict[str, Any],
    *,
    reference_datetime: datetime,
    daily_context: dict[str, Any],
    weekly_context: dict[str, Any],
    evidence_context: dict[str, Any],
) -> dict[str, Any] | None:
    task_id = _optional_text(
        task.get(
            "id",
        ),
    )

    title = _optional_text(
        task.get(
            "title",
        ),
    )

    if (
        task_id is None
        or title is None
    ):
        return None

    if (
        _is_completed(
            task,
        )
        or _is_cancelled(
            task,
        )
    ):
        return None

    deadline = _deadline_analysis(
        task.get(
            "due_date",
        ),
        reference_datetime=(
            reference_datetime
        ),
    )

    dependency = _dependency_status(
        task,
    )

    declared_priority_score = (
        _declared_priority_score(
            task.get(
                "priority",
            ),
        )
    )

    pedagogical_score = (
        _pedagogical_context_score(
            daily_context=(
                daily_context
            ),
            weekly_context=(
                weekly_context
            ),
            evidence_context=(
                evidence_context
            ),
        )
    )

    total_score = min(
        (
            _non_negative_integer(
                deadline.get(
                    "deadline_score",
                ),
            )
            + declared_priority_score
            + _non_negative_integer(
                dependency.get(
                    "score",
                ),
            )
            + pedagogical_score
        ),
        100,
    )

    return {
        "task_id": task_id,
        "title": title,
        "description": (
            _optional_text(
                task.get(
                    "description",
                ),
            )
        ),
        "status": (
            _optional_text(
                task.get(
                    "status",
                ),
            )
            or "pendente"
        ),
        "declared_priority": (
            _optional_text(
                task.get(
                    "priority",
                ),
            )
            or "media"
        ),
        "normalized_priority": (
            _priority_level(
                task.get(
                    "priority",
                ),
            )
        ),
        "priority_score": (
            total_score
        ),
        "priority_band": (
            _priority_band(
                total_score
            )
        ),
        "deadline": deadline,
        "dependencies": dependency,
        "pedagogical_context_score": (
            pedagogical_score
        ),
        "reasons": (
            _build_reasons(
                task=task,
                deadline=deadline,
                dependency=dependency,
                pedagogical_score=(
                    pedagogical_score
                ),
            )
        ),
        "references": {
            "event_id": (
                _optional_text(
                    task.get(
                        "event_id",
                    ),
                )
            ),
            "school_id": (
                _optional_text(
                    task.get(
                        "school_id",
                    ),
                )
            ),
        },
        "created_at": (
            _optional_text(
                task.get(
                    "created_at",
                ),
            )
        ),
        "updated_at": (
            _optional_text(
                task.get(
                    "updated_at",
                ),
            )
        ),
    }


def _sort_tasks(
    tasks: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    return sorted(
        tasks,
        key=lambda task: (
            -_non_negative_integer(
                task.get(
                    "priority_score",
                ),
            ),
            (
                task.get(
                    "deadline",
                    {},
                ).get(
                    "due_date",
                )
                or "9999-12-31"
            ),
            str(
                task.get(
                    "title",
                    "",
                ),
            ).lower(),
        ),
    )


def _build_summary(
    tasks: list[dict[str, Any]],
    *,
    total_received: int,
    total_active: int,
) -> dict[str, int]:
    return {
        "total_received": (
            total_received
        ),
        "total_active": (
            total_active
        ),
        "total_prioritized": len(
            tasks,
        ),
        "critical": sum(
            1
            for task in tasks
            if task.get(
                "priority_band",
            )
            == "critical"
        ),
        "high": sum(
            1
            for task in tasks
            if task.get(
                "priority_band",
            )
            == "high"
        ),
        "medium": sum(
            1
            for task in tasks
            if task.get(
                "priority_band",
            )
            == "medium"
        ),
        "low": sum(
            1
            for task in tasks
            if task.get(
                "priority_band",
            )
            == "low"
        ),
        "overdue": sum(
            1
            for task in tasks
            if _as_record(
                task.get(
                    "deadline",
                ),
            ).get(
                "overdue",
            )
            is True
        ),
        "without_deadline": sum(
            1
            for task in tasks
            if _as_record(
                task.get(
                    "deadline",
                ),
            ).get(
                "deadline_status",
            )
            == "without_deadline"
        ),
    }


def execute_tasks_smart_prioritization(
    resolution: CapabilityResolution,
    payload: dict[str, Any],
) -> dict[str, Any]:
    """
    Handler oficial da capacidade tasks.smart_prioritization.

    Organiza tarefas autorizadas do usuário sem alterar
    registros ou acessar diretamente banco de dados.
    """

    if (
        resolution.capability_id
        != TASKS_SMART_PRIORITIZATION_ID
    ):
        raise CapabilityValidationError(
            (
                "O handler recebeu uma resolução "
                "de capacidade incompatível."
            ),
            capability_id=(
                resolution.capability_id
            ),
            details={
                "expected_capability_id": (
                    TASKS_SMART_PRIORITIZATION_ID
                ),
            },
        )

    tasks = _as_record_list(
        payload.get(
            "tasks",
        ),
    )

    daily_priorities = _as_record(
        payload.get(
            "daily_priorities",
        ),
    )

    weekly_analysis = _as_record(
        payload.get(
            "weekly_analysis",
        ),
    )

    evidence_analysis = _as_record(
        payload.get(
            "evidence_analysis",
        ),
    )

    if not daily_priorities:
        raise CapabilityValidationError(
            (
                "A priorização de tarefas exige o resultado de "
                "planning.daily_priorities."
            ),
            capability_id=(
                TASKS_SMART_PRIORITIZATION_ID
            ),
            details={
                "required_dependency": (
                    PLANNING_DAILY_PRIORITIES_ID
                ),
            },
        )

    if not weekly_analysis:
        raise CapabilityValidationError(
            (
                "A priorização de tarefas exige o resultado de "
                "planning.weekly_planning_analysis."
            ),
            capability_id=(
                TASKS_SMART_PRIORITIZATION_ID
            ),
            details={
                "required_dependency": (
                    PLANNING_WEEKLY_ANALYSIS_ID
                ),
            },
        )

    if not evidence_analysis:
        raise CapabilityValidationError(
            (
                "A priorização de tarefas exige o resultado de "
                "evidence.completion_analysis."
            ),
            capability_id=(
                TASKS_SMART_PRIORITIZATION_ID
            ),
            details={
                "required_dependency": (
                    EVIDENCE_COMPLETION_ANALYSIS_ID
                ),
            },
        )

    maximum_tasks = (
        _non_negative_integer(
            payload.get(
                "maximum_tasks",
            ),
            default=(
                MAXIMUM_PRIORITIZED_TASKS
            ),
        )
    )

    if maximum_tasks <= 0:
        maximum_tasks = (
            MAXIMUM_PRIORITIZED_TASKS
        )

    maximum_tasks = min(
        maximum_tasks,
        MAXIMUM_PRIORITIZED_TASKS,
    )

    reference_datetime = (
        _normalize_reference_datetime(
            payload.get(
                "reference_datetime",
            ),
        )
    )

    daily_context = (
        _daily_priority_context(
            daily_priorities,
        )
    )

    weekly_context = (
        _weekly_context(
            weekly_analysis,
        )
    )

    evidence_context = (
        _evidence_context(
            evidence_analysis,
        )
    )

    active_tasks = [
        task
        for task in tasks
        if not _is_completed(
            task,
        )
        and not _is_cancelled(
            task,
        )
    ]

    prioritized_tasks: list[
        dict[str, Any]
    ] = []

    for task in active_tasks:
        prioritized_task = (
            _build_prioritized_task(
                task,
                reference_datetime=(
                    reference_datetime
                ),
                daily_context=(
                    daily_context
                ),
                weekly_context=(
                    weekly_context
                ),
                evidence_context=(
                    evidence_context
                ),
            )
        )

        if prioritized_task is not None:
            prioritized_tasks.append(
                prioritized_task,
            )

    selected_tasks = (
        _sort_tasks(
            prioritized_tasks,
        )[
            :maximum_tasks
        ]
    )

    return {
        "capability_id": (
            TASKS_SMART_PRIORITIZATION_ID
        ),
        "contract_version": (
            "tasks-smart-prioritization-v1"
        ),
        "generated_at": (
            datetime.now(
                timezone.utc,
            ).isoformat()
        ),
        "reference_datetime": (
            reference_datetime.isoformat()
        ),
        "source_capabilities": [
            PLANNING_DAILY_PRIORITIES_ID,
            PLANNING_WEEKLY_ANALYSIS_ID,
            EVIDENCE_COMPLETION_ANALYSIS_ID,
        ],
        "summary": (
            _build_summary(
                selected_tasks,
                total_received=len(
                    tasks,
                ),
                total_active=len(
                    active_tasks,
                ),
            )
        ),
        "tasks": (
            selected_tasks
        ),
        "context": {
            "daily_priorities": (
                daily_context
            ),
            "weekly_analysis": (
                weekly_context
            ),
            "evidence_analysis": (
                evidence_context
            ),
        },
        "metadata": {
            "deterministic": True,
            "generative_ai_used": False,
            "automatic_changes_executed": False,
            "automatic_completion_executed": False,
            "automatic_notifications_sent": False,
            "database_accessed": False,
            "professional_decision_required": True,
            "maximum_prioritized_tasks": (
                maximum_tasks
            ),
            "real_task_fields_used": [
                "id",
                "title",
                "description",
                "status",
                "priority",
                "due_date",
                "event_id",
                "school_id",
                "created_at",
                "updated_at",
            ],
        },
    }


def register_task_handlers(
    dispatcher: CapabilityDispatcher | None = None,
) -> tuple[str, ...]:
    """
    Registra os handlers oficiais de inteligência
    de tarefas.

    O processo é idempotente e seguro para o Bootstrap.
    """

    target_dispatcher = (
        dispatcher
        or capability_dispatcher
    )

    if not target_dispatcher.has_handler(
        TASKS_SMART_PRIORITIZATION_ID,
    ):
        target_dispatcher.register_handler(
            TASKS_SMART_PRIORITIZATION_ID,
            execute_tasks_smart_prioritization,
        )

    return (
        TASKS_SMART_PRIORITIZATION_ID,
    )