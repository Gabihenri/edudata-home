from typing import Any

from app.engine.context import EngineContext


class LearningEngine:
    """
    Motor de Aprendizagem Contínua do EDI Intelligence Engine.
    """

    @staticmethod
    def learn(
        context: EngineContext,
        payload: dict[str, Any],
    ) -> dict[str, Any]:

        interactions = payload.get("interactions", [])
        recommendations = payload.get("recommendations", [])
        accepted = payload.get("accepted_recommendations", 0)

        acceptance_rate = 0.0

        if recommendations:
            acceptance_rate = round(
                (accepted / len(recommendations)) * 100,
                2,
            )

        return {
            "context": context.to_dict(),
            "learning": {
                "total_interactions": len(interactions),
                "recommendations_generated": len(recommendations),
                "recommendations_accepted": accepted,
                "acceptance_rate": acceptance_rate,
            },
        }
