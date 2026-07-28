from typing import Any

from app.engine.context import EngineContext


class InsightEngine:
    """
    Motor oficial de Insights do EDI Intelligence Engine.

    Responsabilidades:

    - interpretar os resultados estruturados do AnalyticsEngine;
    - transformar indicadores em insights claros e acionáveis;
    - preservar rastreabilidade entre insight e registros de origem;
    - distinguir alertas, oportunidades e resultados positivos;
    - manter comportamento determinístico e auditável;
    - não utilizar inteligência artificial generativa;
    - não acessar banco de dados ou serviços externos.

    O InsightEngine recebe somente dados já consolidados e
    autorizados pelo pipeline do EIOS.
    """

    HIGH_PRIORITY = "high"
    MEDIUM_PRIORITY = "medium"
    LOW_PRIORITY = "low"

    CRITICAL_SEVERITY = "critical"
    WARNING_SEVERITY = "warning"
    ATTENTION_SEVERITY = "attention"
    OPPORTUNITY_SEVERITY = "opportunity"
    POSITIVE_SEVERITY = "positive"

    @staticmethod
    def generate(
        context: EngineContext,
        analytics: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Gera insights a partir do contrato do AnalyticsEngine.

        Estruturas esperadas:

        - summary
        - edi_indicators
        - operational_findings
        - references

        O método também preserva compatibilidade com indicadores
        antigos enquanto os produtos migram para o novo contrato.
        """

        normalized_analytics = (
            analytics
            if isinstance(
                analytics,
                dict,
            )
            else {}
        )

        summary = InsightEngine._as_record(
            normalized_analytics.get(
                "summary",
            ),
        )

        indicators = InsightEngine._as_record(
            normalized_analytics.get(
                "edi_indicators",
            ),
        )

        findings = InsightEngine._as_record(
            normalized_analytics.get(
                "operational_findings",
            ),
        )

        references = InsightEngine._as_record(
            normalized_analytics.get(
                "references",
            ),
        )

        insights: list[dict[str, Any]] = []

        InsightEngine._append_completed_lessons_without_evidence(
            insights=insights,
            context=context,
            findings=findings,
            references=references,
        )

        InsightEngine._append_objectives_without_evidence(
            insights=insights,
            context=context,
            findings=findings,
            references=references,
        )

        InsightEngine._append_planning_without_lessons(
            insights=insights,
            context=context,
            findings=findings,
            references=references,
        )

        InsightEngine._append_evidences_without_objective(
            insights=insights,
            context=context,
            findings=findings,
            references=references,
        )

        InsightEngine._append_evidences_without_lesson(
            insights=insights,
            context=context,
            findings=findings,
            references=references,
        )

        InsightEngine._append_execution_rate_insight(
            insights=insights,
            context=context,
            indicators=indicators,
            summary=summary,
        )

        InsightEngine._append_evidence_coverage_insight(
            insights=insights,
            context=context,
            indicators=indicators,
            summary=summary,
        )

        InsightEngine._append_objective_coverage_insight(
            insights=insights,
            context=context,
            indicators=indicators,
            summary=summary,
        )

        InsightEngine._append_planning_execution_insight(
            insights=insights,
            context=context,
            indicators=indicators,
            summary=summary,
        )

        InsightEngine._append_operational_score_insight(
            insights=insights,
            context=context,
            indicators=indicators,
        )

        InsightEngine._append_legacy_insights(
            insights=insights,
            context=context,
            indicators=indicators,
        )

        ordered_insights = (
            InsightEngine._sort_insights(
                insights,
            )
        )

        return {
            "context": context.to_dict(),
            "contract": {
                "engine": "edi-intelligence",
                "component": "insight-engine",
                "version": "agenda-operational-v1",
                "deterministic": True,
                "generative_ai_used": False,
            },
            "total": len(
                ordered_insights,
            ),
            "summary": {
                "critical": (
                    InsightEngine._count_by_severity(
                        ordered_insights,
                        InsightEngine.CRITICAL_SEVERITY,
                    )
                ),
                "warning": (
                    InsightEngine._count_by_severity(
                        ordered_insights,
                        InsightEngine.WARNING_SEVERITY,
                    )
                ),
                "attention": (
                    InsightEngine._count_by_severity(
                        ordered_insights,
                        InsightEngine.ATTENTION_SEVERITY,
                    )
                ),
                "opportunity": (
                    InsightEngine._count_by_severity(
                        ordered_insights,
                        InsightEngine.OPPORTUNITY_SEVERITY,
                    )
                ),
                "positive": (
                    InsightEngine._count_by_severity(
                        ordered_insights,
                        InsightEngine.POSITIVE_SEVERITY,
                    )
                ),
            },
            "insights": ordered_insights,
        }

    @staticmethod
    def _append_completed_lessons_without_evidence(
        insights: list[dict[str, Any]],
        context: EngineContext,
        findings: dict[str, Any],
        references: dict[str, Any],
    ) -> None:
        count = InsightEngine._non_negative_integer(
            findings.get(
                "completed_lessons_without_evidence",
            ),
        )

        if count <= 0:
            return

        lesson_ids = InsightEngine._identifier_list(
            references.get(
                "completed_lesson_ids_without_evidence",
            ),
        )

        insights.append(
            InsightEngine._build_insight(
                context=context,
                code="agenda.completed_lessons_without_evidence",
                insight_type="evidence",
                severity=InsightEngine.CRITICAL_SEVERITY,
                priority=InsightEngine.HIGH_PRIORITY,
                title="Aulas realizadas sem evidências",
                description=(
                    f"{count} aula(s) realizada(s) ainda não possuem "
                    "evidência pedagógica vinculada."
                ),
                recommendation=(
                    "Registre evidências das aulas concluídas para manter "
                    "o ciclo pedagógico rastreável e apoiar o replanejamento."
                ),
                destination_module="agenda",
                destination_path="/agenda/aulas",
                action_label="Registrar evidências",
                value=count,
                related_record_type="lesson",
                related_record_ids=lesson_ids,
                source_indicator=(
                    "completed_lessons_without_evidence"
                ),
            ),
        )

    @staticmethod
    def _append_objectives_without_evidence(
        insights: list[dict[str, Any]],
        context: EngineContext,
        findings: dict[str, Any],
        references: dict[str, Any],
    ) -> None:
        count = InsightEngine._non_negative_integer(
            findings.get(
                "active_objectives_without_evidence",
            ),
        )

        if count <= 0:
            return

        objective_ids = InsightEngine._identifier_list(
            references.get(
                "objective_ids_without_evidence",
            ),
        )

        insights.append(
            InsightEngine._build_insight(
                context=context,
                code="agenda.active_objectives_without_evidence",
                insight_type="objective",
                severity=InsightEngine.WARNING_SEVERITY,
                priority=InsightEngine.HIGH_PRIORITY,
                title="Objetivos ativos sem evidências",
                description=(
                    f"{count} objetivo(s) ativo(s) ainda não possuem "
                    "evidência principal relacionada."
                ),
                recommendation=(
                    "Revise as aulas vinculadas e registre evidências que "
                    "demonstrem o desenvolvimento dos objetivos."
                ),
                destination_module="agenda",
                destination_path="/agenda/objetivos",
                action_label="Revisar objetivos",
                value=count,
                related_record_type="objective",
                related_record_ids=objective_ids,
                source_indicator=(
                    "active_objectives_without_evidence"
                ),
            ),
        )

    @staticmethod
    def _append_planning_without_lessons(
        insights: list[dict[str, Any]],
        context: EngineContext,
        findings: dict[str, Any],
        references: dict[str, Any],
    ) -> None:
        count = InsightEngine._non_negative_integer(
            findings.get(
                "planning_without_lessons",
            ),
        )

        if count <= 0:
            return

        planning_ids = InsightEngine._identifier_list(
            references.get(
                "planning_ids_without_lessons",
            ),
        )

        insights.append(
            InsightEngine._build_insight(
                context=context,
                code="agenda.planning_without_lessons",
                insight_type="planning",
                severity=InsightEngine.ATTENTION_SEVERITY,
                priority=InsightEngine.MEDIUM_PRIORITY,
                title="Planejamentos sem execução registrada",
                description=(
                    f"{count} planejamento(s) ainda não originaram "
                    "aulas no ciclo operacional."
                ),
                recommendation=(
                    "Transforme os planejamentos em aulas ou revise se "
                    "eles ainda permanecem válidos para o período."
                ),
                destination_module="agenda",
                destination_path="/agenda/planejamento",
                action_label="Abrir planejamentos",
                value=count,
                related_record_type="planning",
                related_record_ids=planning_ids,
                source_indicator="planning_without_lessons",
            ),
        )

    @staticmethod
    def _append_evidences_without_objective(
        insights: list[dict[str, Any]],
        context: EngineContext,
        findings: dict[str, Any],
        references: dict[str, Any],
    ) -> None:
        count = InsightEngine._non_negative_integer(
            findings.get(
                "evidences_without_objective",
            ),
        )

        if count <= 0:
            return

        evidence_ids = InsightEngine._identifier_list(
            references.get(
                "evidence_ids_without_objective",
            ),
        )

        insights.append(
            InsightEngine._build_insight(
                context=context,
                code="agenda.evidences_without_objective",
                insight_type="evidence",
                severity=InsightEngine.WARNING_SEVERITY,
                priority=InsightEngine.MEDIUM_PRIORITY,
                title="Evidências sem objetivo principal",
                description=(
                    f"{count} evidência(s) não possuem vínculo direto "
                    "com um objetivo principal."
                ),
                recommendation=(
                    "Revise o contexto pedagógico das evidências para "
                    "fortalecer a rastreabilidade entre execução e objetivos."
                ),
                destination_module="agenda",
                destination_path="/agenda/evidencias",
                action_label="Revisar evidências",
                value=count,
                related_record_type="evidence",
                related_record_ids=evidence_ids,
                source_indicator="evidences_without_objective",
            ),
        )

    @staticmethod
    def _append_evidences_without_lesson(
        insights: list[dict[str, Any]],
        context: EngineContext,
        findings: dict[str, Any],
        references: dict[str, Any],
    ) -> None:
        count = InsightEngine._non_negative_integer(
            findings.get(
                "evidences_without_lesson",
            ),
        )

        if count <= 0:
            return

        evidence_ids = InsightEngine._identifier_list(
            references.get(
                "evidence_ids_without_lesson",
            ),
        )

        insights.append(
            InsightEngine._build_insight(
                context=context,
                code="agenda.evidences_without_lesson",
                insight_type="evidence",
                severity=InsightEngine.ATTENTION_SEVERITY,
                priority=InsightEngine.LOW_PRIORITY,
                title="Evidências sem aula vinculada",
                description=(
                    f"{count} evidência(s) foram registradas sem vínculo "
                    "direto com uma aula."
                ),
                recommendation=(
                    "Mantenha evidências manuais apenas quando o registro "
                    "não estiver relacionado a uma aula específica."
                ),
                destination_module="agenda",
                destination_path="/agenda/evidencias",
                action_label="Consultar evidências",
                value=count,
                related_record_type="evidence",
                related_record_ids=evidence_ids,
                source_indicator="evidences_without_lesson",
            ),
        )

    @staticmethod
    def _append_execution_rate_insight(
        insights: list[dict[str, Any]],
        context: EngineContext,
        indicators: dict[str, Any],
        summary: dict[str, Any],
    ) -> None:
        total_lessons = InsightEngine._non_negative_integer(
            summary.get(
                "total_lessons",
            ),
        )

        if total_lessons <= 0:
            return

        execution_rate = InsightEngine._percentage_value(
            indicators.get(
                "execution_rate",
            ),
        )

        if execution_rate < 40:
            severity = InsightEngine.CRITICAL_SEVERITY
            priority = InsightEngine.HIGH_PRIORITY
            title = "Baixa execução das aulas planejadas"
            recommendation = (
                "Revise o volume de aulas em andamento, identifique "
                "impedimentos e ajuste o planejamento do período."
            )
        elif execution_rate < 70:
            severity = InsightEngine.WARNING_SEVERITY
            priority = InsightEngine.MEDIUM_PRIORITY
            title = "Execução pedagógica abaixo do esperado"
            recommendation = (
                "Acompanhe as aulas ainda pendentes e atualize seus "
                "status para manter o ciclo operacional consistente."
            )
        else:
            severity = InsightEngine.POSITIVE_SEVERITY
            priority = InsightEngine.LOW_PRIORITY
            title = "Boa taxa de execução das aulas"
            recommendation = (
                "Mantenha os registros atualizados e avance para a "
                "documentação das evidências das aulas realizadas."
            )

        insights.append(
            InsightEngine._build_insight(
                context=context,
                code="agenda.execution_rate",
                insight_type="execution",
                severity=severity,
                priority=priority,
                title=title,
                description=(
                    "A taxa atual de execução das aulas é de "
                    f"{execution_rate:.2f}%."
                ),
                recommendation=recommendation,
                destination_module="agenda",
                destination_path="/agenda/aulas",
                action_label="Acompanhar aulas",
                value=execution_rate,
                value_unit="percent",
                source_indicator="execution_rate",
            ),
        )

    @staticmethod
    def _append_evidence_coverage_insight(
        insights: list[dict[str, Any]],
        context: EngineContext,
        indicators: dict[str, Any],
        summary: dict[str, Any],
    ) -> None:
        completed_lessons = InsightEngine._non_negative_integer(
            summary.get(
                "total_completed_lessons",
            ),
        )

        if completed_lessons <= 0:
            return

        coverage_rate = InsightEngine._percentage_value(
            indicators.get(
                "evidence_coverage_rate",
            ),
        )

        if coverage_rate < 50:
            severity = InsightEngine.CRITICAL_SEVERITY
            priority = InsightEngine.HIGH_PRIORITY
            title = "Cobertura de evidências insuficiente"
            recommendation = (
                "Priorize o registro das evidências relacionadas às "
                "aulas já realizadas."
            )
        elif coverage_rate < 80:
            severity = InsightEngine.WARNING_SEVERITY
            priority = InsightEngine.MEDIUM_PRIORITY
            title = "Cobertura de evidências parcial"
            recommendation = (
                "Complete os registros das aulas realizadas para ampliar "
                "a consistência da documentação pedagógica."
            )
        else:
            severity = InsightEngine.POSITIVE_SEVERITY
            priority = InsightEngine.LOW_PRIORITY
            title = "Boa cobertura de evidências"
            recommendation = (
                "Mantenha a regularidade dos registros e verifique a "
                "qualidade dos vínculos com os objetivos."
            )

        insights.append(
            InsightEngine._build_insight(
                context=context,
                code="agenda.evidence_coverage_rate",
                insight_type="evidence",
                severity=severity,
                priority=priority,
                title=title,
                description=(
                    f"{coverage_rate:.2f}% das aulas realizadas possuem "
                    "evidência vinculada."
                ),
                recommendation=recommendation,
                destination_module="agenda",
                destination_path="/agenda/evidencias",
                action_label="Abrir evidências",
                value=coverage_rate,
                value_unit="percent",
                source_indicator="evidence_coverage_rate",
            ),
        )

    @staticmethod
    def _append_objective_coverage_insight(
        insights: list[dict[str, Any]],
        context: EngineContext,
        indicators: dict[str, Any],
        summary: dict[str, Any],
    ) -> None:
        active_objectives = InsightEngine._non_negative_integer(
            summary.get(
                "total_active_objectives",
            ),
        )

        if active_objectives <= 0:
            return

        coverage_rate = InsightEngine._percentage_value(
            indicators.get(
                "objective_coverage_rate",
            ),
        )

        if coverage_rate < 40:
            severity = InsightEngine.CRITICAL_SEVERITY
            priority = InsightEngine.HIGH_PRIORITY
            title = "Baixa cobertura dos objetivos"
            recommendation = (
                "Revise os objetivos ativos e relacione-os às aulas e "
                "evidências correspondentes."
            )
        elif coverage_rate < 75:
            severity = InsightEngine.WARNING_SEVERITY
            priority = InsightEngine.MEDIUM_PRIORITY
            title = "Cobertura parcial dos objetivos"
            recommendation = (
                "Identifique objetivos ainda não documentados e planeje "
                "ações para produzir evidências relacionadas."
            )
        else:
            severity = InsightEngine.POSITIVE_SEVERITY
            priority = InsightEngine.LOW_PRIORITY
            title = "Boa cobertura dos objetivos"
            recommendation = (
                "Continue acompanhando a qualidade e a diversidade das "
                "evidências vinculadas aos objetivos."
            )

        insights.append(
            InsightEngine._build_insight(
                context=context,
                code="agenda.objective_coverage_rate",
                insight_type="objective",
                severity=severity,
                priority=priority,
                title=title,
                description=(
                    f"{coverage_rate:.2f}% dos objetivos ativos possuem "
                    "evidência principal vinculada."
                ),
                recommendation=recommendation,
                destination_module="agenda",
                destination_path="/agenda/objetivos",
                action_label="Abrir objetivos",
                value=coverage_rate,
                value_unit="percent",
                source_indicator="objective_coverage_rate",
            ),
        )

    @staticmethod
    def _append_planning_execution_insight(
        insights: list[dict[str, Any]],
        context: EngineContext,
        indicators: dict[str, Any],
        summary: dict[str, Any],
    ) -> None:
        total_planning = InsightEngine._non_negative_integer(
            summary.get(
                "total_planning",
            ),
        )

        if total_planning <= 0:
            return

        execution_rate = InsightEngine._percentage_value(
            indicators.get(
                "planning_execution_rate",
            ),
        )

        if execution_rate < 50:
            severity = InsightEngine.WARNING_SEVERITY
            priority = InsightEngine.MEDIUM_PRIORITY
            title = "Planejamentos ainda não transformados em aulas"
            recommendation = (
                "Revise os planejamentos ativos e converta as ações "
                "previstas em aulas ou atualize sua validade."
            )
        elif execution_rate < 90:
            severity = InsightEngine.ATTENTION_SEVERITY
            priority = InsightEngine.LOW_PRIORITY
            title = "Parte dos planejamentos ainda aguarda execução"
            recommendation = (
                "Acompanhe os planejamentos sem aula e confirme quais "
                "devem permanecer ativos."
            )
        else:
            severity = InsightEngine.POSITIVE_SEVERITY
            priority = InsightEngine.LOW_PRIORITY
            title = "Planejamentos conectados à execução"
            recommendation = (
                "Mantenha a relação entre planejamento e aulas atualizada "
                "ao longo do período."
            )

        insights.append(
            InsightEngine._build_insight(
                context=context,
                code="agenda.planning_execution_rate",
                insight_type="planning",
                severity=severity,
                priority=priority,
                title=title,
                description=(
                    f"{execution_rate:.2f}% dos planejamentos já "
                    "originaram pelo menos uma aula."
                ),
                recommendation=recommendation,
                destination_module="agenda",
                destination_path="/agenda/planejamento",
                action_label="Abrir planejamento",
                value=execution_rate,
                value_unit="percent",
                source_indicator="planning_execution_rate",
            ),
        )

    @staticmethod
    def _append_operational_score_insight(
        insights: list[dict[str, Any]],
        context: EngineContext,
        indicators: dict[str, Any],
    ) -> None:
        if (
            "operational_score"
            not in indicators
        ):
            return

        score = InsightEngine._percentage_value(
            indicators.get(
                "operational_score",
            ),
        )

        if score < 40:
            severity = InsightEngine.CRITICAL_SEVERITY
            priority = InsightEngine.HIGH_PRIORITY
            title = "Ciclo operacional requer intervenção"
            recommendation = (
                "Priorize as pendências de execução, cobertura de "
                "objetivos e registro de evidências."
            )
        elif score < 70:
            severity = InsightEngine.WARNING_SEVERITY
            priority = InsightEngine.MEDIUM_PRIORITY
            title = "Ciclo operacional em consolidação"
            recommendation = (
                "Avance sobre as pendências indicadas para fortalecer a "
                "rastreabilidade do trabalho pedagógico."
            )
        elif score < 90:
            severity = InsightEngine.OPPORTUNITY_SEVERITY
            priority = InsightEngine.LOW_PRIORITY
            title = "Ciclo operacional consistente"
            recommendation = (
                "Concentre-se agora na qualidade dos registros e no uso "
                "dos indicadores para replanejamento."
            )
        else:
            severity = InsightEngine.POSITIVE_SEVERITY
            priority = InsightEngine.LOW_PRIORITY
            title = "Ciclo operacional amplamente consolidado"
            recommendation = (
                "Mantenha a regularidade dos registros e utilize os "
                "indicadores para orientar decisões pedagógicas."
            )

        insights.append(
            InsightEngine._build_insight(
                context=context,
                code="agenda.operational_score",
                insight_type="operational",
                severity=severity,
                priority=priority,
                title=title,
                description=(
                    f"O indicador operacional consolidado está em "
                    f"{score:.2f}%."
                ),
                recommendation=recommendation,
                destination_module="agenda",
                destination_path="/agenda/dashboard",
                action_label="Abrir Dashboard",
                value=score,
                value_unit="percent",
                source_indicator="operational_score",
            ),
        )

    @staticmethod
    def _append_legacy_insights(
        insights: list[dict[str, Any]],
        context: EngineContext,
        indicators: dict[str, Any],
    ) -> None:
        """
        Mantém compatibilidade temporária com o contrato inicial.

        Os insights antigos somente são adicionados quando o novo
        contrato operacional não está presente.
        """

        has_operational_contract = any(
            indicator_name in indicators
            for indicator_name in {
                "execution_rate",
                "evidence_coverage_rate",
                "objective_coverage_rate",
                "planning_execution_rate",
                "operational_score",
            }
        )

        if has_operational_contract:
            return

        evidence_index = InsightEngine._percentage_value(
            indicators.get(
                "evidence_index",
            ),
        )

        training_index = InsightEngine._percentage_value(
            indicators.get(
                "training_index",
            ),
        )

        agenda_usage_index = InsightEngine._percentage_value(
            indicators.get(
                "agenda_usage_index",
            ),
        )

        if evidence_index < 50:
            insights.append(
                InsightEngine._build_insight(
                    context=context,
                    code="legacy.low_evidence_index",
                    insight_type="evidence",
                    severity=InsightEngine.WARNING_SEVERITY,
                    priority=InsightEngine.MEDIUM_PRIORITY,
                    title="Baixo registro de evidências",
                    description=(
                        "O índice de evidências está abaixo do nível "
                        "esperado no contrato inicial do motor."
                    ),
                    recommendation=(
                        "Amplie os registros pedagógicos antes de avançar "
                        "para análises mais detalhadas."
                    ),
                    destination_module="agenda",
                    destination_path="/agenda/evidencias",
                    action_label="Abrir evidências",
                    value=evidence_index,
                    value_unit="percent",
                    source_indicator="evidence_index",
                    legacy=True,
                ),
            )

        if training_index < 60:
            insights.append(
                InsightEngine._build_insight(
                    context=context,
                    code="legacy.low_training_index",
                    insight_type="training",
                    severity=InsightEngine.OPPORTUNITY_SEVERITY,
                    priority=InsightEngine.LOW_PRIORITY,
                    title="Oportunidade de formação continuada",
                    description=(
                        "O índice de participação em formações está "
                        "abaixo do parâmetro inicial do motor."
                    ),
                    recommendation=(
                        "Considere trilhas formativas compatíveis com as "
                        "necessidades identificadas."
                    ),
                    destination_module="academy",
                    destination_path="/academy",
                    action_label="Abrir Academy",
                    value=training_index,
                    value_unit="percent",
                    source_indicator="training_index",
                    legacy=True,
                ),
            )

        if agenda_usage_index < 70:
            insights.append(
                InsightEngine._build_insight(
                    context=context,
                    code="legacy.low_agenda_usage",
                    insight_type="usage",
                    severity=InsightEngine.ATTENTION_SEVERITY,
                    priority=InsightEngine.LOW_PRIORITY,
                    title="Uso reduzido da Agenda Inteligente",
                    description=(
                        "O índice inicial de uso da Agenda está abaixo "
                        "do parâmetro de referência."
                    ),
                    recommendation=(
                        "Estimule registros regulares de planejamento, "
                        "aulas e evidências."
                    ),
                    destination_module="agenda",
                    destination_path="/agenda/dashboard",
                    action_label="Abrir Agenda",
                    value=agenda_usage_index,
                    value_unit="percent",
                    source_indicator="agenda_usage_index",
                    legacy=True,
                ),
            )

    @staticmethod
    def _build_insight(
        context: EngineContext,
        code: str,
        insight_type: str,
        severity: str,
        priority: str,
        title: str,
        description: str,
        recommendation: str,
        destination_module: str,
        destination_path: str,
        action_label: str,
        value: int | float,
        source_indicator: str,
        related_record_type: str | None = None,
        related_record_ids: list[str] | None = None,
        value_unit: str = "count",
        legacy: bool = False,
    ) -> dict[str, Any]:
        module = (
            context.module
            or "platform"
        )

        return {
            "code": code,
            "type": insight_type,
            "severity": severity,
            "priority": priority,
            "title": title,
            "description": description,
            "recommendation": recommendation,
            "value": value,
            "value_unit": value_unit,
            "source": {
                "engine": "analytics",
                "indicator": source_indicator,
                "module": module,
                "legacy": legacy,
            },
            "destination": {
                "module": destination_module,
                "path": destination_path,
                "action_label": action_label,
            },
            "related_records": {
                "type": related_record_type,
                "ids": (
                    related_record_ids
                    or []
                ),
                "total": len(
                    related_record_ids
                    or [],
                ),
            },
        }

    @staticmethod
    def _sort_insights(
        insights: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        severity_order = {
            InsightEngine.CRITICAL_SEVERITY: 0,
            InsightEngine.WARNING_SEVERITY: 1,
            InsightEngine.ATTENTION_SEVERITY: 2,
            InsightEngine.OPPORTUNITY_SEVERITY: 3,
            InsightEngine.POSITIVE_SEVERITY: 4,
        }

        priority_order = {
            InsightEngine.HIGH_PRIORITY: 0,
            InsightEngine.MEDIUM_PRIORITY: 1,
            InsightEngine.LOW_PRIORITY: 2,
        }

        return sorted(
            insights,
            key=lambda insight: (
                severity_order.get(
                    str(
                        insight.get(
                            "severity",
                            "",
                        ),
                    ),
                    99,
                ),
                priority_order.get(
                    str(
                        insight.get(
                            "priority",
                            "",
                        ),
                    ),
                    99,
                ),
                str(
                    insight.get(
                        "code",
                        "",
                    ),
                ),
            ),
        )

    @staticmethod
    def _count_by_severity(
        insights: list[dict[str, Any]],
        severity: str,
    ) -> int:
        return sum(
            1
            for insight in insights
            if insight.get(
                "severity",
            )
            == severity
        )

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
    def _percentage_value(
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
                100.0,
            ),
            2,
        )

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