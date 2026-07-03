from typing import Any

from app.engine.context import EngineContext


class InsightEngine:
    """
    Motor de Insights da EduData IA.
    """

    @staticmethod
    def generate(
        context: EngineContext,
        analytics: dict[str, Any],
    ) -> dict[str, Any]:

        insights = []

        indicators = analytics.get("edi_indicators", {})

        evidence = indicators.get("evidence_index", 0)
        training = indicators.get("training_index", 0)
        agenda = indicators.get("agenda_usage_index", 0)

        if evidence < 50:
            insights.append({
                "type": "warning",
                "title": "Baixo registro de evidências",
                "description": "A escola apresenta poucas evidências registradas.",
            })

        if training < 60:
            insights.append({
                "type": "opportunity",
                "title": "Fortalecer formação continuada",
                "description": "Expandir as trilhas da EduData Academy.",
            })

        if agenda < 70:
            insights.append({
                "type": "attention",
                "title": "Uso reduzido da Agenda Inteligente",
                "description": "Estimular registros pedagógicos.",
            })

        return {
            "context": context.to_dict(),
            "total": len(insights),
            "insights": insights,
        }
