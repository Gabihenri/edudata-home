from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from app.services.capabilities.agenda_capabilities import (
    AGENDA_DASHBOARD_INTELLIGENCE_ID,
    EVIDENCE_COMPLETION_ANALYSIS_ID,
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


ADEQUATE_SCORE = 80.0
ATTENTION_SCORE = 60.0
MAXIMUM_ATTENTION_ITEMS = 20


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


def _as_identifier_list(
    value: Any,
) -> list[str]:
    if not isinstance(
        value,
        list,
    ):
        return []

    identifiers: list[str] = []

    for item in value:
        identifier = _optional_text(
            item,
        )

        if identifier is None:
            continue

        if identifier in identifiers:
            continue

        identifiers.append(
            identifier,
        )

    return identifiers


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


def _average(
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
        sum(
            normalized_values,
        )
        / len(
            normalized_values,
        ),
        2,
    )


def _analysis_status(
    score: float,
) -> str:
    if score >= ADEQUATE_SCORE:
        return "adequate"

    if score >= ATTENTION_SCORE:
        return "attention"

    return "critical"


def _extract_engine_result(
    dashboard_intelligence: dict[str, Any],
) -> dict[str, Any]:
    engine_result = _as_record(
        dashboard_intelligence.get(
            "engine",
        ),
    )

    if engine_result:
        return engine_result

    return dashboard_intelligence


def _extract_analytics(
    dashboard_intelligence: dict[str, Any],
) -> dict[str, Any]:
    engine_result = _extract_engine_result(
        dashboard_intelligence,
    )

    return _as_record(
        engine_result.get(
            "analytics",
        ),
    )


def _build_dimension(
    *,
    dimension: str,
    label: str,
    score: float,
    total: int,
    pending: int,
    completed: int,
) -> dict[str, Any]:
    normalized_score = _percentage(
        score,
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
        "total": (
            _non_negative_integer(
                total,
            )
        ),
        "completed": (
            _non_negative_integer(
                completed,
            )
        ),
        "pending": (
            _non_negative_integer(
                pending,
            )
        ),
    }


def _build_dimensions(
    analytics: dict[str, Any],
) -> list[dict[str, Any]]:
    summary = _as_record(
        analytics.get(
            "summary",
        ),
    )

    indicators = _as_record(
        analytics.get(
            "edi_indicators",
        ),
    )

    findings = _as_record(
        analytics.get(
            "operational_findings",
        ),
    )

    total_completed_lessons = (
        _non_negative_integer(
            summary.get(
                "total_completed_lessons",
            ),
        )
    )

    completed_lessons_with_evidence = (
        _non_negative_integer(
            findings.get(
                "completed_lessons_with_evidence",
            ),
        )
    )

    completed_lessons_without_evidence = (
        _non_negative_integer(
            findings.get(
                "completed_lessons_without_evidence",
            ),
        )
    )

    total_active_objectives = (
        _non_negative_integer(
            summary.get(
                "total_active_objectives",
            ),
        )
    )

    objectives_with_evidence = (
        _non_negative_integer(
            findings.get(
                "objectives_with_evidence",
            ),
        )
    )

    objectives_without_evidence = (
        _non_negative_integer(
            findings.get(
                "active_objectives_without_evidence",
            ),
        )
    )

    total_evidences = (
        _non_negative_integer(
            summary.get(
                "total_evidences",
            ),
        )
    )

    evidences_without_objective = (
        _non_negative_integer(
            findings.get(
                "evidences_without_objective",
            ),
        )
    )

    evidences_without_lesson = (
        _non_negative_integer(
            findings.get(
                "evidences_without_lesson",
            ),
        )
    )

    fully_linked_evidences = max(
        total_evidences
        - max(
            evidences_without_objective,
            evidences_without_lesson,
        ),
        0,
    )

    total_linkage_pending = (
        evidences_without_objective
        + evidences_without_lesson
    )

    backlog_total = (
        completed_lessons_without_evidence
        + objectives_without_evidence
        + evidences_without_objective
        + evidences_without_lesson
    )

    backlog_score = max(
        100.0
        - min(
            backlog_total * 10,
            100,
        ),
        0.0,
    )

    completion_score = _average(
        [
            indicators.get(
                "evidence_coverage_rate",
            ),
            indicators.get(
                "objective_coverage_rate",
            ),
            indicators.get(
                "evidence_objective_link_rate",
            ),
            indicators.get(
                "evidence_lesson_link_rate",
            ),
        ],
    )

    return [
        _build_dimension(
            dimension=(
                "lesson_coverage"
            ),
            label=(
                "Cobertura de evidências por aula"
            ),
            score=(
                _percentage(
                    indicators.get(
                        "evidence_coverage_rate",
                    ),
                )
            ),
            total=(
                total_completed_lessons
            ),
            completed=(
                completed_lessons_with_evidence
            ),
            pending=(
                completed_lessons_without_evidence
            ),
        ),
        _build_dimension(
            dimension=(
                "objective_coverage"
            ),
            label=(
                "Cobertura de evidências por objetivo"
            ),
            score=(
                _percentage(
                    indicators.get(
                        "objective_coverage_rate",
                    ),
                )
            ),
            total=(
                total_active_objectives
            ),
            completed=(
                objectives_with_evidence
            ),
            pending=(
                objectives_without_evidence
            ),
        ),
        _build_dimension(
            dimension=(
                "linkage_integrity"
            ),
            label=(
                "Integridade dos vínculos"
            ),
            score=(
                _average(
                    [
                        indicators.get(
                            "evidence_objective_link_rate",
                        ),
                        indicators.get(
                            "evidence_lesson_link_rate",
                        ),
                    ],
                )
            ),
            total=(
                total_evidences
            ),
            completed=(
                fully_linked_evidences
            ),
            pending=(
                total_linkage_pending
            ),
        ),
        _build_dimension(
            dimension=(
                "completion_status"
            ),
            label=(
                "Conclusão do ciclo de evidências"
            ),
            score=(
                completion_score
            ),
            total=(
                total_completed_lessons
                + total_active_objectives
                + total_evidences
            ),
            completed=(
                completed_lessons_with_evidence
                + objectives_with_evidence
                + fully_linked_evidences
            ),
            pending=(
                backlog_total
            ),
        ),
        _build_dimension(
            dimension=(
                "evidence_backlog"
            ),
            label=(
                "Controle do backlog de evidências"
            ),
            score=(
                backlog_score
            ),
            total=(
                backlog_total
            ),
            completed=0,
            pending=(
                backlog_total
            ),
        ),
    ]


def _build_attention_item(
    *,
    code: str,
    category: str,
    severity: str,
    message: str,
    total: int,
    identifiers: list[str],
) -> dict[str, Any]:
    return {
        "code": code,
        "category": category,
        "severity": severity,
        "message": message,
        "total": (
            _non_negative_integer(
                total,
            )
        ),
        "identifiers": (
            identifiers[
                :MAXIMUM_ATTENTION_ITEMS
            ]
        ),
        "automatic_action": False,
    }


def _build_attention_items(
    analytics: dict[str, Any],
) -> list[dict[str, Any]]:
    findings = _as_record(
        analytics.get(
            "operational_findings",
        ),
    )

    references = _as_record(
        analytics.get(
            "references",
        ),
    )

    attention_items: list[
        dict[str, Any]
    ] = []

    completed_lessons_without_evidence = (
        _non_negative_integer(
            findings.get(
                "completed_lessons_without_evidence",
            ),
        )
    )

    if completed_lessons_without_evidence > 0:
        attention_items.append(
            _build_attention_item(
                code=(
                    "completed_lessons_without_evidence"
                ),
                category="lesson",
                severity="high",
                message=(
                    "Existem aulas realizadas sem "
                    "evidência vinculada."
                ),
                total=(
                    completed_lessons_without_evidence
                ),
                identifiers=(
                    _as_identifier_list(
                        references.get(
                            "completed_lesson_ids_without_evidence",
                        ),
                    )
                ),
            ),
        )

    active_objectives_without_evidence = (
        _non_negative_integer(
            findings.get(
                "active_objectives_without_evidence",
            ),
        )
    )

    if active_objectives_without_evidence > 0:
        attention_items.append(
            _build_attention_item(
                code=(
                    "active_objectives_without_evidence"
                ),
                category="objective",
                severity="high",
                message=(
                    "Existem objetivos ativos sem "
                    "evidência vinculada."
                ),
                total=(
                    active_objectives_without_evidence
                ),
                identifiers=(
                    _as_identifier_list(
                        references.get(
                            "objective_ids_without_evidence",
                        ),
                    )
                ),
            ),
        )

    evidences_without_objective = (
        _non_negative_integer(
            findings.get(
                "evidences_without_objective",
            ),
        )
    )

    if evidences_without_objective > 0:
        attention_items.append(
            _build_attention_item(
                code=(
                    "evidences_without_objective"
                ),
                category="linkage",
                severity="medium",
                message=(
                    "Existem evidências sem vínculo "
                    "com objetivo pedagógico."
                ),
                total=(
                    evidences_without_objective
                ),
                identifiers=(
                    _as_identifier_list(
                        references.get(
                            "evidence_ids_without_objective",
                        ),
                    )
                ),
            ),
        )

    evidences_without_lesson = (
        _non_negative_integer(
            findings.get(
                "evidences_without_lesson",
            ),
        )
    )

    if evidences_without_lesson > 0:
        attention_items.append(
            _build_attention_item(
                code=(
                    "evidences_without_lesson"
                ),
                category="linkage",
                severity="medium",
                message=(
                    "Existem evidências sem vínculo "
                    "com aula."
                ),
                total=(
                    evidences_without_lesson
                ),
                identifiers=(
                    _as_identifier_list(
                        references.get(
                            "evidence_ids_without_lesson",
                        ),
                    )
                ),
            ),
        )

    return attention_items


def _build_recommendations(
    attention_items: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    recommendation_messages = {
        (
            "completed_lessons_without_evidence"
        ): (
            "Revisar as aulas realizadas e registrar "
            "as evidências pedagógicas correspondentes."
        ),
        (
            "active_objectives_without_evidence"
        ): (
            "Definir ou relacionar evidências que "
            "comprovem o acompanhamento dos objetivos ativos."
        ),
        (
            "evidences_without_objective"
        ): (
            "Relacionar cada evidência ao objetivo "
            "pedagógico correspondente."
        ),
        (
            "evidences_without_lesson"
        ): (
            "Relacionar cada evidência à aula "
            "em que foi produzida ou utilizada."
        ),
    }

    recommendations: list[
        dict[str, Any]
    ] = []

    for attention_item in attention_items:
        code = _optional_text(
            attention_item.get(
                "code",
            ),
        )

        if (
            code is None
            or code not in recommendation_messages
        ):
            continue

        recommendations.append(
            {
                "code": code,
                "priority": (
                    attention_item.get(
                        "severity",
                        "medium",
                    )
                ),
                "description": (
                    recommendation_messages[
                        code
                    ]
                ),
                "total_affected": (
                    _non_negative_integer(
                        attention_item.get(
                            "total",
                        ),
                    )
                ),
                "identifiers": (
                    _as_identifier_list(
                        attention_item.get(
                            "identifiers",
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
                    "maintain_evidence_cycle"
                ),
                "priority": "low",
                "description": (
                    "Manter o acompanhamento das evidências "
                    "e revisar os vínculos antes do fechamento "
                    "do próximo ciclo pedagógico."
                ),
                "total_affected": 0,
                "identifiers": [],
                "automatic_action": False,
                "professional_decision_required": True,
            },
        )

    return recommendations


def _build_protection_summary(
    analytics: dict[str, Any],
) -> dict[str, Any]:
    summary = _as_record(
        analytics.get(
            "summary",
        ),
    )

    total_evidences = (
        _non_negative_integer(
            summary.get(
                "total_evidences",
            ),
        )
    )

    protected_evidences = (
        _non_negative_integer(
            summary.get(
                "total_protected_evidences",
            ),
        )
    )

    evidences_with_identifiable_minor = (
        _non_negative_integer(
            summary.get(
                "total_evidences_with_identifiable_minor",
            ),
        )
    )

    return {
        "total_evidences": (
            total_evidences
        ),
        "protected_evidences": (
            protected_evidences
        ),
        "evidences_with_identifiable_minor": (
            evidences_with_identifiable_minor
        ),
        "file_content_analyzed": False,
        "storage_accessed": False,
        "student_assessment_performed": False,
    }


def execute_evidence_completion_analysis(
    resolution: CapabilityResolution,
    payload: dict[str, Any],
) -> dict[str, Any]:
    """
    Handler oficial da capacidade evidence.completion_analysis.

    Analisa exclusivamente metadados e resultados estruturados
    já produzidos e autorizados pelo EIOS.

    Não acessa banco, Storage ou conteúdo de arquivos.
    """

    if (
        resolution.capability_id
        != EVIDENCE_COMPLETION_ANALYSIS_ID
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
                    EVIDENCE_COMPLETION_ANALYSIS_ID
                ),
            },
        )

    dashboard_intelligence = _as_record(
        payload.get(
            "dashboard_intelligence",
        ),
    )

    weekly_analysis = _as_record(
        payload.get(
            "weekly_analysis",
        ),
    )

    if not dashboard_intelligence:
        raise CapabilityValidationError(
            (
                "A análise de evidências exige o resultado de "
                "agenda.dashboard_intelligence."
            ),
            capability_id=(
                EVIDENCE_COMPLETION_ANALYSIS_ID
            ),
            details={
                "required_dependency": (
                    AGENDA_DASHBOARD_INTELLIGENCE_ID
                ),
            },
        )

    if not weekly_analysis:
        raise CapabilityValidationError(
            (
                "A análise de evidências exige o resultado de "
                "planning.weekly_planning_analysis."
            ),
            capability_id=(
                EVIDENCE_COMPLETION_ANALYSIS_ID
            ),
            details={
                "required_dependency": (
                    PLANNING_WEEKLY_ANALYSIS_ID
                ),
            },
        )

    weekly_capability_id = _optional_text(
        weekly_analysis.get(
            "capability_id",
        ),
    )

    if (
        weekly_capability_id is not None
        and weekly_capability_id
        != PLANNING_WEEKLY_ANALYSIS_ID
    ):
        raise CapabilityValidationError(
            (
                "O resultado da análise semanal "
                "é incompatível."
            ),
            capability_id=(
                EVIDENCE_COMPLETION_ANALYSIS_ID
            ),
            details={
                "expected_dependency": (
                    PLANNING_WEEKLY_ANALYSIS_ID
                ),
                "received_dependency": (
                    weekly_capability_id
                ),
            },
        )

    analytics = _extract_analytics(
        dashboard_intelligence,
    )

    if not analytics:
        raise CapabilityValidationError(
            (
                "O resultado do Dashboard não contém "
                "a seção analytics necessária."
            ),
            capability_id=(
                EVIDENCE_COMPLETION_ANALYSIS_ID
            ),
            details={
                "required_section": "analytics",
            },
        )

    dimensions = _build_dimensions(
        analytics,
    )

    overall_score = _average(
        [
            dimension.get(
                "score",
            )
            for dimension in dimensions
        ],
    )

    attention_items = (
        _build_attention_items(
            analytics,
        )
    )

    recommendations = (
        _build_recommendations(
            attention_items,
        )
    )

    findings = _as_record(
        analytics.get(
            "operational_findings",
        ),
    )

    summary = _as_record(
        analytics.get(
            "summary",
        ),
    )

    references = _as_record(
        analytics.get(
            "references",
        ),
    )

    total_pending = (
        _non_negative_integer(
            findings.get(
                "completed_lessons_without_evidence",
            ),
        )
        + _non_negative_integer(
            findings.get(
                "active_objectives_without_evidence",
            ),
        )
        + _non_negative_integer(
            findings.get(
                "evidences_without_objective",
            ),
        )
        + _non_negative_integer(
            findings.get(
                "evidences_without_lesson",
            ),
        )
    )

    return {
        "capability_id": (
            EVIDENCE_COMPLETION_ANALYSIS_ID
        ),
        "contract_version": (
            "evidence-completion-analysis-v1"
        ),
        "generated_at": (
            datetime.now(
                timezone.utc,
            ).isoformat()
        ),
        "source_capabilities": [
            AGENDA_DASHBOARD_INTELLIGENCE_ID,
            PLANNING_WEEKLY_ANALYSIS_ID,
        ],
        "summary": {
            "overall_score": (
                overall_score
            ),
            "status": (
                _analysis_status(
                    overall_score,
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
                total_pending
            ),
            "attention_items": len(
                attention_items,
            ),
            "recommendations": len(
                recommendations,
            ),
            "dimensions": len(
                dimensions,
            ),
        },
        "dimensions": dimensions,
        "attention_items": (
            attention_items
        ),
        "recommendations": (
            recommendations
        ),
        "protection": (
            _build_protection_summary(
                analytics,
            )
        ),
        "references": {
            "completed_lesson_ids_without_evidence": (
                _as_identifier_list(
                    references.get(
                        "completed_lesson_ids_without_evidence",
                    ),
                )
            ),
            "objective_ids_without_evidence": (
                _as_identifier_list(
                    references.get(
                        "objective_ids_without_evidence",
                    ),
                )
            ),
            "evidence_ids_without_objective": (
                _as_identifier_list(
                    references.get(
                        "evidence_ids_without_objective",
                    ),
                )
            ),
            "evidence_ids_without_lesson": (
                _as_identifier_list(
                    references.get(
                        "evidence_ids_without_lesson",
                    ),
                )
            ),
        },
        "weekly_context": {
            "status": (
                _as_record(
                    weekly_analysis.get(
                        "summary",
                    ),
                ).get(
                    "status",
                )
            ),
            "overall_score": (
                _as_record(
                    weekly_analysis.get(
                        "summary",
                    ),
                ).get(
                    "overall_score",
                )
            ),
            "period": (
                _as_record(
                    weekly_analysis.get(
                        "period",
                    ),
                )
            ),
        },
        "metadata": {
            "deterministic": True,
            "generative_ai_used": False,
            "automatic_changes_executed": False,
            "database_accessed": False,
            "storage_accessed": False,
            "file_content_analyzed": False,
            "student_assessment_performed": False,
            "professional_decision_required": True,
            "analysis_dimensions": [
                "lesson_coverage",
                "objective_coverage",
                "linkage_integrity",
                "completion_status",
                "evidence_backlog",
            ],
        },
    }


def register_evidence_handlers(
    dispatcher: CapabilityDispatcher | None = None,
) -> tuple[str, ...]:
    """
    Registra os handlers oficiais de inteligência
    de evidências.

    O processo é idempotente e seguro para o Bootstrap.
    """

    target_dispatcher = (
        dispatcher
        or capability_dispatcher
    )

    handlers = (
        (
            EVIDENCE_COMPLETION_ANALYSIS_ID,
            execute_evidence_completion_analysis,
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