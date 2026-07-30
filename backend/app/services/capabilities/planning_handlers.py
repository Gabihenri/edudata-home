from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.services.capabilities.agenda_capabilities import (
    AGENDA_DASHBOARD_INTELLIGENCE_ID,
    PLANNING_DAILY_PRIORITIES_ID,
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


MAXIMUM_DAILY_PRIORITIES = 5


def _as_record(
    value: Any,
) -> dict[str, Any]:
    if not isinstance(
        value,
        dict,
    ):
        return {}

    return value


def _as_record_list(
    value: Any,
) -> list[dict[str, Any]]:
    if not isinstance(
        value,
        list,
    ):
        return []

    return [
        item
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


def _normalize_priority_level(
    value: Any,
) -> str:
    normalized_value = (
        _optional_text(
            value,
        )
        or ""
    ).lower()

    if normalized_value in {
        "critical",
        "critico",
        "crítico",
        "urgent",
        "urgente",
        "high",
        "alta",
        "alto",
    }:
        return "high"

    if normalized_value in {
        "medium",
        "moderate",
        "media",
        "média",
        "medio",
        "médio",
    }:
        return "medium"

    return "low"


def _priority_weight(
    priority_level: str,
) -> int:
    weights = {
        "high": 300,
        "medium": 200,
        "low": 100,
    }

    return weights.get(
        priority_level,
        100,
    )


def _extract_title(
    record: dict[str, Any],
) -> str | None:
    candidate_fields = (
        "title",
        "name",
        "label",
        "headline",
        "action",
        "recommendation",
        "message",
        "summary",
        "description",
    )

    for field_name in candidate_fields:
        field_value = (
            _optional_text(
                record.get(
                    field_name,
                ),
            )
        )

        if field_value is not None:
            return field_value

    return None


def _extract_description(
    record: dict[str, Any],
) -> str | None:
    candidate_fields = (
        "description",
        "details",
        "reason",
        "rationale",
        "message",
        "summary",
        "recommendation",
    )

    for field_name in candidate_fields:
        field_value = (
            _optional_text(
                record.get(
                    field_name,
                ),
            )
        )

        if field_value is not None:
            return field_value

    return None


def _extract_priority_level(
    record: dict[str, Any],
) -> str:
    candidate_fields = (
        "priority",
        "priority_level",
        "severity",
        "risk_level",
        "urgency",
        "level",
        "status",
    )

    for field_name in candidate_fields:
        field_value = (
            record.get(
                field_name,
            )
        )

        if field_value is not None:
            return _normalize_priority_level(
                field_value,
            )

    return "low"


def _extract_score(
    record: dict[str, Any],
    priority_level: str,
) -> int:
    candidate_fields = (
        "score",
        "priority_score",
        "confidence",
        "impact",
        "weight",
    )

    for field_name in candidate_fields:
        field_value = (
            record.get(
                field_name,
            )
        )

        if isinstance(
            field_value,
            bool,
        ):
            continue

        if isinstance(
            field_value,
            (
                int,
                float,
            ),
        ):
            normalized_score = float(
                field_value,
            )

            if (
                field_name
                == "confidence"
                and normalized_score
                <= 1
            ):
                normalized_score *= 100

            return (
                _priority_weight(
                    priority_level,
                )
                + max(
                    min(
                        int(
                            normalized_score,
                        ),
                        100,
                    ),
                    0,
                )
            )

    return _priority_weight(
        priority_level,
    )


def _extract_reference(
    record: dict[str, Any],
) -> dict[str, str]:
    reference: dict[str, str] = {}

    candidate_fields = (
        "planning_id",
        "objective_id",
        "lesson_id",
        "evidence_id",
        "task_id",
        "class_id",
        "classroom_id",
        "recommendation_id",
    )

    for field_name in candidate_fields:
        field_value = (
            _optional_text(
                record.get(
                    field_name,
                ),
            )
        )

        if field_value is not None:
            reference[
                field_name
            ] = field_value

    return reference


def _build_priority(
    record: dict[str, Any],
    *,
    source: str,
    position: int,
) -> dict[str, Any] | None:
    title = _extract_title(
        record,
    )

    if title is None:
        return None

    description = (
        _extract_description(
            record,
        )
    )

    priority_level = (
        _extract_priority_level(
            record,
        )
    )

    score = _extract_score(
        record,
        priority_level,
    )

    category = (
        _optional_text(
            record.get(
                "category",
            ),
        )
        or _optional_text(
            record.get(
                "type",
            ),
        )
        or source
    )

    return {
        "priority_id": (
            _optional_text(
                record.get(
                    "id",
                ),
            )
            or (
                f"{source}-{position}"
            )
        ),
        "title": title,
        "description": (
            description
        ),
        "priority": (
            priority_level
        ),
        "score": score,
        "category": category,
        "source": source,
        "reference": (
            _extract_reference(
                record,
            )
        ),
    }


def _extract_collection(
    container: dict[str, Any],
    field_names: tuple[str, ...],
) -> list[dict[str, Any]]:
    for field_name in field_names:
        field_value = (
            container.get(
                field_name,
            )
        )

        records = (
            _as_record_list(
                field_value,
            )
        )

        if records:
            return records

        nested_record = (
            _as_record(
                field_value,
            )
        )

        if nested_record:
            for nested_field in (
                "items",
                "data",
                "results",
                "recommendations",
                "insights",
                "priorities",
            ):
                nested_records = (
                    _as_record_list(
                        nested_record.get(
                            nested_field,
                        ),
                    )
                )

                if nested_records:
                    return nested_records

    return []


def _collect_priority_candidates(
    dashboard_intelligence: dict[str, Any],
) -> list[dict[str, Any]]:
    engine_result = (
        _as_record(
            dashboard_intelligence.get(
                "engine",
            ),
        )
        or dashboard_intelligence
    )

    recommendations = (
        _as_record(
            engine_result.get(
                "recommendations",
            ),
        )
    )

    insights = (
        _as_record(
            engine_result.get(
                "insights",
            ),
        )
    )

    analytics = (
        _as_record(
            engine_result.get(
                "analytics",
            ),
        )
    )

    candidates: list[
        dict[str, Any]
    ] = []

    source_collections = (
        (
            "recommendations",
            _extract_collection(
                recommendations,
                (
                    "priorities",
                    "recommendations",
                    "items",
                    "actions",
                    "results",
                ),
            ),
        ),
        (
            "insights",
            _extract_collection(
                insights,
                (
                    "critical",
                    "alerts",
                    "priorities",
                    "insights",
                    "items",
                    "results",
                ),
            ),
        ),
        (
            "analytics",
            _extract_collection(
                analytics,
                (
                    "priorities",
                    "alerts",
                    "pending_actions",
                    "items",
                    "results",
                ),
            ),
        ),
    )

    for (
        source,
        records,
    ) in source_collections:
        for position, record in enumerate(
            records,
            start=1,
        ):
            priority = _build_priority(
                record,
                source=source,
                position=position,
            )

            if priority is not None:
                candidates.append(
                    priority,
                )

    return candidates


def _deduplicate_priorities(
    priorities: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    unique_priorities: list[
        dict[str, Any]
    ] = []

    known_keys: set[str] = set()

    for priority in priorities:
        title = (
            _optional_text(
                priority.get(
                    "title",
                ),
            )
            or ""
        )

        category = (
            _optional_text(
                priority.get(
                    "category",
                ),
            )
            or ""
        )

        deduplication_key = (
            f"{title.lower()}::{category.lower()}"
        )

        if deduplication_key in known_keys:
            continue

        known_keys.add(
            deduplication_key,
        )

        unique_priorities.append(
            priority,
        )

    return unique_priorities


def _sort_priorities(
    priorities: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    return sorted(
        priorities,
        key=lambda priority: (
            -_non_negative_integer(
                priority.get(
                    "score",
                ),
            ),
            str(
                priority.get(
                    "title",
                    "",
                ),
            ).lower(),
        ),
    )


def _build_summary(
    priorities: list[dict[str, Any]],
) -> dict[str, int]:
    high = sum(
        1
        for priority in priorities
        if priority.get(
            "priority",
        )
        == "high"
    )

    medium = sum(
        1
        for priority in priorities
        if priority.get(
            "priority",
        )
        == "medium"
    )

    low = sum(
        1
        for priority in priorities
        if priority.get(
            "priority",
        )
        == "low"
    )

    return {
        "total": len(
            priorities,
        ),
        "high": high,
        "medium": medium,
        "low": low,
    }


def execute_planning_daily_priorities(
    resolution: CapabilityResolution,
    payload: dict[str, Any],
) -> dict[str, Any]:
    """
    Handler oficial da capacidade:

    planning.daily_priorities

    O handler organiza prioridades a partir do resultado
    previamente produzido por agenda.dashboard_intelligence.

    Ele não:

    - acessa banco de dados;
    - chama diretamente o PipelineEngine;
    - altera planejamentos;
    - cria tarefas;
    - registra evidências;
    - executa recomendações;
    - utiliza IA generativa.
    """

    if (
        resolution.capability_id
        != PLANNING_DAILY_PRIORITIES_ID
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
                    PLANNING_DAILY_PRIORITIES_ID
                ),
            },
        )

    dashboard_intelligence = (
        _as_record(
            payload.get(
                "dashboard_intelligence",
            ),
        )
    )

    if not dashboard_intelligence:
        raise CapabilityValidationError(
            (
                "A capacidade de prioridades diárias exige "
                "o resultado de agenda.dashboard_intelligence."
            ),
            capability_id=(
                PLANNING_DAILY_PRIORITIES_ID
            ),
            details={
                "required_dependency": (
                    AGENDA_DASHBOARD_INTELLIGENCE_ID
                ),
            },
        )

    maximum_priorities = (
        _non_negative_integer(
            payload.get(
                "maximum_priorities",
            ),
            default=(
                MAXIMUM_DAILY_PRIORITIES
            ),
        )
    )

    if maximum_priorities <= 0:
        maximum_priorities = (
            MAXIMUM_DAILY_PRIORITIES
        )

    maximum_priorities = min(
        maximum_priorities,
        MAXIMUM_DAILY_PRIORITIES,
    )

    candidates = (
        _collect_priority_candidates(
            dashboard_intelligence,
        )
    )

    unique_priorities = (
        _deduplicate_priorities(
            candidates,
        )
    )

    sorted_priorities = (
        _sort_priorities(
            unique_priorities,
        )
    )

    selected_priorities = (
        sorted_priorities[
            :maximum_priorities
        ]
    )

    generated_at = (
        datetime.now(
            timezone.utc,
        ).isoformat()
    )

    return {
        "capability_id": (
            PLANNING_DAILY_PRIORITIES_ID
        ),
        "contract_version": (
            "planning-daily-priorities-v1"
        ),
        "generated_at": (
            generated_at
        ),
        "source_capability": (
            AGENDA_DASHBOARD_INTELLIGENCE_ID
        ),
        "maximum_priorities": (
            maximum_priorities
        ),
        "summary": (
            _build_summary(
                selected_priorities,
            )
        ),
        "priorities": (
            selected_priorities
        ),
        "metadata": {
            "deterministic": True,
            "generative_ai_used": False,
            "automatic_actions_executed": False,
            "professional_decision_required": True,
        },
    }


def register_planning_handlers(
    dispatcher: CapabilityDispatcher | None = None,
) -> tuple[str, ...]:
    """
    Registra os handlers oficiais de planejamento.

    O processo é idempotente e pode ser executado durante
    o bootstrap sem gerar duplicidade.
    """

    target_dispatcher = (
        dispatcher
        or capability_dispatcher
    )

    if not target_dispatcher.has_handler(
        PLANNING_DAILY_PRIORITIES_ID,
    ):
        target_dispatcher.register_handler(
            PLANNING_DAILY_PRIORITIES_ID,
            execute_planning_daily_priorities,
        )

    return (
        PLANNING_DAILY_PRIORITIES_ID,
    )