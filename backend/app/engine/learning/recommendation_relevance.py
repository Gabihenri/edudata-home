from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Iterable


@dataclass(frozen=True)
class RecommendationSurfaceDecision:
    """Decisão explicável para evitar ruído e repetição na Agenda EDI."""

    should_surface: bool
    reason: str


class RecommendationRelevancePolicy:
    """
    Aplica o princípio de relevância da Agenda Inteligente EDI.

    A política não cria recomendações. Ela decide se uma recomendação já gerada
    possui novidade e contexto suficientes para voltar a interromper o usuário.
    """

    DEFAULT_COOLDOWN_HOURS = 24

    @classmethod
    def decide(
        cls,
        recommendation: dict[str, Any],
        recent_feedback: Iterable[dict[str, Any]],
        *,
        now: datetime | None = None,
    ) -> RecommendationSurfaceDecision:
        recommendation_type = cls._text(recommendation.get("recommendation_type"))
        if not recommendation_type:
            return RecommendationSurfaceDecision(True, "Sem histórico comparável; recomendação disponível no padrão EDI.")

        now = now or datetime.now(timezone.utc)
        matching = [
            event for event in recent_feedback
            if cls._text(event.get("recommendation_type")) == recommendation_type
        ]
        if not matching:
            return RecommendationSurfaceDecision(True, "Novo contexto para este tipo de recomendação.")

        latest = max(matching, key=cls._event_time)
        latest_time = cls._event_time(latest)
        outcome = cls._text(latest.get("outcome"))
        result = cls._text(latest.get("result"))

        if outcome in {"rejected", "ignored"} or result == "negative":
            return RecommendationSurfaceDecision(False, "Silenciada temporariamente para evitar repetição após feedback de baixa utilidade.")

        if now - latest_time < timedelta(hours=cls.DEFAULT_COOLDOWN_HOURS):
            return RecommendationSurfaceDecision(False, "Adiada para evitar repetição recente sem nova evidência de contexto.")

        return RecommendationSurfaceDecision(True, "Pode reaparecer porque há novo intervalo de contexto e nenhuma rejeição recente.")

    @staticmethod
    def _text(value: Any) -> str | None:
        return value.strip() if isinstance(value, str) and value.strip() else None

    @staticmethod
    def _event_time(event: dict[str, Any]) -> datetime:
        value = event.get("created_at") or event.get("timestamp")
        if isinstance(value, datetime):
            return value.astimezone(timezone.utc) if value.tzinfo else value.replace(tzinfo=timezone.utc)
        if isinstance(value, str):
            try:
                parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
                return parsed.astimezone(timezone.utc) if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
            except ValueError:
                pass
        return datetime.min.replace(tzinfo=timezone.utc)
