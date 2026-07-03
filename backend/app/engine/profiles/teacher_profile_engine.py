from typing import Any

from app.engine.context import EngineContext


class TeacherProfileEngine:
    """
    Motor inicial de Perfil Inteligente Docente.

    Calcula indicadores básicos do professor a partir de dados da plataforma.
    """

    @staticmethod
    def analyze(
        context: EngineContext,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        agenda_events = payload.get("agenda_events", [])
        evidences = payload.get("evidences", [])
        trainings = payload.get("trainings", [])

        agenda_score = TeacherProfileEngine._score_count(
            len(agenda_events),
            target=20,
        )

        evidence_score = TeacherProfileEngine._score_count(
            len(evidences),
            target=10,
        )

        training_score = TeacherProfileEngine._score_count(
            len(trainings),
            target=5,
        )

        edi_score = round(
            (agenda_score + evidence_score + training_score) / 3,
            2,
        )

        return {
            "context": context.to_dict(),
            "teacher_profile": {
                "agenda_score": agenda_score,
                "evidence_score": evidence_score,
                "training_score": training_score,
                "edi_score": edi_score,
                "level": TeacherProfileEngine._level(edi_score),
            },
            "recommendations": TeacherProfileEngine._recommendations(
                agenda_score,
                evidence_score,
                training_score,
            ),
        }

    @staticmethod
    def _score_count(
        value: int,
        target: int,
    ) -> float:
        if target <= 0:
            return 0

        score = (value / target) * 100

        return round(min(score, 100), 2)

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
    def _recommendations(
        agenda_score: float,
        evidence_score: float,
        training_score: float,
    ) -> list[dict[str, Any]]:
        recommendations = []

        if agenda_score < 60:
            recommendations.append(
                {
                    "type": "agenda",
                    "priority": "medium",
                    "title": "Ampliar uso da Agenda Inteligente",
                    "message": "Registre planejamentos e eventos com maior frequência para fortalecer a organização pedagógica.",
                }
            )

        if evidence_score < 60:
            recommendations.append(
                {
                    "type": "evidence",
                    "priority": "high",
                    "title": "Registrar mais evidências",
                    "message": "Inclua evidências pedagógicas para alimentar o Framework EDI e melhorar o perfil docente.",
                }
            )

        if training_score < 60:
            recommendations.append(
                {
                    "type": "training",
                    "priority": "medium",
                    "title": "Avançar na formação continuada",
                    "message": "Concluir trilhas da EduData Academy ajudará a fortalecer o desenvolvimento profissional.",
                }
            )

        return recommendations
