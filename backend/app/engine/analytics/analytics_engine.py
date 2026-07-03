from typing import Any

from app.engine.context import EngineContext


class AnalyticsEngine:
    """
    Motor inicial de inteligência analítica da EduData IA.
    """

    @staticmethod
    def summarize(
        context: EngineContext,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        agenda_events = payload.get("agenda_events", [])
        evidences = payload.get("evidences", [])
        users = payload.get("users", [])
        trainings = payload.get("trainings", [])

        return {
            "context": context.to_dict(),
            "summary": {
                "total_agenda_events": len(agenda_events),
                "total_evidences": len(evidences),
                "total_users": len(users),
                "total_trainings": len(trainings),
            },
            "edi_indicators": {
                "evidence_index": AnalyticsEngine._percentage(
                    len(evidences),
                    len(agenda_events),
                ),
                "training_index": AnalyticsEngine._percentage(
                    len(trainings),
                    len(users),
                ),
                "agenda_usage_index": AnalyticsEngine._score_count(
                    len(agenda_events),
                    target=100,
                ),
            },
        }

    @staticmethod
    def _percentage(
        value: int,
        total: int,
    ) -> float:
        if total <= 0:
            return 0.0

        return round((value / total) * 100, 2)

    @staticmethod
    def _score_count(
        value: int,
        target: int,
    ) -> float:
        if target <= 0:
            return 0.0

        return round(min((value / target) * 100, 100), 2)
