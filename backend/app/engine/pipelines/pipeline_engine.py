from typing import Any

from app.engine.analytics.analytics_engine import AnalyticsEngine
from app.engine.context import EngineContext
from app.engine.insights.insight_engine import InsightEngine
from app.engine.learning.learning_engine import LearningEngine
from app.engine.memory.memory_engine import MemoryEngine
from app.engine.profiles.teacher_profile_engine import TeacherProfileEngine
from app.engine.recommendations.recommendation_engine import RecommendationEngine


class PipelineEngine:
    """
    Orquestrador oficial do EDI Intelligence Engine.
    """

    @staticmethod
    def execute(
        context: EngineContext,
        payload: dict[str, Any],
    ) -> dict[str, Any]:

        profile = TeacherProfileEngine.analyze(
            context,
            payload,
        )

        recommendations = RecommendationEngine.generate(
            context,
            payload,
        )

        analytics = AnalyticsEngine.summarize(
            context,
            payload,
        )

        insights = InsightEngine.generate(
            context,
            analytics,
        )

        learning = LearningEngine.learn(
            context,
            {
                "interactions": payload.get("interactions", []),
                "recommendations": recommendations["recommendations"],
                "accepted_recommendations": payload.get(
                    "accepted_recommendations",
                    0,
                ),
            },
        )

        MemoryEngine.save(
            context,
            "last_pipeline_execution",
            {
                "profile": profile,
                "analytics": analytics,
            },
        )

        return {
            "profile": profile,
            "recommendations": recommendations,
            "analytics": analytics,
            "insights": insights,
            "learning": learning,
        }
