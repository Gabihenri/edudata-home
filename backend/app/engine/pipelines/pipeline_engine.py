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

    Ordem oficial de execução:

    1. Perfil
    2. Analytics
    3. Insights
    4. Recomendações
    5. Aprendizagem
    6. Memória

    Responsabilidades:

    - organizar a execução dos motores;
    - preservar a separação de responsabilidades;
    - encaminhar resultados estruturados entre os motores;
    - manter comportamento determinístico;
    - não acessar diretamente banco de dados;
    - não implementar regras pertencentes aos motores especializados.
    """

    PIPELINE_VERSION = "agenda-operational-v1"

    @staticmethod
    def execute(
        context: EngineContext,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Executa o pipeline completo do EDI Intelligence Engine.

        O payload original permanece disponível para todos os motores.

        O RecommendationEngine recebe, adicionalmente:

        - resultado do AnalyticsEngine;
        - resultado do InsightEngine.

        Dessa forma, recomendações passam a ser derivadas de
        indicadores e insights estruturados, sem duplicação de regras.
        """

        normalized_payload = (
            payload
            if isinstance(
                payload,
                dict,
            )
            else {}
        )

        profile = TeacherProfileEngine.analyze(
            context,
            normalized_payload,
        )

        analytics = AnalyticsEngine.summarize(
            context,
            normalized_payload,
        )

        insights = InsightEngine.generate(
            context,
            analytics,
        )

        recommendation_payload = {
            **normalized_payload,
            "analytics": analytics,
            "insights": insights,
        }

        recommendations = RecommendationEngine.generate(
            context,
            recommendation_payload,
        )

        learning = LearningEngine.learn(
            context,
            {
                "interactions": PipelineEngine._as_list(
                    normalized_payload.get(
                        "interactions",
                    ),
                ),
                "recommendations": PipelineEngine._recommendation_list(
                    recommendations,
                ),
                "accepted_recommendations": (
                    PipelineEngine._non_negative_integer(
                        normalized_payload.get(
                            "accepted_recommendations",
                        ),
                    )
                ),
            },
        )

        memory_snapshot = {
            "pipeline_version": (
                PipelineEngine.PIPELINE_VERSION
            ),
            "module": (
                context.module
                or "platform"
            ),
            "profile": profile,
            "analytics": analytics,
            "insights_summary": (
                PipelineEngine._as_record(
                    insights.get(
                        "summary",
                    ),
                )
            ),
            "recommendations_summary": (
                PipelineEngine._as_record(
                    recommendations.get(
                        "summary",
                    ),
                )
            ),
            "learning": learning,
        }

        MemoryEngine.save(
            context,
            "last_pipeline_execution",
            memory_snapshot,
        )

        return {
            "context": context.to_dict(),
            "contract": {
                "engine": "edi-intelligence",
                "component": "pipeline-engine",
                "version": (
                    PipelineEngine.PIPELINE_VERSION
                ),
                "deterministic": True,
                "generative_ai_used": False,
                "execution_order": [
                    "profile",
                    "analytics",
                    "insights",
                    "recommendations",
                    "learning",
                    "memory",
                ],
            },
            "profile": profile,
            "analytics": analytics,
            "insights": insights,
            "recommendations": recommendations,
            "learning": learning,
        }

    @staticmethod
    def _recommendation_list(
        recommendations: dict[str, Any],
    ) -> list[dict[str, Any]]:
        """
        Extrai somente recomendações válidas para o LearningEngine.
        """

        recommendation_items = (
            recommendations.get(
                "recommendations",
            )
        )

        if not isinstance(
            recommendation_items,
            list,
        ):
            return []

        return [
            item
            for item in recommendation_items
            if isinstance(
                item,
                dict,
            )
        ]

    @staticmethod
    def _as_record(
        value: Any,
    ) -> dict[str, Any]:
        if not isinstance(
            value,
            dict,
        ):
            return {}

        return value

    @staticmethod
    def _as_list(
        value: Any,
    ) -> list[Any]:
        if not isinstance(
            value,
            list,
        ):
            return []

        return value

    @staticmethod
    def _non_negative_integer(
        value: Any,
    ) -> int:
        if isinstance(
            value,
            bool,
        ):
            return 0

        if isinstance(
            value,
            int,
        ):
            return max(
                value,
                0,
            )

        if isinstance(
            value,
            float,
        ):
            return max(
                int(value),
                0,
            )

        return 0