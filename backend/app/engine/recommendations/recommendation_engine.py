from typing import Any

from app.engine.context import EngineContext


class RecommendationEngine:
    """
    Motor oficial de Recomendações do EDI Intelligence Engine.

    Responsabilidades:

    - transformar insights em ações priorizadas;
    - preservar a rastreabilidade entre recomendação e insight;
    - evitar duplicação das regras analíticas;
    - organizar recomendações por prioridade e impacto;
    - manter comportamento determinístico e auditável;
    - não utilizar inteligência artificial generativa;
    - não acessar diretamente banco de dados ou serviços externos.

    O motor aceita dois formatos:

    1. Contrato operacional atualizado:
       - analytics
       - insights
       - planning
       - objectives
       - lessons
       - evidences

    2. Contrato legado:
       - objectives
       - evidences
       - methodology

    O contrato legado permanece temporariamente para não quebrar
    consumidores existentes antes da atualização do PipelineEngine.
    """

    HIGH_PRIORITY = "high"
    MEDIUM_PRIORITY = "medium"
    LOW_PRIORITY = "low"

    CRITICAL_SEVERITY = "critical"
    WARNING_SEVERITY = "warning"
    ATTENTION_SEVERITY = "attention"
    OPPORTUNITY_SEVERITY = "opportunity"
    POSITIVE_SEVERITY = "positive"

    HIGH_IMPACT = "high"
    MEDIUM_IMPACT = "medium"
    LOW_IMPACT = "low"

    @staticmethod
    def generate(
        context: EngineContext,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Gera recomendações priorizadas.

        O método procura primeiro o contrato estruturado produzido
        pelos motores de Analytics e Insights.

        Caso esses dados ainda não estejam presentes, utiliza regras
        temporárias de compatibilidade sobre o payload operacional.
        """

        normalized_payload = (
            payload
            if isinstance(
                payload,
                dict,
            )
            else {}
        )

        module = (
            context.module
            or "platform"
        )

        analytics = RecommendationEngine._as_record(
            normalized_payload.get(
                "analytics",
            ),
        )

        insights_result = RecommendationEngine._as_record(
            normalized_payload.get(
                "insights",
            ),
        )

        structured_insights = (
            RecommendationEngine._as_record_list(
                insights_result.get(
                    "insights",
                ),
            )
        )

        recommendations: list[dict[str, Any]] = []

        if structured_insights:
            recommendations.extend(
                RecommendationEngine._from_insights(
                    context=context,
                    insights=structured_insights,
                ),
            )
        elif module == "agenda":
            recommendations.extend(
                RecommendationEngine._from_agenda_payload(
                    context=context,
                    payload=normalized_payload,
                    analytics=analytics,
                ),
            )

        ordered_recommendations = (
            RecommendationEngine._sort_recommendations(
                RecommendationEngine._deduplicate(
                    recommendations,
                ),
            )
        )

        return {
            "context": context.to_dict(),
            "contract": {
                "engine": "edi-intelligence",
                "component": "recommendation-engine",
                "version": "agenda-operational-v1",
                "deterministic": True,
                "generative_ai_used": False,
                "source": (
                    "insight-engine"
                    if structured_insights
                    else "operational-fallback"
                ),
            },
            "total": len(
                ordered_recommendations,
            ),
            "summary": {
                "high_priority": (
                    RecommendationEngine._count_by_priority(
                        ordered_recommendations,
                        RecommendationEngine.HIGH_PRIORITY,
                    )
                ),
                "medium_priority": (
                    RecommendationEngine._count_by_priority(
                        ordered_recommendations,
                        RecommendationEngine.MEDIUM_PRIORITY,
                    )
                ),
                "low_priority": (
                    RecommendationEngine._count_by_priority(
                        ordered_recommendations,
                        RecommendationEngine.LOW_PRIORITY,
                    )
                ),
                "high_impact": (
                    RecommendationEngine._count_by_impact(
                        ordered_recommendations,
                        RecommendationEngine.HIGH_IMPACT,
                    )
                ),
            },
            "recommendations": ordered_recommendations,
        }

    @staticmethod
    def _from_insights(
        context: EngineContext,
        insights: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        recommendations: list[dict[str, Any]] = []

        for insight in insights:
            recommendation = (
                RecommendationEngine._recommendation_from_insight(
                    context=context,
                    insight=insight,
                )
            )

            if recommendation:
                recommendations.append(
                    recommendation,
                )

        return recommendations

    @staticmethod
    def _recommendation_from_insight(
        context: EngineContext,
        insight: dict[str, Any],
    ) -> dict[str, Any] | None:
        code = RecommendationEngine._normalized_text(
            insight.get(
                "code",
            ),
        )

        if not code:
            return None

        severity = RecommendationEngine._normalize_severity(
            insight.get(
                "severity",
            ),
        )

        priority = RecommendationEngine._normalize_priority(
            insight.get(
                "priority",
            ),
        )

        title = RecommendationEngine._required_text(
            insight.get(
                "title",
            ),
            fallback=(
                "Ação recomendada pelo EDI Intelligence"
            ),
        )

        description = RecommendationEngine._required_text(
            insight.get(
                "description",
            ),
            fallback=(
                "O motor identificou uma situação que requer acompanhamento."
            ),
        )

        recommended_action = (
            RecommendationEngine._required_text(
                insight.get(
                    "recommendation",
                ),
                fallback=(
                    "Revise os registros relacionados e atualize o ciclo pedagógico."
                ),
            )
        )

        destination = RecommendationEngine._as_record(
            insight.get(
                "destination",
            ),
        )

        related_records = RecommendationEngine._as_record(
            insight.get(
                "related_records",
            ),
        )

        source = RecommendationEngine._as_record(
            insight.get(
                "source",
            ),
        )

        value = RecommendationEngine._numeric_value(
            insight.get(
                "value",
            ),
        )

        value_unit = RecommendationEngine._required_text(
            insight.get(
                "value_unit",
            ),
            fallback="count",
        )

        estimated_impact = (
            RecommendationEngine._impact_from_severity(
                severity,
            )
        )

        confidence = (
            RecommendationEngine._confidence_from_source(
                source=source,
                related_records=related_records,
            )
        )

        destination_module = (
            RecommendationEngine._required_text(
                destination.get(
                    "module",
                ),
                fallback=(
                    context.module
                    or "platform"
                ),
            )
        )

        destination_path = (
            RecommendationEngine._required_text(
                destination.get(
                    "path",
                ),
                fallback="/agenda/dashboard",
            )
        )

        action_label = RecommendationEngine._required_text(
            destination.get(
                "action_label",
            ),
            fallback="Revisar situação",
        )

        related_record_ids = (
            RecommendationEngine._identifier_list(
                related_records.get(
                    "ids",
                ),
            )
        )

        related_record_type = (
            RecommendationEngine._optional_text(
                related_records.get(
                    "type",
                ),
            )
        )

        return {
            "code": (
                f"recommendation.{code}"
            ),
            "type": RecommendationEngine._required_text(
                insight.get(
                    "type",
                ),
                fallback="operational",
            ),
            "priority": priority,
            "severity": severity,
            "title": title,
            "reason": description,
            "recommended_action": recommended_action,
            "destination": {
                "module": destination_module,
                "path": destination_path,
                "action_label": action_label,
            },
            "estimated_impact": estimated_impact,
            "confidence": confidence,
            "value": value,
            "value_unit": value_unit,
            "related_records": {
                "type": related_record_type,
                "ids": related_record_ids,
                "total": len(
                    related_record_ids,
                ),
            },
            "source_insight": {
                "code": code,
                "indicator": RecommendationEngine._optional_text(
                    source.get(
                        "indicator",
                    ),
                ),
                "engine": RecommendationEngine._required_text(
                    source.get(
                        "engine",
                    ),
                    fallback="insight-engine",
                ),
                "legacy": (
                    source.get(
                        "legacy",
                    )
                    is True
                ),
            },
        }

    @staticmethod
    def _from_agenda_payload(
        context: EngineContext,
        payload: dict[str, Any],
        analytics: dict[str, Any],
    ) -> list[dict[str, Any]]:
        """
        Compatibilidade temporária para consumidores que ainda não
        enviam o resultado do InsightEngine ao RecommendationEngine.

        A lógica utiliza os dados operacionais disponíveis, sem
        substituir a interpretação oficial do InsightEngine.
        """

        recommendations: list[dict[str, Any]] = []

        findings = RecommendationEngine._as_record(
            analytics.get(
                "operational_findings",
            ),
        )

        references = RecommendationEngine._as_record(
            analytics.get(
                "references",
            ),
        )

        if findings:
            RecommendationEngine._append_analytics_fallbacks(
                context=context,
                recommendations=recommendations,
                findings=findings,
                references=references,
            )

            return recommendations

        objectives = RecommendationEngine._as_record_list(
            payload.get(
                "objectives",
            ),
        )

        lessons = RecommendationEngine._as_record_list(
            payload.get(
                "lessons",
            ),
        )

        evidences = RecommendationEngine._as_record_list(
            payload.get(
                "evidences",
            ),
        )

        planning = RecommendationEngine._as_record_list(
            payload.get(
                "planning",
            ),
        )

        methodology = payload.get(
            "methodology",
        )

        if not objectives:
            recommendations.append(
                RecommendationEngine._build_fallback_recommendation(
                    context=context,
                    code="agenda.create_objectives",
                    recommendation_type="planning",
                    priority=RecommendationEngine.HIGH_PRIORITY,
                    severity=RecommendationEngine.WARNING_SEVERITY,
                    title="Adicionar objetivos de aprendizagem",
                    reason=(
                        "Nenhum objetivo de aprendizagem foi encontrado no contexto analisado."
                    ),
                    recommended_action=(
                        "Cadastre objetivos claros antes de ampliar o planejamento das aulas."
                    ),
                    destination_path="/agenda/objetivos",
                    action_label="Criar objetivos",
                    estimated_impact=RecommendationEngine.HIGH_IMPACT,
                    confidence=1.0,
                ),
            )

        if lessons and not evidences:
            recommendations.append(
                RecommendationEngine._build_fallback_recommendation(
                    context=context,
                    code="agenda.register_evidences",
                    recommendation_type="evidence",
                    priority=RecommendationEngine.HIGH_PRIORITY,
                    severity=RecommendationEngine.CRITICAL_SEVERITY,
                    title="Registrar evidências",
                    reason=(
                        "Existem aulas no contexto analisado, mas nenhuma evidência foi encontrada."
                    ),
                    recommended_action=(
                        "Registre evidências das aulas para alimentar o ciclo de análise do Framework EDI."
                    ),
                    destination_path="/agenda/aulas",
                    action_label="Abrir aulas",
                    estimated_impact=RecommendationEngine.HIGH_IMPACT,
                    confidence=1.0,
                    value=len(
                        lessons,
                    ),
                ),
            )

        if planning and not lessons:
            recommendations.append(
                RecommendationEngine._build_fallback_recommendation(
                    context=context,
                    code="agenda.execute_planning",
                    recommendation_type="planning",
                    priority=RecommendationEngine.MEDIUM_PRIORITY,
                    severity=RecommendationEngine.ATTENTION_SEVERITY,
                    title="Transformar planejamento em aulas",
                    reason=(
                        "Há planejamentos registrados, mas nenhuma aula foi encontrada."
                    ),
                    recommended_action=(
                        "Converta os planejamentos ativos em aulas ou revise sua validade."
                    ),
                    destination_path="/agenda/planejamento",
                    action_label="Abrir planejamentos",
                    estimated_impact=RecommendationEngine.MEDIUM_IMPACT,
                    confidence=1.0,
                    value=len(
                        planning,
                    ),
                ),
            )

        if not RecommendationEngine._has_methodology(
            methodology=methodology,
            lessons=lessons,
        ):
            recommendations.append(
                RecommendationEngine._build_fallback_recommendation(
                    context=context,
                    code="agenda.describe_methodology",
                    recommendation_type="methodology",
                    priority=RecommendationEngine.LOW_PRIORITY,
                    severity=RecommendationEngine.OPPORTUNITY_SEVERITY,
                    title="Descrever metodologia",
                    reason=(
                        "Não foram encontradas informações suficientes sobre a metodologia utilizada."
                    ),
                    recommended_action=(
                        "Registre a metodologia das aulas para apoiar análises e replanejamentos futuros."
                    ),
                    destination_path="/agenda/aulas",
                    action_label="Atualizar aulas",
                    estimated_impact=RecommendationEngine.LOW_IMPACT,
                    confidence=0.9,
                ),
            )

        return recommendations

    @staticmethod
    def _append_analytics_fallbacks(
        context: EngineContext,
        recommendations: list[dict[str, Any]],
        findings: dict[str, Any],
        references: dict[str, Any],
    ) -> None:
        completed_without_evidence = (
            RecommendationEngine._non_negative_integer(
                findings.get(
                    "completed_lessons_without_evidence",
                ),
            )
        )

        if completed_without_evidence > 0:
            lesson_ids = RecommendationEngine._identifier_list(
                references.get(
                    "completed_lesson_ids_without_evidence",
                ),
            )

            recommendations.append(
                RecommendationEngine._build_fallback_recommendation(
                    context=context,
                    code="agenda.register_completed_lesson_evidences",
                    recommendation_type="evidence",
                    priority=RecommendationEngine.HIGH_PRIORITY,
                    severity=RecommendationEngine.CRITICAL_SEVERITY,
                    title="Registrar evidências das aulas realizadas",
                    reason=(
                        f"{completed_without_evidence} aula(s) realizada(s) ainda não possuem evidência vinculada."
                    ),
                    recommended_action=(
                        "Priorize o registro das evidências das aulas concluídas."
                    ),
                    destination_path="/agenda/aulas",
                    action_label="Registrar evidências",
                    estimated_impact=RecommendationEngine.HIGH_IMPACT,
                    confidence=1.0,
                    value=completed_without_evidence,
                    related_record_type="lesson",
                    related_record_ids=lesson_ids,
                ),
            )

        objectives_without_evidence = (
            RecommendationEngine._non_negative_integer(
                findings.get(
                    "active_objectives_without_evidence",
                ),
            )
        )

        if objectives_without_evidence > 0:
            objective_ids = RecommendationEngine._identifier_list(
                references.get(
                    "objective_ids_without_evidence",
                ),
            )

            recommendations.append(
                RecommendationEngine._build_fallback_recommendation(
                    context=context,
                    code="agenda.review_objective_coverage",
                    recommendation_type="objective",
                    priority=RecommendationEngine.HIGH_PRIORITY,
                    severity=RecommendationEngine.WARNING_SEVERITY,
                    title="Revisar objetivos sem evidências",
                    reason=(
                        f"{objectives_without_evidence} objetivo(s) ativo(s) ainda não possuem evidência principal."
                    ),
                    recommended_action=(
                        "Relacione os objetivos às aulas e produza evidências correspondentes."
                    ),
                    destination_path="/agenda/objetivos",
                    action_label="Revisar objetivos",
                    estimated_impact=RecommendationEngine.HIGH_IMPACT,
                    confidence=1.0,
                    value=objectives_without_evidence,
                    related_record_type="objective",
                    related_record_ids=objective_ids,
                ),
            )

        planning_without_lessons = (
            RecommendationEngine._non_negative_integer(
                findings.get(
                    "planning_without_lessons",
                ),
            )
        )

        if planning_without_lessons > 0:
            planning_ids = RecommendationEngine._identifier_list(
                references.get(
                    "planning_ids_without_lessons",
                ),
            )

            recommendations.append(
                RecommendationEngine._build_fallback_recommendation(
                    context=context,
                    code="agenda.connect_planning_to_lessons",
                    recommendation_type="planning",
                    priority=RecommendationEngine.MEDIUM_PRIORITY,
                    severity=RecommendationEngine.ATTENTION_SEVERITY,
                    title="Transformar planejamentos em execução",
                    reason=(
                        f"{planning_without_lessons} planejamento(s) ainda não originaram aulas."
                    ),
                    recommended_action=(
                        "Crie aulas relacionadas ou revise se os planejamentos permanecem ativos."
                    ),
                    destination_path="/agenda/planejamento",
                    action_label="Abrir planejamentos",
                    estimated_impact=RecommendationEngine.MEDIUM_IMPACT,
                    confidence=1.0,
                    value=planning_without_lessons,
                    related_record_type="planning",
                    related_record_ids=planning_ids,
                ),
            )

        evidences_without_objective = (
            RecommendationEngine._non_negative_integer(
                findings.get(
                    "evidences_without_objective",
                ),
            )
        )

        if evidences_without_objective > 0:
            evidence_ids = RecommendationEngine._identifier_list(
                references.get(
                    "evidence_ids_without_objective",
                ),
            )

            recommendations.append(
                RecommendationEngine._build_fallback_recommendation(
                    context=context,
                    code="agenda.connect_evidences_to_objectives",
                    recommendation_type="evidence",
                    priority=RecommendationEngine.MEDIUM_PRIORITY,
                    severity=RecommendationEngine.WARNING_SEVERITY,
                    title="Relacionar evidências aos objetivos",
                    reason=(
                        f"{evidences_without_objective} evidência(s) não possuem objetivo principal vinculado."
                    ),
                    recommended_action=(
                        "Revise o contexto pedagógico e vincule as evidências aos objetivos correspondentes."
                    ),
                    destination_path="/agenda/evidencias",
                    action_label="Revisar evidências",
                    estimated_impact=RecommendationEngine.MEDIUM_IMPACT,
                    confidence=1.0,
                    value=evidences_without_objective,
                    related_record_type="evidence",
                    related_record_ids=evidence_ids,
                ),
            )

    @staticmethod
    def _build_fallback_recommendation(
        context: EngineContext,
        code: str,
        recommendation_type: str,
        priority: str,
        severity: str,
        title: str,
        reason: str,
        recommended_action: str,
        destination_path: str,
        action_label: str,
        estimated_impact: str,
        confidence: float,
        value: int | float = 0,
        related_record_type: str | None = None,
        related_record_ids: list[str] | None = None,
    ) -> dict[str, Any]:
        normalized_ids = (
            related_record_ids
            or []
        )

        return {
            "code": code,
            "type": recommendation_type,
            "priority": priority,
            "severity": severity,
            "title": title,
            "reason": reason,
            "recommended_action": recommended_action,
            "destination": {
                "module": (
                    context.module
                    or "agenda"
                ),
                "path": destination_path,
                "action_label": action_label,
            },
            "estimated_impact": estimated_impact,
            "confidence": RecommendationEngine._normalize_confidence(
                confidence,
            ),
            "value": value,
            "value_unit": "count",
            "related_records": {
                "type": related_record_type,
                "ids": normalized_ids,
                "total": len(
                    normalized_ids,
                ),
            },
            "source_insight": {
                "code": None,
                "indicator": None,
                "engine": "operational-fallback",
                "legacy": True,
            },
        }

    @staticmethod
    def _has_methodology(
        methodology: Any,
        lessons: list[dict[str, Any]],
    ) -> bool:
        if (
            isinstance(
                methodology,
                str,
            )
            and methodology.strip()
        ):
            return True

        return any(
            isinstance(
                lesson.get(
                    "methodology",
                ),
                str,
            )
            and lesson.get(
                "methodology",
                "",
            ).strip()
            for lesson in lessons
        )

    @staticmethod
    def _impact_from_severity(
        severity: str,
    ) -> str:
        if severity == RecommendationEngine.CRITICAL_SEVERITY:
            return RecommendationEngine.HIGH_IMPACT

        if severity == RecommendationEngine.WARNING_SEVERITY:
            return RecommendationEngine.HIGH_IMPACT

        if severity == RecommendationEngine.ATTENTION_SEVERITY:
            return RecommendationEngine.MEDIUM_IMPACT

        if severity == RecommendationEngine.OPPORTUNITY_SEVERITY:
            return RecommendationEngine.MEDIUM_IMPACT

        return RecommendationEngine.LOW_IMPACT

    @staticmethod
    def _confidence_from_source(
        source: dict[str, Any],
        related_records: dict[str, Any],
    ) -> float:
        legacy = (
            source.get(
                "legacy",
            )
            is True
        )

        record_ids = RecommendationEngine._identifier_list(
            related_records.get(
                "ids",
            ),
        )

        indicator = RecommendationEngine._optional_text(
            source.get(
                "indicator",
            ),
        )

        if (
            not legacy
            and indicator
            and record_ids
        ):
            return 1.0

        if (
            not legacy
            and indicator
        ):
            return 0.98

        if legacy:
            return 0.85

        return 0.9

    @staticmethod
    def _deduplicate(
        recommendations: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        unique_recommendations: list[
            dict[str, Any]
        ] = []

        seen_codes: set[str] = set()

        for recommendation in recommendations:
            code = RecommendationEngine._normalized_text(
                recommendation.get(
                    "code",
                ),
            )

            if (
                not code
                or code in seen_codes
            ):
                continue

            seen_codes.add(
                code,
            )

            unique_recommendations.append(
                recommendation,
            )

        return unique_recommendations

    @staticmethod
    def _sort_recommendations(
        recommendations: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        priority_order = {
            RecommendationEngine.HIGH_PRIORITY: 0,
            RecommendationEngine.MEDIUM_PRIORITY: 1,
            RecommendationEngine.LOW_PRIORITY: 2,
        }

        severity_order = {
            RecommendationEngine.CRITICAL_SEVERITY: 0,
            RecommendationEngine.WARNING_SEVERITY: 1,
            RecommendationEngine.ATTENTION_SEVERITY: 2,
            RecommendationEngine.OPPORTUNITY_SEVERITY: 3,
            RecommendationEngine.POSITIVE_SEVERITY: 4,
        }

        impact_order = {
            RecommendationEngine.HIGH_IMPACT: 0,
            RecommendationEngine.MEDIUM_IMPACT: 1,
            RecommendationEngine.LOW_IMPACT: 2,
        }

        return sorted(
            recommendations,
            key=lambda recommendation: (
                priority_order.get(
                    str(
                        recommendation.get(
                            "priority",
                            "",
                        ),
                    ),
                    99,
                ),
                severity_order.get(
                    str(
                        recommendation.get(
                            "severity",
                            "",
                        ),
                    ),
                    99,
                ),
                impact_order.get(
                    str(
                        recommendation.get(
                            "estimated_impact",
                            "",
                        ),
                    ),
                    99,
                ),
                -RecommendationEngine._numeric_value(
                    recommendation.get(
                        "value",
                    ),
                ),
                str(
                    recommendation.get(
                        "code",
                        "",
                    ),
                ),
            ),
        )

    @staticmethod
    def _count_by_priority(
        recommendations: list[dict[str, Any]],
        priority: str,
    ) -> int:
        return sum(
            1
            for recommendation in recommendations
            if recommendation.get(
                "priority",
            )
            == priority
        )

    @staticmethod
    def _count_by_impact(
        recommendations: list[dict[str, Any]],
        impact: str,
    ) -> int:
        return sum(
            1
            for recommendation in recommendations
            if recommendation.get(
                "estimated_impact",
            )
            == impact
        )

    @staticmethod
    def _normalize_priority(
        value: Any,
    ) -> str:
        normalized_value = (
            RecommendationEngine._normalized_text(
                value,
            )
        )

        if normalized_value in {
            RecommendationEngine.HIGH_PRIORITY,
            RecommendationEngine.MEDIUM_PRIORITY,
            RecommendationEngine.LOW_PRIORITY,
        }:
            return normalized_value

        return RecommendationEngine.MEDIUM_PRIORITY

    @staticmethod
    def _normalize_severity(
        value: Any,
    ) -> str:
        normalized_value = (
            RecommendationEngine._normalized_text(
                value,
            )
        )

        if normalized_value in {
            RecommendationEngine.CRITICAL_SEVERITY,
            RecommendationEngine.WARNING_SEVERITY,
            RecommendationEngine.ATTENTION_SEVERITY,
            RecommendationEngine.OPPORTUNITY_SEVERITY,
            RecommendationEngine.POSITIVE_SEVERITY,
        }:
            return normalized_value

        return RecommendationEngine.ATTENTION_SEVERITY

    @staticmethod
    def _normalize_confidence(
        value: Any,
    ) -> float:
        if isinstance(
            value,
            bool,
        ):
            return 0.0

        if not isinstance(
            value,
            (
                int,
                float,
            ),
        ):
            return 0.0

        return round(
            min(
                max(
                    float(value),
                    0.0,
                ),
                1.0,
            ),
            2,
        )

    @staticmethod
    def _numeric_value(
        value: Any,
    ) -> float:
        if isinstance(
            value,
            bool,
        ):
            return 0.0

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

        return 0.0

    @staticmethod
    def _non_negative_integer(
        value: Any,
    ) -> int:
        if isinstance(
            value,
            bool,
        ):
            return 0

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
                int(value),
                0,
            )

        return 0

    @staticmethod
    def _as_record(
        value: Any,
    ) -> dict[str, Any]:
        if not isinstance(
            value,
            dict,
        ):
            return {}

        return value

    @staticmethod
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

    @staticmethod
    def _identifier_list(
        value: Any,
    ) -> list[str]:
        if not isinstance(
            value,
            list,
        ):
            return []

        identifiers = [
            item.strip()
            for item in value
            if (
                isinstance(
                    item,
                    str,
                )
                and item.strip()
            )
        ]

        return list(
            dict.fromkeys(
                identifiers,
            ),
        )

    @staticmethod
    def _normalized_text(
        value: Any,
    ) -> str:
        if not isinstance(
            value,
            str,
        ):
            return ""

        return value.strip().lower()

    @staticmethod
    def _required_text(
        value: Any,
        fallback: str,
    ) -> str:
        if (
            isinstance(
                value,
                str,
            )
            and value.strip()
        ):
            return value.strip()

        return fallback

    @staticmethod
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