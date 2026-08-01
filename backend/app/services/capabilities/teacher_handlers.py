from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.services.capabilities.agenda_capabilities import (
    AGENDA_DASHBOARD_INTELLIGENCE_ID,
    CALENDAR_WORKLOAD_BALANCE_ID,
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
from app.services.capabilities.teacher_capabilities import (
    TEACHER_PERFORMANCE_SNAPSHOT_ID,
)


MAXIMUM_RISKS = 10
MAXIMUM_STRENGTHS = 10
MAXIMUM_RECOMMENDATIONS = 12
MAXIMUM_NEXT_ACTIONS = 10
MAXIMUM_HISTORY_ITEMS = 20


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


def _weighted_average(
    values: list[
        tuple[
            Any,
            float,
        ]
    ],
) -> float:
    weighted_total = 0.0
    total_weight = 0.0

    for value, weight in values:
        if weight <= 0:
            continue

        weighted_total += (
            _percentage(
                value,
            )
            * weight
        )

        total_weight += weight

    if total_weight <= 0:
        return 0.0

    return round(
        weighted_total
        / total_weight,
        2,
    )


def _status_from_score(
    score: float,
) -> str:
    if score >= 85:
        return "excellent"

    if score >= 70:
        return "stable"

    if score >= 55:
        return "attention"

    return "critical"


def _risk_severity_rank(
    severity: str,
) -> int:
    ranks = {
        "critical": 4,
        "high": 3,
        "medium": 2,
        "low": 1,
    }

    return ranks.get(
        severity,
        0,
    )


def _normalize_severity(
    value: Any,
) -> str:
    normalized_value = _normalized_text(
        value,
    )

    if normalized_value in {
        "critical",
        "critico",
        "crítico",
    }:
        return "critical"

    if normalized_value in {
        "high",
        "alta",
        "alto",
    }:
        return "high"

    if normalized_value in {
        "medium",
        "media",
        "média",
        "moderate",
        "attention",
    }:
        return "medium"

    return "low"


def _require_dependency(
    payload: dict[str, Any],
    *,
    field_name: str,
    capability_id: str,
) -> dict[str, Any]:
    dependency_result = _as_record(
        payload.get(
            field_name,
        ),
    )

    if dependency_result:
        return dependency_result

    raise CapabilityValidationError(
        (
            "O snapshot docente exige o resultado de "
            f"{capability_id}."
        ),
        capability_id=(
            TEACHER_PERFORMANCE_SNAPSHOT_ID
        ),
        details={
            "required_field": field_name,
            "required_dependency": (
                capability_id
            ),
        },
    )


def _extract_dashboard_score(
    dashboard_intelligence: dict[str, Any],
) -> float:
    engine = _as_record(
        dashboard_intelligence.get(
            "engine",
        ),
    )

    analytics = _as_record(
        engine.get(
            "analytics",
        ),
    )

    indicators = _as_record(
        analytics.get(
            "edi_indicators",
        ),
    )

    candidate_scores = [
        indicators.get(
            "planning_completion_rate",
        ),
        indicators.get(
            "lesson_completion_rate",
        ),
        indicators.get(
            "evidence_coverage_rate",
        ),
        indicators.get(
            "objective_coverage_rate",
        ),
    ]

    valid_scores = [
        _percentage(
            score,
        )
        for score in candidate_scores
        if score is not None
    ]

    if not valid_scores:
        summary = _as_record(
            dashboard_intelligence.get(
                "summary",
            ),
        )

        return _percentage(
            summary.get(
                "overall_score",
            ),
        )

    return round(
        sum(
            valid_scores,
        )
        / len(
            valid_scores,
        ),
        2,
    )


def _build_planning_section(
    weekly_analysis: dict[str, Any],
    daily_priorities: dict[str, Any],
) -> dict[str, Any]:
    weekly_summary = _as_record(
        weekly_analysis.get(
            "summary",
        ),
    )

    daily_summary = _as_record(
        daily_priorities.get(
            "summary",
        ),
    )

    priorities = _as_record_list(
        daily_priorities.get(
            "priorities",
        ),
    )

    score = _percentage(
        weekly_summary.get(
            "overall_score",
        ),
    )

    return {
        "score": score,
        "status": (
            _optional_text(
                weekly_summary.get(
                    "status",
                ),
            )
            or _status_from_score(
                score,
            )
        ),
        "attention_points": (
            _non_negative_integer(
                weekly_summary.get(
                    "attention_points",
                ),
            )
        ),
        "coverage": (
            weekly_summary.get(
                "coverage",
            )
        ),
        "coherence": (
            weekly_summary.get(
                "coherence",
            )
        ),
        "continuity": (
            weekly_summary.get(
                "continuity",
            )
        ),
        "daily_priorities": {
            "total": len(
                priorities,
            ),
            "high": (
                _non_negative_integer(
                    daily_summary.get(
                        "high",
                    ),
                )
            ),
            "medium": (
                _non_negative_integer(
                    daily_summary.get(
                        "medium",
                    ),
                )
            ),
            "low": (
                _non_negative_integer(
                    daily_summary.get(
                        "low",
                    ),
                )
            ),
            "items": priorities,
        },
    }


def _build_evidence_section(
    evidence_analysis: dict[str, Any],
) -> dict[str, Any]:
    summary = _as_record(
        evidence_analysis.get(
            "summary",
        ),
    )

    score = _percentage(
        summary.get(
            "overall_score",
        ),
    )

    return {
        "score": score,
        "status": (
            _optional_text(
                summary.get(
                    "status",
                ),
            )
            or _status_from_score(
                score,
            )
        ),
        "total_evidences": (
            _non_negative_integer(
                summary.get(
                    "total_evidences",
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
        "total_active_objectives": (
            _non_negative_integer(
                summary.get(
                    "total_active_objectives",
                ),
            )
        ),
        "total_pending": (
            _non_negative_integer(
                summary.get(
                    "total_pending",
                ),
            )
        ),
        "attention_items": (
            _as_record_list(
                evidence_analysis.get(
                    "attention_items",
                ),
            )
        ),
        "dimensions": (
            _as_record_list(
                evidence_analysis.get(
                    "dimensions",
                ),
            )
        ),
        "protection": (
            _as_record(
                evidence_analysis.get(
                    "protection",
                ),
            )
        ),
    }


def _build_tasks_section(
    prioritized_tasks: dict[str, Any],
) -> dict[str, Any]:
    summary = _as_record(
        prioritized_tasks.get(
            "summary",
        ),
    )

    tasks = _as_record_list(
        prioritized_tasks.get(
            "tasks",
        ),
    )

    critical = _non_negative_integer(
        summary.get(
            "critical",
        ),
    )

    high = _non_negative_integer(
        summary.get(
            "high",
        ),
    )

    overdue = _non_negative_integer(
        summary.get(
            "overdue",
        ),
    )

    penalty = min(
        (
            critical * 15
            + high * 8
            + overdue * 10
        ),
        100,
    )

    score = round(
        max(
            100
            - penalty,
            0,
        ),
        2,
    )

    return {
        "score": score,
        "status": (
            _status_from_score(
                score,
            )
        ),
        "total_received": (
            _non_negative_integer(
                summary.get(
                    "total_received",
                ),
            )
        ),
        "total_active": (
            _non_negative_integer(
                summary.get(
                    "total_active",
                ),
            )
        ),
        "total_prioritized": (
            _non_negative_integer(
                summary.get(
                    "total_prioritized",
                ),
            )
        ),
        "critical": critical,
        "high": high,
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
        "overdue": overdue,
        "without_deadline": (
            _non_negative_integer(
                summary.get(
                    "without_deadline",
                ),
            )
        ),
        "top_tasks": tasks[
            :5
        ],
    }


def _build_calendar_section(
    workload_balance: dict[str, Any],
) -> dict[str, Any]:
    summary = _as_record(
        workload_balance.get(
            "summary",
        ),
    )

    score = _percentage(
        summary.get(
            "balance_score",
        ),
    )

    return {
        "score": score,
        "status": (
            _optional_text(
                summary.get(
                    "status",
                ),
            )
            or _status_from_score(
                score,
            )
        ),
        "total_items": (
            _non_negative_integer(
                summary.get(
                    "total_items",
                ),
            )
        ),
        "total_events": (
            _non_negative_integer(
                summary.get(
                    "total_events",
                ),
            )
        ),
        "total_lessons": (
            _non_negative_integer(
                summary.get(
                    "total_lessons",
                ),
            )
        ),
        "total_tasks": (
            _non_negative_integer(
                summary.get(
                    "total_tasks",
                ),
            )
        ),
        "total_minutes": (
            _non_negative_integer(
                summary.get(
                    "total_minutes",
                ),
            )
        ),
        "critical_days": (
            _non_negative_integer(
                summary.get(
                    "critical_days",
                ),
            )
        ),
        "high_load_days": (
            _non_negative_integer(
                summary.get(
                    "high_load_days",
                ),
            )
        ),
        "balanced_days": (
            _non_negative_integer(
                summary.get(
                    "balanced_days",
                ),
            )
        ),
        "overlaps": (
            _non_negative_integer(
                summary.get(
                    "overlaps",
                ),
            )
        ),
        "short_intervals": (
            _non_negative_integer(
                summary.get(
                    "short_intervals",
                ),
            )
        ),
        "period": (
            _as_record(
                workload_balance.get(
                    "period",
                ),
            )
        ),
    }


def _build_risks(
    planning: dict[str, Any],
    evidences: dict[str, Any],
    tasks: dict[str, Any],
    calendar: dict[str, Any],
) -> list[dict[str, Any]]:
    risks: list[
        dict[str, Any]
    ] = []

    if _percentage(
        planning.get(
            "score",
        ),
    ) < 60:
        risks.append(
            {
                "code": (
                    "planning_consistency_risk"
                ),
                "severity": "high",
                "area": "planning",
                "description": (
                    "O planejamento semanal apresenta "
                    "consistência abaixo do nível esperado."
                ),
            },
        )

    if _non_negative_integer(
        evidences.get(
            "total_pending",
        ),
    ) > 0:
        pending = (
            _non_negative_integer(
                evidences.get(
                    "total_pending",
                ),
            )
        )

        risks.append(
            {
                "code": (
                    "evidence_backlog"
                ),
                "severity": (
                    "high"
                    if pending >= 5
                    else "medium"
                ),
                "area": "evidences",
                "description": (
                    f"Existem {pending} pendências "
                    "relacionadas às evidências."
                ),
            },
        )

    if _non_negative_integer(
        tasks.get(
            "overdue",
        ),
    ) > 0:
        overdue = (
            _non_negative_integer(
                tasks.get(
                    "overdue",
                ),
            )
        )

        risks.append(
            {
                "code": (
                    "overdue_tasks"
                ),
                "severity": (
                    "critical"
                    if overdue >= 5
                    else "high"
                ),
                "area": "tasks",
                "description": (
                    f"Existem {overdue} tarefas atrasadas."
                ),
            },
        )

    if _non_negative_integer(
        tasks.get(
            "critical",
        ),
    ) > 0:
        risks.append(
            {
                "code": (
                    "critical_task_concentration"
                ),
                "severity": "high",
                "area": "tasks",
                "description": (
                    "Existem tarefas classificadas como "
                    "críticas no ciclo atual."
                ),
            },
        )

    if _non_negative_integer(
        calendar.get(
            "critical_days",
        ),
    ) > 0:
        risks.append(
            {
                "code": (
                    "critical_workload_days"
                ),
                "severity": "high",
                "area": "calendar",
                "description": (
                    "A semana possui dias com carga "
                    "de trabalho crítica."
                ),
            },
        )

    if _non_negative_integer(
        calendar.get(
            "overlaps",
        ),
    ) > 0:
        risks.append(
            {
                "code": (
                    "calendar_overlaps"
                ),
                "severity": "medium",
                "area": "calendar",
                "description": (
                    "Foram identificadas atividades "
                    "com sobreposição de horários."
                ),
            },
        )

    return sorted(
        risks,
        key=lambda risk: (
            -_risk_severity_rank(
                _normalize_severity(
                    risk.get(
                        "severity",
                    ),
                )
            ),
            str(
                risk.get(
                    "area",
                    "",
                ),
            ),
        ),
    )[
        :MAXIMUM_RISKS
    ]


def _build_strengths(
    planning: dict[str, Any],
    evidences: dict[str, Any],
    tasks: dict[str, Any],
    calendar: dict[str, Any],
) -> list[dict[str, Any]]:
    strengths: list[
        dict[str, Any]
    ] = []

    sections = (
        (
            "planning",
            "Planejamento",
            planning,
        ),
        (
            "evidences",
            "Evidências",
            evidences,
        ),
        (
            "tasks",
            "Tarefas",
            tasks,
        ),
        (
            "calendar",
            "Carga semanal",
            calendar,
        ),
    )

    for (
        area,
        label,
        section,
    ) in sections:
        score = _percentage(
            section.get(
                "score",
            ),
        )

        if score < 80:
            continue

        strengths.append(
            {
                "code": (
                    f"{area}_positive_performance"
                ),
                "area": area,
                "score": score,
                "description": (
                    f"{label} apresenta resultado "
                    "operacional consistente."
                ),
            },
        )

    if (
        _non_negative_integer(
            tasks.get(
                "overdue",
            ),
        )
        == 0
    ):
        strengths.append(
            {
                "code": (
                    "no_overdue_tasks"
                ),
                "area": "tasks",
                "score": 100,
                "description": (
                    "Não existem tarefas atrasadas "
                    "entre as tarefas priorizadas."
                ),
            },
        )

    if (
        _non_negative_integer(
            calendar.get(
                "overlaps",
            ),
        )
        == 0
    ):
        strengths.append(
            {
                "code": (
                    "no_calendar_overlaps"
                ),
                "area": "calendar",
                "score": 100,
                "description": (
                    "Não foram identificadas "
                    "sobreposições de horário."
                ),
            },
        )

    return strengths[
        :MAXIMUM_STRENGTHS
    ]


def _build_recommendations(
    evidence_analysis: dict[str, Any],
    workload_balance: dict[str, Any],
    risks: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    recommendations: list[
        dict[str, Any]
    ] = []

    evidence_recommendations = (
        _as_record_list(
            evidence_analysis.get(
                "recommendations",
            ),
        )
    )

    calendar_recommendations = (
        _as_record_list(
            workload_balance.get(
                "recommendations",
            ),
        )
    )

    for recommendation in (
        evidence_recommendations
        + calendar_recommendations
    ):
        code = (
            _optional_text(
                recommendation.get(
                    "code",
                ),
            )
            or "operational_recommendation"
        )

        if any(
            existing.get(
                "code",
            )
            == code
            for existing in recommendations
        ):
            continue

        recommendations.append(
            {
                "code": code,
                "priority": (
                    _normalize_severity(
                        recommendation.get(
                            "priority",
                        ),
                    )
                ),
                "description": (
                    _optional_text(
                        recommendation.get(
                            "description",
                        ),
                    )
                    or "Revisar o ponto operacional indicado."
                ),
                "area": (
                    _optional_text(
                        recommendation.get(
                            "area",
                        ),
                    )
                ),
                "automatic_action": False,
                "professional_decision_required": True,
            },
        )

    for risk in risks:
        code = (
            f"review_{risk.get('code')}"
        )

        if any(
            recommendation.get(
                "code",
            )
            == code
            for recommendation
            in recommendations
        ):
            continue

        recommendations.append(
            {
                "code": code,
                "priority": (
                    _normalize_severity(
                        risk.get(
                            "severity",
                        ),
                    )
                ),
                "description": (
                    _optional_text(
                        risk.get(
                            "description",
                        ),
                    )
                    or "Revisar o risco operacional identificado."
                ),
                "area": (
                    _optional_text(
                        risk.get(
                            "area",
                        ),
                    )
                ),
                "automatic_action": False,
                "professional_decision_required": True,
            },
        )

    if not recommendations:
        recommendations.append(
            {
                "code": (
                    "maintain_operational_cycle"
                ),
                "priority": "low",
                "description": (
                    "Manter o acompanhamento do ciclo "
                    "operacional e revisar os indicadores "
                    "no próximo período."
                ),
                "area": "general",
                "automatic_action": False,
                "professional_decision_required": True,
            },
        )

    return recommendations[
        :MAXIMUM_RECOMMENDATIONS
    ]


def _build_next_actions(
    daily_priorities: dict[str, Any],
    prioritized_tasks: dict[str, Any],
    recommendations: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    next_actions: list[
        dict[str, Any]
    ] = []

    priorities = _as_record_list(
        daily_priorities.get(
            "priorities",
        ),
    )

    tasks = _as_record_list(
        prioritized_tasks.get(
            "tasks",
        ),
    )

    for priority in priorities:
        title = (
            _optional_text(
                priority.get(
                    "title",
                ),
            )
            or _optional_text(
                priority.get(
                    "description",
                ),
            )
        )

        if title is None:
            continue

        next_actions.append(
            {
                "type": "priority",
                "reference_id": (
                    _optional_text(
                        priority.get(
                            "id",
                        ),
                    )
                ),
                "title": title,
                "priority": (
                    _normalize_severity(
                        priority.get(
                            "priority",
                        ),
                    )
                ),
                "automatic_action": False,
            },
        )

        if len(
            next_actions,
        ) >= MAXIMUM_NEXT_ACTIONS:
            return next_actions

    for task in tasks:
        title = _optional_text(
            task.get(
                "title",
            ),
        )

        if title is None:
            continue

        next_actions.append(
            {
                "type": "task",
                "reference_id": (
                    _optional_text(
                        task.get(
                            "task_id",
                        ),
                    )
                ),
                "title": title,
                "priority": (
                    _normalize_severity(
                        task.get(
                            "priority_band",
                        ),
                    )
                ),
                "automatic_action": False,
            },
        )

        if len(
            next_actions,
        ) >= MAXIMUM_NEXT_ACTIONS:
            return next_actions

    for recommendation in recommendations:
        description = _optional_text(
            recommendation.get(
                "description",
            ),
        )

        if description is None:
            continue

        next_actions.append(
            {
                "type": (
                    "recommendation"
                ),
                "reference_id": (
                    _optional_text(
                        recommendation.get(
                            "code",
                        ),
                    )
                ),
                "title": description,
                "priority": (
                    _normalize_severity(
                        recommendation.get(
                            "priority",
                        ),
                    )
                ),
                "automatic_action": False,
            },
        )

        if len(
            next_actions,
        ) >= MAXIMUM_NEXT_ACTIONS:
            break

    return next_actions


def _build_history_summary(
    value: Any,
) -> dict[str, Any]:
    history = _as_record_list(
        value,
    )[
        :MAXIMUM_HISTORY_ITEMS
    ]

    if not history:
        return {
            "available": False,
            "total_records": 0,
            "latest": None,
            "trend": "insufficient_data",
            "records": [],
        }

    scores: list[float] = []

    for record in history:
        summary = _as_record(
            record.get(
                "summary",
            ),
        )

        score = (
            record.get(
                "overall_score",
            )
            if record.get(
                "overall_score",
            )
            is not None
            else summary.get(
                "overall_score",
            )
        )

        scores.append(
            _percentage(
                score,
            ),
        )

    trend = "stable"

    if len(
        scores,
    ) >= 2:
        difference = (
            scores[-1]
            - scores[0]
        )

        if difference >= 5:
            trend = "improving"

        elif difference <= -5:
            trend = "declining"

    return {
        "available": True,
        "total_records": len(
            history,
        ),
        "latest": history[-1],
        "trend": trend,
        "first_score": scores[0],
        "latest_score": scores[-1],
        "records": history,
    }


def execute_teacher_performance_snapshot(
    resolution: CapabilityResolution,
    payload: dict[str, Any],
) -> dict[str, Any]:
    """
    Handler oficial da capacidade
    teacher.performance_snapshot.

    Consolida resultados já processados pelo EIOS sem executar
    novamente as capacidades dependentes.
    """

    if (
        resolution.capability_id
        != TEACHER_PERFORMANCE_SNAPSHOT_ID
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
                    TEACHER_PERFORMANCE_SNAPSHOT_ID
                ),
            },
        )

    dashboard_intelligence = (
        _require_dependency(
            payload,
            field_name=(
                "dashboard_intelligence"
            ),
            capability_id=(
                AGENDA_DASHBOARD_INTELLIGENCE_ID
            ),
        )
    )

    daily_priorities = (
        _require_dependency(
            payload,
            field_name=(
                "daily_priorities"
            ),
            capability_id=(
                PLANNING_DAILY_PRIORITIES_ID
            ),
        )
    )

    weekly_analysis = (
        _require_dependency(
            payload,
            field_name=(
                "weekly_analysis"
            ),
            capability_id=(
                PLANNING_WEEKLY_ANALYSIS_ID
            ),
        )
    )

    evidence_analysis = (
        _require_dependency(
            payload,
            field_name=(
                "evidence_analysis"
            ),
            capability_id=(
                EVIDENCE_COMPLETION_ANALYSIS_ID
            ),
        )
    )

    prioritized_tasks = (
        _require_dependency(
            payload,
            field_name=(
                "prioritized_tasks"
            ),
            capability_id=(
                TASKS_SMART_PRIORITIZATION_ID
            ),
        )
    )

    workload_balance = (
        _require_dependency(
            payload,
            field_name=(
                "workload_balance"
            ),
            capability_id=(
                CALENDAR_WORKLOAD_BALANCE_ID
            ),
        )
    )

    teacher_context = _as_record(
        payload.get(
            "teacher_context",
        ),
    )

    planning = (
        _build_planning_section(
            weekly_analysis,
            daily_priorities,
        )
    )

    evidences = (
        _build_evidence_section(
            evidence_analysis,
        )
    )

    tasks = (
        _build_tasks_section(
            prioritized_tasks,
        )
    )

    calendar = (
        _build_calendar_section(
            workload_balance,
        )
    )

    dashboard_score = (
        _extract_dashboard_score(
            dashboard_intelligence,
        )
    )

    overall_score = (
        _weighted_average(
            [
                (
                    dashboard_score,
                    0.15,
                ),
                (
                    planning.get(
                        "score",
                    ),
                    0.25,
                ),
                (
                    evidences.get(
                        "score",
                    ),
                    0.25,
                ),
                (
                    tasks.get(
                        "score",
                    ),
                    0.15,
                ),
                (
                    calendar.get(
                        "score",
                    ),
                    0.20,
                ),
            ],
        )
    )

    operational_status = (
        _status_from_score(
            overall_score,
        )
    )

    risks = _build_risks(
        planning,
        evidences,
        tasks,
        calendar,
    )

    strengths = _build_strengths(
        planning,
        evidences,
        tasks,
        calendar,
    )

    recommendations = (
        _build_recommendations(
            evidence_analysis,
            workload_balance,
            risks,
        )
    )

    next_actions = (
        _build_next_actions(
            daily_priorities,
            prioritized_tasks,
            recommendations,
        )
    )

    history = _build_history_summary(
        payload.get(
            "history",
        ),
    )

    return {
        "capability_id": (
            TEACHER_PERFORMANCE_SNAPSHOT_ID
        ),
        "contract_version": (
            "teacher-performance-snapshot-v1"
        ),
        "generated_at": (
            datetime.now(
                timezone.utc,
            ).isoformat()
        ),
        "teacher": {
            "user_id": (
                _optional_text(
                    teacher_context.get(
                        "user_id",
                    ),
                )
            ),
            "name": (
                _optional_text(
                    teacher_context.get(
                        "name",
                    ),
                )
            ),
            "role": (
                _optional_text(
                    teacher_context.get(
                        "role",
                    ),
                )
                or "professor"
            ),
            "school_id": (
                _optional_text(
                    teacher_context.get(
                        "school_id",
                    ),
                )
            ),
            "organization_id": (
                _optional_text(
                    teacher_context.get(
                        "organization_id",
                    ),
                )
            ),
        },
        "summary": {
            "overall_score": (
                overall_score
            ),
            "operational_status": (
                operational_status
            ),
            "dashboard_score": (
                dashboard_score
            ),
            "risk_count": len(
                risks,
            ),
            "strength_count": len(
                strengths,
            ),
            "recommendation_count": (
                len(
                    recommendations,
                )
            ),
            "next_action_count": (
                len(
                    next_actions,
                )
            ),
        },
        "scores": {
            "overall": overall_score,
            "dashboard": (
                dashboard_score
            ),
            "planning": (
                planning.get(
                    "score",
                )
            ),
            "evidences": (
                evidences.get(
                    "score",
                )
            ),
            "tasks": (
                tasks.get(
                    "score",
                )
            ),
            "calendar": (
                calendar.get(
                    "score",
                )
            ),
        },
        "planning": planning,
        "evidences": evidences,
        "tasks": tasks,
        "calendar": calendar,
        "risks": risks,
        "strengths": strengths,
        "priorities": (
            _as_record_list(
                daily_priorities.get(
                    "priorities",
                ),
            )
        ),
        "recommendations": (
            recommendations
        ),
        "next_actions": (
            next_actions
        ),
        "history": history,
        "source_capabilities": [
            AGENDA_DASHBOARD_INTELLIGENCE_ID,
            PLANNING_DAILY_PRIORITIES_ID,
            PLANNING_WEEKLY_ANALYSIS_ID,
            EVIDENCE_COMPLETION_ANALYSIS_ID,
            TASKS_SMART_PRIORITIZATION_ID,
            CALENDAR_WORKLOAD_BALANCE_ID,
        ],
        "metadata": {
            "deterministic": True,
            "generative_ai_used": False,
            "dependent_capabilities_executed": False,
            "automatic_changes_executed": False,
            "database_accessed": False,
            "storage_accessed": False,
            "student_assessment_performed": False,
            "professional_classification_performed": False,
            "professional_decision_required": True,
            "score_weights": {
                "dashboard": 0.15,
                "planning": 0.25,
                "evidences": 0.25,
                "tasks": 0.15,
                "calendar": 0.20,
            },
            "consumer_products": [
                "agenda-inteligente-edi",
                "professor-digital",
                "edudata-analytics",
                "sgpa",
                "backoffice",
            ],
        },
    }


def register_teacher_handlers(
    dispatcher: CapabilityDispatcher | None = None,
) -> tuple[str, ...]:
    """
    Registra os handlers oficiais de inteligência docente.

    O processo é idempotente e seguro para o Bootstrap.
    """

    target_dispatcher = (
        dispatcher
        or capability_dispatcher
    )

    if not target_dispatcher.has_handler(
        TEACHER_PERFORMANCE_SNAPSHOT_ID,
    ):
        target_dispatcher.register_handler(
            TEACHER_PERFORMANCE_SNAPSHOT_ID,
            execute_teacher_performance_snapshot,
        )

    return (
        TEACHER_PERFORMANCE_SNAPSHOT_ID,
    )