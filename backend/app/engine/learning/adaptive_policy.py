from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from typing import Any, Iterable


@dataclass(frozen=True)
class AdaptiveRecommendationScore:
    """Pontuação determinística e explicável para recomendações da Agenda EDI."""

    recommendation_id: str | None
    recommendation_type: str | None
    score: float
    priority: str
    reason: str
    sample_count: int


class AdaptiveRecommendationPolicy:
    """
    Camada inicial de inteligência adaptativa da Agenda EDI.

    Não utiliza ML treinável. Ela transforma o histórico de feedback do próprio
    usuário em uma pontuação explicável para priorizar, reduzir ou silenciar
    recomendações antes de apresentá-las.
    """

    MIN_SAMPLES_FOR_STRONG_ADAPTATION = 3
    HIGH_PRIORITY_THRESHOLD = 60.0
    LOW_PRIORITY_THRESHOLD = 40.0

    @classmethod
    def rank(
        cls,
        recommendations: Iterable[dict[str, Any]],
        feedback_events: Iterable[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        events_by_type = cls._group_events(feedback_events)
        ranked: list[dict[str, Any]] = []

        for recommendation in recommendations:
            if not isinstance(recommendation, dict):
                continue

            recommendation_type = cls._optional_text(
                recommendation.get("recommendation_type")
            )
            events = events_by_type.get(recommendation_type or "", [])
            score = cls._score(events)
            priority = cls._priority(score, len(events))
            reason = cls._reason(events, priority)

            enriched = dict(recommendation)
            enriched["adaptive"] = {
                "score": score,
                "priority": priority,
                "reason": reason,
                "sample_count": len(events),
            }
            ranked.append(enriched)

        return sorted(
            ranked,
            key=lambda item: item["adaptive"]["score"],
            reverse=True,
        )

    @classmethod
    def should_surface(cls, recommendation: dict[str, Any]) -> bool:
        adaptive = recommendation.get("adaptive")
        if not isinstance(adaptive, dict):
            return True
        return adaptive.get("priority") != "suppress"

    @classmethod
    def _group_events(
        cls,
        feedback_events: Iterable[dict[str, Any]],
    ) -> dict[str, list[dict[str, Any]]]:
        grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for event in feedback_events:
            if not isinstance(event, dict):
                continue
            recommendation_type = cls._optional_text(
                event.get("recommendation_type")
            )
            if recommendation_type:
                grouped[recommendation_type].append(event)
        return grouped

    @classmethod
    def _score(cls, events: list[dict[str, Any]]) -> float:
        if not events:
            return 50.0

        weights = {
            "accepted": 1.0,
            "executed": 1.5,
            "positive": 2.0,
            "edited": 0.5,
            "neutral": 0.0,
            "ignored": -1.0,
            "rejected": -2.0,
            "negative": -2.0,
        }
        total = 0.0
        for event in events:
            outcome = cls._optional_text(event.get("outcome"))
            result = cls._optional_text(event.get("result"))
            if outcome:
                total += weights.get(outcome, 0.0)
            if result:
                total += weights.get(result, 0.0)

        max_positive = max(len(events) * 3.5, 1.0)
        normalized = 50.0 + (total / max_positive) * 50.0
        return round(max(0.0, min(100.0, normalized)), 2)

    @classmethod
    def _priority(cls, score: float, sample_count: int) -> str:
        if sample_count < cls.MIN_SAMPLES_FOR_STRONG_ADAPTATION:
            return "standard"
        if score >= cls.HIGH_PRIORITY_THRESHOLD:
            return "prioritize"
        if score <= cls.LOW_PRIORITY_THRESHOLD:
            return "suppress"
        return "standard"

    @staticmethod
    def _reason(events: list[dict[str, Any]], priority: str) -> str:
        if not events:
            return "Sem histórico suficiente; recomendação exibida no padrão EDI."
        if priority == "prioritize":
            return "Priorizada com base no seu histórico de uso e resultados positivos."
        if priority == "suppress":
            return "Reduzida porque feedbacks anteriores indicam baixa utilidade para você."
        return "Mantida no padrão porque o histórico ainda não indica uma preferência forte."

    @staticmethod
    def _optional_text(value: Any) -> str | None:
        if isinstance(value, str) and value.strip():
            return value.strip()
        return None
