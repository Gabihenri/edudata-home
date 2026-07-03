from typing import Any

from app.engine.context import EngineContext


class RecommendationEngine:
    """
    Motor inicial de recomendações da EduData IA.

    Responsável por gerar recomendações pedagógicas,
    institucionais e formativas para os produtos da plataforma.
    """

    @staticmethod
    def generate(
        context: EngineContext,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        module = context.module or "platform"

        recommendations = []

        if module == "agenda":
            recommendations = RecommendationEngine._agenda_recommendations(payload)

        return {
            "context": context.to_dict(),
            "recommendations": recommendations,
            "total": len(recommendations),
        }

    @staticmethod
    def _agenda_recommendations(
        payload: dict[str, Any],
    ) -> list[dict[str, Any]]:
        recommendations = []

        if not payload.get("objectives"):
            recommendations.append(
                {
                    "type": "planning",
                    "priority": "medium",
                    "title": "Adicionar objetivos de aprendizagem",
                    "message": "Inclua objetivos claros para fortalecer o alinhamento pedagógico da atividade.",
                }
            )

        if not payload.get("evidences"):
            recommendations.append(
                {
                    "type": "evidence",
                    "priority": "high",
                    "title": "Registrar evidências",
                    "message": "Associe evidências ao planejamento para alimentar o Framework EDI.",
                }
            )

        if not payload.get("methodology"):
            recommendations.append(
                {
                    "type": "methodology",
                    "priority": "medium",
                    "title": "Descrever metodologia",
                    "message": "Registre a metodologia utilizada para apoiar análise futura pelo EDI Intelligence Engine.",
                }
            )

        return recommendations
