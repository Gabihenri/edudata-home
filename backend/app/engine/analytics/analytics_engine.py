from typing import Any

from app.engine.context import EngineContext


class AnalyticsEngine:
    """
    Motor analítico oficial do EDI Intelligence Engine.

    Responsabilidades:

    - transformar dados operacionais em indicadores estruturados;
    - preservar compatibilidade com o contrato inicial do motor;
    - produzir resultados determinísticos e auditáveis;
    - não gerar recomendações ou interpretações textuais;
    - não acessar diretamente banco, APIs ou serviços externos.

    O AnalyticsEngine recebe dados já autorizados e preparados
    pelo produto consumidor.
    """

    COMPLETED_LESSON_STATUSES = {
        "realizada",
        "parcialmente_realizada",
    }

    ACTIVE_LESSON_STATUSES = {
        "planejada",
        "em_preparacao",
        "reagendada",
    }

    CANCELLED_LESSON_STATUSES = {
        "cancelada",
    }

    INACTIVE_OBJECTIVE_STATUSES = {
        "arquivado",
        "cancelado",
    }

    OPERATIONAL_SCORE_DIMENSIONS = (
        "execution",
        "evidence_coverage",
        "objective_coverage",
        "planning_execution",
    )

    @staticmethod
    def summarize(
        context: EngineContext,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Consolida os dados recebidos e calcula indicadores EDI.

        Contrato operacional principal:

        - planning
        - objectives
        - lessons
        - evidences

        Compatibilidade temporária:

        - agenda_events
        - users
        - trainings

        Regra metodológica do Score Operacional:

        Uma dimensão sem base observável não representa desempenho
        zero. Por isso, o score é calculado somente com indicadores
        que possuem denominador válido. A cobertura da análise informa
        separadamente quantas dimensões já possuem dados suficientes.
        """

        planning = AnalyticsEngine._as_record_list(
            payload.get("planning"),
        )
        objectives = AnalyticsEngine._as_record_list(
            payload.get("objectives"),
        )
        lessons = AnalyticsEngine._as_record_list(
            payload.get("lessons"),
        )
        evidences = AnalyticsEngine._as_record_list(
            payload.get("evidences"),
        )
        agenda_events = AnalyticsEngine._as_record_list(
            payload.get("agenda_events"),
        )
        users = AnalyticsEngine._as_record_list(
            payload.get("users"),
        )
        trainings = AnalyticsEngine._as_record_list(
            payload.get("trainings"),
        )

        active_objectives = [
            objective
            for objective in objectives
            if AnalyticsEngine._normalized_text(
                objective.get("status"),
            ) not in AnalyticsEngine.INACTIVE_OBJECTIVE_STATUSES
        ]

        completed_lessons = [
            lesson
            for lesson in lessons
            if AnalyticsEngine._normalized_text(
                lesson.get("status"),
            ) in AnalyticsEngine.COMPLETED_LESSON_STATUSES
        ]

        active_lessons = [
            lesson
            for lesson in lessons
            if AnalyticsEngine._normalized_text(
                lesson.get("status"),
            ) in AnalyticsEngine.ACTIVE_LESSON_STATUSES
        ]

        cancelled_lessons = [
            lesson
            for lesson in lessons
            if AnalyticsEngine._normalized_text(
                lesson.get("status"),
            ) in AnalyticsEngine.CANCELLED_LESSON_STATUSES
        ]

        non_cancelled_lessons = [
            lesson
            for lesson in lessons
            if AnalyticsEngine._normalized_text(
                lesson.get("status"),
            ) not in AnalyticsEngine.CANCELLED_LESSON_STATUSES
        ]

        lesson_ids_with_evidence = (
            AnalyticsEngine._collect_identifier_set(
                evidences,
                "lesson_id",
            )
        )
        objective_ids_with_evidence = (
            AnalyticsEngine._collect_identifier_set(
                evidences,
                "objective_id",
            )
        )
        planning_ids_with_lessons = (
            AnalyticsEngine._collect_identifier_set(
                lessons,
                "planning_id",
            )
        )

        completed_lessons_with_evidence = [
            lesson
            for lesson in completed_lessons
            if AnalyticsEngine._identifier(
                lesson.get("id"),
            ) in lesson_ids_with_evidence
        ]
        completed_lessons_without_evidence = [
            lesson
            for lesson in completed_lessons
            if AnalyticsEngine._identifier(
                lesson.get("id"),
            ) not in lesson_ids_with_evidence
        ]
        objectives_with_evidence = [
            objective
            for objective in active_objectives
            if AnalyticsEngine._identifier(
                objective.get("id"),
            ) in objective_ids_with_evidence
        ]
        objectives_without_evidence = [
            objective
            for objective in active_objectives
            if AnalyticsEngine._identifier(
                objective.get("id"),
            ) not in objective_ids_with_evidence
        ]
        planning_with_lessons = [
            planning_item
            for planning_item in planning
            if AnalyticsEngine._identifier(
                planning_item.get("id"),
            ) in planning_ids_with_lessons
        ]
        planning_without_lessons = [
            planning_item
            for planning_item in planning
            if AnalyticsEngine._identifier(
                planning_item.get("id"),
            ) not in planning_ids_with_lessons
        ]

        evidences_without_objective = [
            evidence
            for evidence in evidences
            if not AnalyticsEngine._identifier(
                evidence.get("objective_id"),
            )
        ]
        evidences_without_lesson = [
            evidence
            for evidence in evidences
            if not AnalyticsEngine._identifier(
                evidence.get("lesson_id"),
            )
        ]
        protected_evidences = [
            evidence
            for evidence in evidences
            if AnalyticsEngine._has_protected_file(
                evidence,
            )
        ]
        evidences_with_identifiable_minor = [
            evidence
            for evidence in evidences
            if evidence.get(
                "contains_identifiable_minor",
            ) is True
        ]

        pending_items = (
            len(completed_lessons_without_evidence)
            + len(objectives_without_evidence)
            + len(planning_without_lessons)
            + len(evidences_without_objective)
        )

        execution_rate = AnalyticsEngine._percentage(
            len(completed_lessons),
            len(non_cancelled_lessons),
        )
        evidence_coverage_rate = AnalyticsEngine._percentage(
            len(completed_lessons_with_evidence),
            len(completed_lessons),
        )
        objective_coverage_rate = AnalyticsEngine._percentage(
            len(objectives_with_evidence),
            len(active_objectives),
        )
        planning_execution_rate = AnalyticsEngine._percentage(
            len(planning_with_lessons),
            len(planning),
        )
        evidence_objective_link_rate = AnalyticsEngine._percentage(
            len(evidences) - len(evidences_without_objective),
            len(evidences),
        )
        evidence_lesson_link_rate = AnalyticsEngine._percentage(
            len(evidences) - len(evidences_without_lesson),
            len(evidences),
        )

        score_dimensions = AnalyticsEngine._available_score_dimensions(
            execution_rate=execution_rate,
            execution_total=len(non_cancelled_lessons),
            evidence_coverage_rate=evidence_coverage_rate,
            evidence_coverage_total=len(completed_lessons),
            objective_coverage_rate=objective_coverage_rate,
            objective_coverage_total=len(active_objectives),
            planning_execution_rate=planning_execution_rate,
            planning_execution_total=len(planning),
        )
        operational_score = AnalyticsEngine._average_percentage(
            list(score_dimensions.values()),
        )
        analyzed_dimensions_count = len(score_dimensions)
        total_score_dimensions = len(
            AnalyticsEngine.OPERATIONAL_SCORE_DIMENSIONS,
        )
        analysis_coverage_rate = AnalyticsEngine._percentage(
            analyzed_dimensions_count,
            total_score_dimensions,
        )
        analysis_status = AnalyticsEngine._analysis_status(
            analyzed_dimensions_count,
            total_score_dimensions,
        )

        legacy_evidence_index = AnalyticsEngine._percentage(
            len(evidences),
            len(agenda_events),
        )
        legacy_training_index = AnalyticsEngine._percentage(
            len(trainings),
            len(users),
        )
        legacy_agenda_usage_index = AnalyticsEngine._score_count(
            len(agenda_events),
            target=100,
        )

        return {
            "context": context.to_dict(),
            "contract": {
                "engine": "edi-intelligence",
                "module": context.module or "platform",
                "version": "agenda-operational-v2",
                "deterministic": True,
                "generative_ai_used": False,
            },
            "summary": {
                "total_planning": len(planning),
                "total_objectives": len(objectives),
                "total_active_objectives": len(active_objectives),
                "total_lessons": len(lessons),
                "total_active_lessons": len(active_lessons),
                "total_completed_lessons": len(completed_lessons),
                "total_cancelled_lessons": len(cancelled_lessons),
                "total_evidences": len(evidences),
                "total_pending_items": pending_items,
                "total_protected_evidences": len(protected_evidences),
                "total_evidences_with_identifiable_minor": len(
                    evidences_with_identifiable_minor,
                ),
                "total_score_dimensions": total_score_dimensions,
                "total_analyzed_score_dimensions": analyzed_dimensions_count,
                "total_agenda_events": len(agenda_events),
                "total_users": len(users),
                "total_trainings": len(trainings),
            },
            "edi_indicators": {
                "execution_rate": execution_rate,
                "evidence_coverage_rate": evidence_coverage_rate,
                "objective_coverage_rate": objective_coverage_rate,
                "planning_execution_rate": planning_execution_rate,
                "evidence_objective_link_rate": evidence_objective_link_rate,
                "evidence_lesson_link_rate": evidence_lesson_link_rate,
                "operational_score": operational_score,
                "analysis_coverage_rate": analysis_coverage_rate,
                "analysis_status": analysis_status,
                "score_dimensions": score_dimensions,
                "evidence_index": legacy_evidence_index,
                "training_index": legacy_training_index,
                "agenda_usage_index": legacy_agenda_usage_index,
            },
            "operational_findings": {
                "completed_lessons_without_evidence": len(
                    completed_lessons_without_evidence,
                ),
                "active_objectives_without_evidence": len(
                    objectives_without_evidence,
                ),
                "planning_without_lessons": len(planning_without_lessons),
                "evidences_without_objective": len(
                    evidences_without_objective,
                ),
                "evidences_without_lesson": len(
                    evidences_without_lesson,
                ),
                "completed_lessons_with_evidence": len(
                    completed_lessons_with_evidence,
                ),
                "objectives_with_evidence": len(objectives_with_evidence),
                "planning_with_lessons": len(planning_with_lessons),
            },
            "references": {
                "completed_lesson_ids_without_evidence": (
                    AnalyticsEngine._collect_ids(
                        completed_lessons_without_evidence,
                    )
                ),
                "objective_ids_without_evidence": (
                    AnalyticsEngine._collect_ids(
                        objectives_without_evidence,
                    )
                ),
                "planning_ids_without_lessons": (
                    AnalyticsEngine._collect_ids(
                        planning_without_lessons,
                    )
                ),
                "evidence_ids_without_objective": (
                    AnalyticsEngine._collect_ids(
                        evidences_without_objective,
                    )
                ),
                "evidence_ids_without_lesson": (
                    AnalyticsEngine._collect_ids(
                        evidences_without_lesson,
                    )
                ),
            },
        }

    @staticmethod
    def _available_score_dimensions(
        *,
        execution_rate: float,
        execution_total: int,
        evidence_coverage_rate: float,
        evidence_coverage_total: int,
        objective_coverage_rate: float,
        objective_coverage_total: int,
        planning_execution_rate: float,
        planning_execution_total: int,
    ) -> dict[str, float]:
        """
        Retorna somente dimensões que possuem base observável.

        Ausência de registros não deve reduzir artificialmente o
        Score Operacional. Zero é um resultado válido apenas quando
        existe uma base para avaliação e nenhum item atende ao critério.
        """

        dimensions: dict[str, tuple[float, int]] = {
            "execution": (
                execution_rate,
                execution_total,
            ),
            "evidence_coverage": (
                evidence_coverage_rate,
                evidence_coverage_total,
            ),
            "objective_coverage": (
                objective_coverage_rate,
                objective_coverage_total,
            ),
            "planning_execution": (
                planning_execution_rate,
                planning_execution_total,
            ),
        }

        return {
            name: rate
            for name, (rate, total) in dimensions.items()
            if total > 0
        }

    @staticmethod
    def _analysis_status(
        analyzed_dimensions: int,
        total_dimensions: int,
    ) -> str:
        if analyzed_dimensions <= 0:
            return "insufficient_data"

        if analyzed_dimensions < total_dimensions:
            return "partial"

        return "complete"

    @staticmethod
    def _as_record_list(
        value: Any,
    ) -> list[dict[str, Any]]:
        """
        Retorna somente registros válidos.

        O motor não interrompe toda a análise quando o payload
        contém itens inválidos; esses itens são ignorados.
        """

        if not isinstance(value, list):
            return []

        return [
            item
            for item in value
            if isinstance(item, dict)
        ]

    @staticmethod
    def _normalized_text(
        value: Any,
    ) -> str:
        if not isinstance(value, str):
            return ""

        return value.strip().lower()

    @staticmethod
    def _identifier(
        value: Any,
    ) -> str:
        if not isinstance(value, str):
            return ""

        return value.strip()

    @staticmethod
    def _collect_identifier_set(
        records: list[dict[str, Any]],
        field_name: str,
    ) -> set[str]:
        return {
            identifier
            for record in records
            if (
                identifier
                := AnalyticsEngine._identifier(
                    record.get(field_name),
                )
            )
        }

    @staticmethod
    def _collect_ids(
        records: list[dict[str, Any]],
    ) -> list[str]:
        identifiers = [
            identifier
            for record in records
            if (
                identifier
                := AnalyticsEngine._identifier(
                    record.get("id"),
                )
            )
        ]

        return list(dict.fromkeys(identifiers))

    @staticmethod
    def _has_protected_file(
        evidence: dict[str, Any],
    ) -> bool:
        storage_bucket = AnalyticsEngine._identifier(
            evidence.get("storage_bucket"),
        )
        storage_path = AnalyticsEngine._identifier(
            evidence.get("storage_path"),
        )

        return bool(storage_bucket and storage_path)

    @staticmethod
    def _percentage(
        value: int,
        total: int,
    ) -> float:
        if total <= 0:
            return 0.0

        percentage = (value / total) * 100

        return round(
            min(
                max(percentage, 0.0),
                100.0,
            ),
            2,
        )

    @staticmethod
    def _average_percentage(
        values: list[float],
    ) -> float:
        valid_values = [
            value
            for value in values
            if isinstance(value, (int, float))
        ]

        if not valid_values:
            return 0.0

        average = sum(valid_values) / len(valid_values)

        return round(
            min(
                max(average, 0.0),
                100.0,
            ),
            2,
        )

    @staticmethod
    def _score_count(
        value: int,
        target: int,
    ) -> float:
        if target <= 0:
            return 0.0

        score = (value / target) * 100

        return round(
            min(
                max(score, 0.0),
                100.0,
            ),
            2,
        )