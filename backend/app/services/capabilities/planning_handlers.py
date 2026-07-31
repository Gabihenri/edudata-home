from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.services.capabilities.agenda_capabilities import (
    AGENDA_DASHBOARD_INTELLIGENCE_ID,
    PLANNING_DAILY_PRIORITIES_ID,
    PLANNING_WEEKLY_ANALYSIS_ID,
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
WEEKLY_ADEQUATE_SCORE = 80.0
WEEKLY_ATTENTION_SCORE = 60.0


def _as_record(
    value: Any,
) -> dict[str, Any]:
    return (
        value
        if isinstance(
            value,
            dict,
        )
        else {}
    )


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


def _number(
    value: Any,
    *,
    default: float = 0.0,
) -> float:
    if isinstance(
        value,
        bool,
    ):
        return default

    if isinstance(
        value,
        (
            int,
            float,
        ),
    ):
        return float(
            value,
        )

    if isinstance(
        value,
        str,
    ):
        normalized_value = (
            value
            .strip()
            .replace(
                ",",
                ".",
            )
        )

        try:
            return float(
                normalized_value,
            )

        except ValueError:
            return default

    return default


def _percentage(
    value: Any,
) -> float:
    return round(
        min(
            max(
                _number(
                    value,
                ),
                0.0,
            ),
            100.0,
        ),
        2,
    )


def _average_percentages(
    values: list[Any],
) -> float:
    normalized_values = [
        _percentage(
            value,
        )
        for value in values
    ]

    if not normalized_values:
        return 0.0

    return round(
        (
            sum(
                normalized_values,
            )
            / len(
                normalized_values,
            )
        ),
        2,
    )


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


def _extract_first_text(
    record: dict[str, Any],
    field_names: tuple[str, ...],
) -> str | None:
    for field_name in field_names:
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


def _extract_title(
    record: dict[str, Any],
) -> str | None:
    return _extract_first_text(
        record,
        (
            "title",
            "name",
            "label",
            "headline",
            "action",
            "recommendation",
            "message",
            "summary",
            "description",
        ),
    )


def _extract_description(
    record: dict[str, Any],
) -> str | None:
    return _extract_first_text(
        record,
        (
            "description",
            "details",
            "reason",
            "rationale",
            "message",
            "summary",
            "recommendation",
        ),
    )


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

    priority_level = (
        _extract_priority_level(
            record,
        )
    )

    return {
        "priority_id": (
            _optional_text(
                record.get(
                    "id",
                ),
            )
            or f"{source}-{position}"
        ),
        "title": title,
        "description": (
            _extract_description(
                record,
            )
        ),
        "priority": (
            priority_level
        ),
        "score": (
            _extract_score(
                record,
                priority_level,
            )
        ),
        "category": (
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
        ),
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


def _extract_engine_result(
    dashboard_intelligence: dict[str, Any],
) -> dict[str, Any]:
    return (
        _as_record(
            dashboard_intelligence.get(
                "engine",
            ),
        )
        or dashboard_intelligence
    )


def _collect_priority_candidates(
    dashboard_intelligence: dict[str, Any],
) -> list[dict[str, Any]]:
    engine_result = (
        _extract_engine_result(
            dashboard_intelligence,
        )
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

    for source, records in source_collections:
        for position, record in enumerate(
            records,
            start=1,
        ):
            priority = (
                _build_priority(
                    record,
                    source=source,
                    position=position,
                )
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


def _build_priority_summary(
    priorities: list[dict[str, Any]],
) -> dict[str, int]:
    return {
        "total": len(
            priorities,
        ),
        "high": sum(
            1
            for priority in priorities
            if priority.get(
                "priority",
            )
            == "high"
        ),
        "medium": sum(
            1
            for priority in priorities
            if priority.get(
                "priority",
            )
            == "medium"
        ),
        "low": sum(
            1
            for priority in priorities
            if priority.get(
                "priority",
            )
            == "low"
        ),
    }


def execute_planning_daily_priorities(
    resolution: CapabilityResolution,
    payload: dict[str, Any],
) -> dict[str, Any]:
    """
    Handler oficial da capacidade planning.daily_priorities.

    Organiza prioridades a partir do resultado previamente
    produzido por agenda.dashboard_intelligence.
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

    selected_priorities = (
        _sort_priorities(
            unique_priorities,
        )[
            :maximum_priorities
        ]
    )

    return {
        "capability_id": (
            PLANNING_DAILY_PRIORITIES_ID
        ),
        "contract_version": (
            "planning-daily-priorities-v1"
        ),
        "generated_at": (
            datetime.now(
                timezone.utc,
            ).isoformat()
        ),
        "source_capability": (
            AGENDA_DASHBOARD_INTELLIGENCE_ID
        ),
        "maximum_priorities": (
            maximum_priorities
        ),
        "summary": (
            _build_priority_summary(
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


def _analysis_status(
    score: float,
) -> str:
    if score >= WEEKLY_ADEQUATE_SCORE:
        return "adequate"

    if score >= WEEKLY_ATTENTION_SCORE:
        return "attention"

    return "critical"


def _history_operational_scores(
    history: list[dict[str, Any]],
) -> list[float]:
    scores: list[float] = []

    for item in history:
        analytics = (
            _as_record(
                item.get(
                    "analytics",
                ),
            )
        )

        engine = (
            _as_record(
                item.get(
                    "engine",
                ),
            )
        )

        engine_analytics = (
            _as_record(
                engine.get(
                    "analytics",
                ),
            )
        )

        candidates = (
            item,
            _as_record(
                item.get(
                    "edi_indicators",
                ),
            ),
            analytics,
            _as_record(
                analytics.get(
                    "edi_indicators",
                ),
            ),
            engine,
            engine_analytics,
            _as_record(
                engine_analytics.get(
                    "edi_indicators",
                ),
            ),
        )

        for candidate in candidates:
            if (
                "operational_score"
                in candidate
            ):
                scores.append(
                    _percentage(
                        candidate.get(
                            "operational_score",
                        ),
                    ),
                )

                break

    return scores


def _build_trend(
    current_score: float,
    history: list[dict[str, Any]],
) -> dict[str, Any]:
    historical_scores = (
        _history_operational_scores(
            history,
        )
    )

    if not historical_scores:
        return {
            "status": (
                "insufficient_history"
            ),
            "current_score": (
                current_score
            ),
            "previous_score": None,
            "delta": None,
            "samples": 0,
        }

    previous_score = (
        historical_scores[
            -1
        ]
    )

    delta = round(
        current_score
        - previous_score,
        2,
    )

    if delta > 2:
        status = "improving"

    elif delta < -2:
        status = "declining"

    else:
        status = "stable"

    return {
        "status": status,
        "current_score": (
            current_score
        ),
        "previous_score": (
            previous_score
        ),
        "delta": delta,
        "samples": len(
            historical_scores,
        ),
    }


def _build_dimension(
    *,
    dimension: str,
    label: str,
    score: float,
    indicators: dict[
        str,
        float | int,
    ],
    findings: dict[
        str,
        int,
    ],
) -> dict[str, Any]:
    normalized_score = (
        _percentage(
            score,
        )
    )

    return {
        "dimension": dimension,
        "label": label,
        "score": normalized_score,
        "status": (
            _analysis_status(
                normalized_score,
            )
        ),
        "indicators": indicators,
        "findings": findings,
    }


def _build_weekly_dimensions(
    analytics: dict[str, Any],
    daily_priorities: dict[str, Any],
) -> list[dict[str, Any]]:
    summary = (
        _as_record(
            analytics.get(
                "summary",
            ),
        )
    )

    indicators = (
        _as_record(
            analytics.get(
                "edi_indicators",
            ),
        )
    )

    findings = (
        _as_record(
            analytics.get(
                "operational_findings",
            ),
        )
    )

    priority_summary = (
        _as_record(
            daily_priorities.get(
                "summary",
            ),
        )
    )

    coverage_score = (
        _average_percentages(
            [
                indicators.get(
                    "planning_execution_rate",
                ),
                indicators.get(
                    "objective_coverage_rate",
                ),
            ],
        )
    )

    coherence_score = (
        _average_percentages(
            [
                indicators.get(
                    "evidence_objective_link_rate",
                ),
                indicators.get(
                    "evidence_lesson_link_rate",
                ),
            ],
        )
    )

    continuity_score = (
        _percentage(
            indicators.get(
                "execution_rate",
            ),
        )
    )

    evidence_alignment_score = (
        _percentage(
            indicators.get(
                "evidence_coverage_rate",
            ),
        )
    )

    pending_items = (
        _non_negative_integer(
            summary.get(
                "total_pending_items",
            ),
        )
    )

    high_priorities = (
        _non_negative_integer(
            priority_summary.get(
                "high",
            ),
        )
    )

    medium_priorities = (
        _non_negative_integer(
            priority_summary.get(
                "medium",
            ),
        )
    )

    low_priorities = (
        _non_negative_integer(
            priority_summary.get(
                "low",
            ),
        )
    )

    replanning_penalty = min(
        (
            pending_items
            * 5
        )
        + (
            high_priorities
            * 15
        )
        + (
            medium_priorities
            * 8
        )
        + (
            low_priorities
            * 3
        ),
        100,
    )

    replanning_score = round(
        100
        - replanning_penalty,
        2,
    )

    return [
        _build_dimension(
            dimension="coverage",
            label=(
                "Cobertura do planejamento"
            ),
            score=(
                coverage_score
            ),
            indicators={
                "planning_execution_rate": (
                    _percentage(
                        indicators.get(
                            "planning_execution_rate",
                        ),
                    )
                ),
                "objective_coverage_rate": (
                    _percentage(
                        indicators.get(
                            "objective_coverage_rate",
                        ),
                    )
                ),
            },
            findings={
                "planning_without_lessons": (
                    _non_negative_integer(
                        findings.get(
                            "planning_without_lessons",
                        ),
                    )
                ),
                "active_objectives_without_evidence": (
                    _non_negative_integer(
                        findings.get(
                            "active_objectives_without_evidence",
                        ),
                    )
                ),
            },
        ),
        _build_dimension(
            dimension="coherence",
            label=(
                "Coerência entre registros"
            ),
            score=(
                coherence_score
            ),
            indicators={
                "evidence_objective_link_rate": (
                    _percentage(
                        indicators.get(
                            "evidence_objective_link_rate",
                        ),
                    )
                ),
                "evidence_lesson_link_rate": (
                    _percentage(
                        indicators.get(
                            "evidence_lesson_link_rate",
                        ),
                    )
                ),
            },
            findings={
                "evidences_without_objective": (
                    _non_negative_integer(
                        findings.get(
                            "evidences_without_objective",
                        ),
                    )
                ),
                "evidences_without_lesson": (
                    _non_negative_integer(
                        findings.get(
                            "evidences_without_lesson",
                        ),
                    )
                ),
            },
        ),
        _build_dimension(
            dimension="continuity",
            label=(
                "Continuidade da execução"
            ),
            score=(
                continuity_score
            ),
            indicators={
                "execution_rate": (
                    continuity_score
                ),
                "total_active_lessons": (
                    _non_negative_integer(
                        summary.get(
                            "total_active_lessons",
                        ),
                    )
                ),
                "total_completed_lessons": (
                    _non_negative_integer(
                        summary.get(
                            "total_completed_lessons",
                        ),
                    )
                ),
            },
            findings={
                "total_cancelled_lessons": (
                    _non_negative_integer(
                        summary.get(
                            "total_cancelled_lessons",
                        ),
                    )
                ),
            },
        ),
        _build_dimension(
            dimension=(
                "evidence_alignment"
            ),
            label=(
                "Alinhamento das evidências"
            ),
            score=(
                evidence_alignment_score
            ),
            indicators={
                "evidence_coverage_rate": (
                    evidence_alignment_score
                ),
                "total_evidences": (
                    _non_negative_integer(
                        summary.get(
                            "total_evidences",
                        ),
                    )
                ),
            },
            findings={
                "completed_lessons_without_evidence": (
                    _non_negative_integer(
                        findings.get(
                            "completed_lessons_without_evidence",
                        ),
                    )
                ),
                "active_objectives_without_evidence": (
                    _non_negative_integer(
                        findings.get(
                            "active_objectives_without_evidence",
                        ),
                    )
                ),
            },
        ),
        _build_dimension(
            dimension="replanning",
            label=(
                "Necessidade de replanejamento"
            ),
            score=(
                replanning_score
            ),
            indicators={
                "total_pending_items": (
                    pending_items
                ),
                "high_priorities": (
                    high_priorities
                ),
                "medium_priorities": (
                    medium_priorities
                ),
                "low_priorities": (
                    low_priorities
                ),
            },
            findings={
                "replanning_penalty": (
                    replanning_penalty
                ),
            },
        ),
    ]


def _build_attention_points(
    analytics: dict[str, Any],
    daily_priorities: dict[str, Any],
) -> list[dict[str, Any]]:
    findings = (
        _as_record(
            analytics.get(
                "operational_findings",
            ),
        )
    )

    priority_summary = (
        _as_record(
            daily_priorities.get(
                "summary",
            ),
        )
    )

    attention_points: list[
        dict[str, Any]
    ] = []

    rules = (
        (
            "planning_without_lessons",
            "high",
            (
                "Planejamentos ainda não "
                "vinculados a aulas."
            ),
        ),
        (
            "completed_lessons_without_evidence",
            "high",
            (
                "Aulas realizadas ainda "
                "sem evidência vinculada."
            ),
        ),
        (
            "active_objectives_without_evidence",
            "medium",
            (
                "Objetivos ativos ainda "
                "sem evidência vinculada."
            ),
        ),
        (
            "evidences_without_objective",
            "medium",
            (
                "Evidências ainda sem "
                "objetivo vinculado."
            ),
        ),
        (
            "evidences_without_lesson",
            "medium",
            (
                "Evidências ainda sem "
                "aula vinculada."
            ),
        ),
    )

    for (
        finding_name,
        severity,
        message,
    ) in rules:
        total = (
            _non_negative_integer(
                findings.get(
                    finding_name,
                ),
            )
        )

        if total > 0:
            attention_points.append(
                {
                    "code": (
                        finding_name
                    ),
                    "severity": (
                        severity
                    ),
                    "message": (
                        message
                    ),
                    "total": (
                        total
                    ),
                },
            )

    high_priorities = (
        _non_negative_integer(
            priority_summary.get(
                "high",
            ),
        )
    )

    if high_priorities > 0:
        attention_points.append(
            {
                "code": (
                    "high_daily_priorities"
                ),
                "severity": "high",
                "message": (
                    "Existem prioridades diárias "
                    "de alta relevância."
                ),
                "total": (
                    high_priorities
                ),
            },
        )

    return attention_points


def _build_strengths(
    dimensions: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    strengths: list[
        dict[str, Any]
    ] = []

    for dimension in dimensions:
        score = (
            _percentage(
                dimension.get(
                    "score",
                ),
            )
        )

        if score >= WEEKLY_ADEQUATE_SCORE:
            strengths.append(
                {
                    "dimension": (
                        dimension.get(
                            "dimension",
                        )
                    ),
                    "label": (
                        dimension.get(
                            "label",
                        )
                    ),
                    "score": score,
                },
            )

    return strengths


def _build_replanning_opportunities(
    attention_points: list[dict[str, Any]],
    daily_priorities: dict[str, Any],
) -> list[dict[str, Any]]:
    opportunities: list[
        dict[str, Any]
    ] = []

    messages = {
        "planning_without_lessons": (
            "Revisar os planejamentos sem aulas "
            "e definir a próxima execução."
        ),
        "completed_lessons_without_evidence": (
            "Priorizar o registro de evidências "
            "das aulas já realizadas."
        ),
        "active_objectives_without_evidence": (
            "Revisar como os objetivos ativos "
            "serão evidenciados."
        ),
        "evidences_without_objective": (
            "Relacionar as evidências existentes "
            "aos objetivos correspondentes."
        ),
        "evidences_without_lesson": (
            "Relacionar as evidências existentes "
            "às aulas correspondentes."
        ),
        "high_daily_priorities": (
            "Reservar o primeiro bloco de trabalho "
            "para as prioridades de alta relevância."
        ),
    }

    for attention_point in attention_points:
        code = (
            _optional_text(
                attention_point.get(
                    "code",
                ),
            )
        )

        if (
            code is None
            or code not in messages
        ):
            continue

        opportunities.append(
            {
                "code": code,
                "priority": (
                    attention_point.get(
                        "severity",
                        "medium",
                    )
                ),
                "description": (
                    messages[
                        code
                    ]
                ),
                "automatic_action": False,
            },
        )

    if not opportunities:
        opportunities.append(
            {
                "code": (
                    "maintain_weekly_cycle"
                ),
                "priority": "low",
                "description": (
                    "Manter o acompanhamento do ciclo "
                    "semanal e revisar novas evidências "
                    "antes do próximo replanejamento."
                ),
                "automatic_action": False,
            },
        )

    daily_items = (
        _as_record_list(
            daily_priorities.get(
                "priorities",
            ),
        )
    )

    for priority in daily_items:
        if (
            len(
                opportunities,
            )
            >= MAXIMUM_DAILY_PRIORITIES
        ):
            break

        title = (
            _optional_text(
                priority.get(
                    "title",
                ),
            )
        )

        if title is None:
            continue

        opportunities.append(
            {
                "code": (
                    "daily_priority_reference"
                ),
                "priority": (
                    priority.get(
                        "priority",
                        "low",
                    )
                ),
                "description": title,
                "automatic_action": False,
                "reference": (
                    _as_record(
                        priority.get(
                            "reference",
                        ),
                    )
                ),
            },
        )

    return opportunities[
        :MAXIMUM_DAILY_PRIORITIES
    ]


def execute_planning_weekly_analysis(
    resolution: CapabilityResolution,
    payload: dict[str, Any],
) -> dict[str, Any]:
    """
    Handler oficial da capacidade
    planning.weekly_planning_analysis.

    Analisa cobertura, coerência, continuidade,
    alinhamento de evidências e necessidade de
    replanejamento a partir dos resultados das
    capacidades anteriores.
    """

    if (
        resolution.capability_id
        != PLANNING_WEEKLY_ANALYSIS_ID
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
                    PLANNING_WEEKLY_ANALYSIS_ID
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

    daily_priorities = (
        _as_record(
            payload.get(
                "daily_priorities",
            ),
        )
    )

    history = (
        _as_record_list(
            payload.get(
                "history",
            ),
        )
    )

    if not dashboard_intelligence:
        raise CapabilityValidationError(
            (
                "A análise semanal exige o resultado de "
                "agenda.dashboard_intelligence."
            ),
            capability_id=(
                PLANNING_WEEKLY_ANALYSIS_ID
            ),
            details={
                "required_dependency": (
                    AGENDA_DASHBOARD_INTELLIGENCE_ID
                ),
            },
        )

    if not daily_priorities:
        raise CapabilityValidationError(
            (
                "A análise semanal exige o resultado de "
                "planning.daily_priorities."
            ),
            capability_id=(
                PLANNING_WEEKLY_ANALYSIS_ID
            ),
            details={
                "required_dependency": (
                    PLANNING_DAILY_PRIORITIES_ID
                ),
            },
        )

    daily_capability_id = (
        _optional_text(
            daily_priorities.get(
                "capability_id",
            ),
        )
    )

    if (
        daily_capability_id is not None
        and daily_capability_id
        != PLANNING_DAILY_PRIORITIES_ID
    ):
        raise CapabilityValidationError(
            (
                "O resultado de prioridades "
                "diárias é incompatível."
            ),
            capability_id=(
                PLANNING_WEEKLY_ANALYSIS_ID
            ),
            details={
                "expected_dependency": (
                    PLANNING_DAILY_PRIORITIES_ID
                ),
                "received_dependency": (
                    daily_capability_id
                ),
            },
        )

    engine_result = (
        _extract_engine_result(
            dashboard_intelligence,
        )
    )

    analytics = (
        _as_record(
            engine_result.get(
                "analytics",
            ),
        )
    )

    if not analytics:
        raise CapabilityValidationError(
            (
                "O resultado do Dashboard não contém "
                "análise operacional válida."
            ),
            capability_id=(
                PLANNING_WEEKLY_ANALYSIS_ID
            ),
            details={
                "required_section": (
                    "analytics"
                ),
            },
        )

    dimensions = (
        _build_weekly_dimensions(
            analytics,
            daily_priorities,
        )
    )

    overall_score = (
        _average_percentages(
            [
                dimension.get(
                    "score",
                )
                for dimension in dimensions
            ],
        )
    )

    attention_points = (
        _build_attention_points(
            analytics,
            daily_priorities,
        )
    )

    strengths = (
        _build_strengths(
            dimensions,
        )
    )

    trend = (
        _build_trend(
            overall_score,
            history,
        )
    )

    replanning_opportunities = (
        _build_replanning_opportunities(
            attention_points,
            daily_priorities,
        )
    )

    analytics_summary = (
        _as_record(
            analytics.get(
                "summary",
            ),
        )
    )

    references = (
        _as_record(
            analytics.get(
                "references",
            ),
        )
    )

    period = (
        _as_record(
            payload.get(
                "period",
            ),
        )
    )

    return {
        "capability_id": (
            PLANNING_WEEKLY_ANALYSIS_ID
        ),
        "contract_version": (
            "planning-weekly-analysis-v1"
        ),
        "generated_at": (
            datetime.now(
                timezone.utc,
            ).isoformat()
        ),
        "source_capabilities": [
            AGENDA_DASHBOARD_INTELLIGENCE_ID,
            PLANNING_DAILY_PRIORITIES_ID,
        ],
        "period": {
            "start_date": (
                _optional_text(
                    period.get(
                        "start_date",
                    ),
                )
            ),
            "end_date": (
                _optional_text(
                    period.get(
                        "end_date",
                    ),
                )
            ),
            "timezone": (
                _optional_text(
                    period.get(
                        "timezone",
                    ),
                )
            ),
        },
        "summary": {
            "overall_score": (
                overall_score
            ),
            "status": (
                _analysis_status(
                    overall_score,
                )
            ),
            "dimensions": len(
                dimensions,
            ),
            "attention_points": len(
                attention_points,
            ),
            "strengths": len(
                strengths,
            ),
            "history_samples": len(
                history,
            ),
            "total_planning": (
                _non_negative_integer(
                    analytics_summary.get(
                        "total_planning",
                    ),
                )
            ),
            "total_objectives": (
                _non_negative_integer(
                    analytics_summary.get(
                        "total_objectives",
                    ),
                )
            ),
            "total_lessons": (
                _non_negative_integer(
                    analytics_summary.get(
                        "total_lessons",
                    ),
                )
            ),
            "total_evidences": (
                _non_negative_integer(
                    analytics_summary.get(
                        "total_evidences",
                    ),
                )
            ),
            "total_pending_items": (
                _non_negative_integer(
                    analytics_summary.get(
                        "total_pending_items",
                    ),
                )
            ),
        },
        "dimensions": (
            dimensions
        ),
        "trend": (
            trend
        ),
        "attention_points": (
            attention_points
        ),
        "strengths": (
            strengths
        ),
        "replanning_opportunities": (
            replanning_opportunities
        ),
        "daily_priorities": (
            _as_record_list(
                daily_priorities.get(
                    "priorities",
                ),
            )[
                :MAXIMUM_DAILY_PRIORITIES
            ]
        ),
        "references": (
            references
        ),
        "metadata": {
            "deterministic": True,
            "generative_ai_used": False,
            "automatic_changes_executed": False,
            "professional_decision_required": True,
            "analysis_dimensions": [
                "coverage",
                "coherence",
                "continuity",
                "evidence_alignment",
                "replanning",
            ],
        },
    }


def register_planning_handlers(
    dispatcher: CapabilityDispatcher | None = None,
) -> tuple[str, ...]:
    """
    Registra os handlers oficiais de planejamento.

    O processo é idempotente e pode ser executado
    durante o bootstrap sem gerar duplicidade.
    """

    target_dispatcher = (
        dispatcher
        or capability_dispatcher
    )

    handlers = (
        (
            PLANNING_DAILY_PRIORITIES_ID,
            execute_planning_daily_priorities,
        ),
        (
            PLANNING_WEEKLY_ANALYSIS_ID,
            execute_planning_weekly_analysis,
        ),
    )

    for (
        capability_id,
        handler,
    ) in handlers:
        if target_dispatcher.has_handler(
            capability_id,
        ):
            continue

        target_dispatcher.register_handler(
            capability_id,
            handler,
        )

    return tuple(
        capability_id
        for (
            capability_id,
            _handler,
        ) in handlers
    )