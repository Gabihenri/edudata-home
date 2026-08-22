from __future__ import annotations

from collections import Counter
from typing import Any

from app.engine.context import EngineContext


class LearningEngine:
    """
    Motor de Aprendizagem Contínua do EDI Intelligence Engine.

    A versão 2 transforma feedback operacional em sinais estruturados
    que podem alimentar a futura camada de Machine Learning.

    O motor permanece determinístico e não treina um modelo dentro da
    requisição. Ele normaliza feedback, calcula métricas e produz features
    agregadas para persistência e treinamento posterior.
    """

    VALID_OUTCOMES = {
        "accepted", "rejected", "ignored", "edited",
        "executed", "positive", "neutral", "negative",
    }

    @classmethod
    def learn(
        cls,
        context: EngineContext,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        interactions = cls._as_list(payload.get("interactions"))
        recommendations = cls._as_list(payload.get("recommendations"))
        accepted = cls._non_negative_integer(
            payload.get("accepted_recommendations", 0)
        )

        feedback = cls._normalize_feedback(interactions)
        recommendation_count = len(recommendations)
        acceptance_rate = (
            round((accepted / recommendation_count) * 100, 2)
            if recommendation_count
            else 0.0
        )

        return {
            "context": context.to_dict(),
            "learning": {
                "version": "learning-v2",
                "total_interactions": len(interactions),
                "recommendations_generated": recommendation_count,
                "recommendations_accepted": accepted,
                "acceptance_rate": acceptance_rate,
                "feedback_events": len(feedback),
                "feedback_outcomes": dict(
                    Counter(item["outcome"] for item in feedback)
                ),
                "features": cls._build_features(feedback),
                "ready_for_training": bool(feedback),
            },
        }

    @classmethod
    def _normalize_feedback(
        cls,
        interactions: list[Any],
    ) -> list[dict[str, Any]]:
        normalized: list[dict[str, Any]] = []

        for item in interactions:
            if not isinstance(item, dict):
                continue

            outcome = cls._normalize_outcome(item)
            if outcome is None:
                continue

            normalized.append(
                {
                    "recommendation_id": cls._optional_text(
                        item.get("recommendation_id")
                    ),
                    "outcome": outcome,
                    "recommendation_type": cls._optional_text(
                        item.get("recommendation_type")
                    ),
                    "module": cls._optional_text(item.get("module")) or "agenda",
                    "context_type": cls._optional_text(item.get("context_type")),
                    "executed": cls._optional_bool(item.get("executed")),
                    "result": cls._normalize_result(item.get("result")),
                }
            )

        return normalized

    @classmethod
    def _build_features(
        cls,
        feedback: list[dict[str, Any]],
    ) -> dict[str, Any]:
        if not feedback:
            return {
                "sample_count": 0,
                "execution_rate": 0.0,
                "positive_result_rate": 0.0,
                "recommendation_type_counts": {},
            }

        executed = sum(item["executed"] is True for item in feedback)
        positive = sum(item["result"] == "positive" for item in feedback)
        recommendation_types = Counter(
            item["recommendation_type"]
            for item in feedback
            if item["recommendation_type"]
        )

        return {
            "sample_count": len(feedback),
            "execution_rate": round((executed / len(feedback)) * 100, 2),
            "positive_result_rate": round((positive / len(feedback)) * 100, 2),
            "recommendation_type_counts": dict(recommendation_types),
        }

    @classmethod
    def _normalize_outcome(cls, item: dict[str, Any]) -> str | None:
        outcome = cls._optional_text(item.get("outcome"))
        if outcome in cls.VALID_OUTCOMES:
            return outcome

        if item.get("accepted") is True:
            return "accepted"
        if item.get("accepted") is False:
            return "rejected"
        if item.get("ignored") is True:
            return "ignored"
        if item.get("edited") is True:
            return "edited"
        if item.get("executed") is True:
            return "executed"

        return None

    @staticmethod
    def _normalize_result(value: Any) -> str | None:
        result = LearningEngine._optional_text(value)
        if result in {"positive", "neutral", "negative"}:
            return result
        return None

    @staticmethod
    def _optional_text(value: Any) -> str | None:
        if isinstance(value, str) and value.strip():
            return value.strip()
        return None

    @staticmethod
    def _optional_bool(value: Any) -> bool | None:
        return value if isinstance(value, bool) else None

    @staticmethod
    def _non_negative_integer(value: Any) -> int:
        if isinstance(value, bool):
            return 0
        if isinstance(value, int):
            return max(value, 0)
        if isinstance(value, float):
            return max(int(value), 0)
        return 0

    @staticmethod
    def _as_list(value: Any) -> list[Any]:
        return value if isinstance(value, list) else []
