from typing import Any

from app.engine.context import EngineContext


class TeacherProfileEngine:
    """
    Motor de Perfil Inteligente Docente.
    """

    @staticmethod
    def analyze(
        context: EngineContext,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        agenda_events = payload.get("agenda_events", [])
        evidences = payload.get("evidences", [])
        trainings = payload.get("trainings", [])
        actions = payload.get("actions", [])
        analytics = payload.get("analytics", {})

        agenda_score = TeacherProfileEngine._score_count(len(agenda_events), 20)
        evidence_score = TeacherProfileEngine._score_count(len(evidences), 10)
        training_score = TeacherProfileEngine._score_count(len(trainings), 5)
        action_score = TeacherProfileEngine._score_count(len(actions), 15)

        governance_score = TeacherProfileEngine._safe_number(
            analytics.get("governance_score"),
            0,
        )

        edi_score = round(
            (
                agenda_score
                + evidence_score
                + training_score
                + action_score
                + governance_score
            )
            / 5,
            2,
        )

        return {
            "context": context.to_dict(),
            "teacher_profile": {
                "agenda_score": agenda_score,
                "evidence_score": evidence_score,
                "training_score": training_score,
                "action_score": action_score,
                "governance_score": governance_score,
                "edi_score": edi_score,
                "level": TeacherProfileEngine._level(edi_score),
                "summary": TeacherProfileEngine._summary(edi_score),
            },
            "recommendations": TeacherProfileEngine._recommendations(
                agenda_score,
                evidence_score,
                training_score,
                action_score,
                governance_score,
            ),
        }

    @staticmethod
    def _score_count(value: int, target: int) -> float:
        if target <= 0:
            return 0.0

        return round(min((value / target) * 100, 100), 2)

    @staticmethod
    def _safe_number(value: Any, default: float = 0.0) -> float:
        try:
            return float(value)
        except Exception:
            return default

    @staticmethod
    def _level(score: float) -> str:
        if score >= 85:
            return "avançado"

        if score >= 60:
            return "intermediário"

        if score >= 30:
            return "em desenvolvimento"

        return "inicial"

    @staticmethod
    def _summary(score: float) -> str:
        if score >= 85:
            return "Perfil docente consolidado, com forte aderência ao Framework EDI."

        if score >= 60:
            return "Perfil docente em evolução consistente, com boas práticas registradas."

        if score >= 30:
            return "Perfil docente em desenvolvimento, com necessidade de ampliar registros e evidências."

        return "Perfil inicial, com baixa presença de dados pedagógicos estruturados."

    @staticmethod
    def _recommendations(
        agenda_score: float,
        evidence_score: float,
        training_score: float,
        action_score: float,
        governance_score: float,
    ) -> list[dict[str, Any]]:
        recommendations = []

        if agenda_score < 60:
            recommendations.append({
                "type": "agenda",
                "priority": "medium",
                "title": "Ampliar uso da Agenda Inteligente",
                "message": "Registre planejamentos, eventos e rotinas pedagógicas com maior frequência.",
            })

        if evidence_score < 60:
            recommendations.append({
                "type": "evidence",
                "priority": "high",
                "title": "Fortalecer registro de evidências",
                "message": "Inclua evidências pedagógicas para sustentar decisões pelo Framework EDI.",
            })

        if training_score < 60:
            recommendations.append({
                "type": "training",
                "priority": "medium",
                "title": "Avançar na formação continuada",
                "message": "Concluir trilhas da EduData Academy ajudará no desenvolvimento profissional.",
            })

        if action_score < 60:
            recommendations.append({
                "type": "action",
                "priority": "medium",
                "title": "Registrar ações pedagógicas",
                "message": "Documente ações realizadas para melhorar o acompanhamento do desenvolvimento docente.",
            })

        if governance_score < 60:
            recommendations.append({
                "type": "governance",
                "priority": "low",
                "title": "Aprimorar organização institucional",
                "message": "Melhore a documentação e o acompanhamento para fortalecer indicadores de governança.",
            })

        return recommendations