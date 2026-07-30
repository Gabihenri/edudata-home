from __future__ import annotations

import unittest
from unittest.mock import patch
from uuid import UUID

from app.engine.context import EngineContext
from app.engine.pipelines.pipeline_engine import (
    PipelineEngine,
)


class PipelineEngineTestCase(
    unittest.TestCase,
):
    """
    Testes de integração da orquestração central do EIOS.

    Os motores especializados são simulados para validar:

    - ordem de execução;
    - encaminhamento dos resultados;
    - contrato final;
    - contexto de execução;
    - registro em memória;
    - tratamento de falhas.

    Estes testes não acessam:

    - banco de dados;
    - Supabase;
    - Render;
    - Vercel;
    - arquivos;
    - APIs externas.
    """

    def create_context(
        self,
    ) -> EngineContext:
        return EngineContext(
            organization_id=(
                "organization-test"
            ),
            school_id=(
                "school-test"
            ),
            user_id=(
                "user-test"
            ),
            module="agenda",
            role="professor",
            metadata={
                "source": (
                    "pipeline-engine-test"
                ),
            },
        )

    def create_payload(
        self,
    ) -> dict:
        return {
            "planning": [
                {
                    "id": (
                        "planning-1"
                    ),
                    "status": (
                        "planejado"
                    ),
                },
            ],
            "objectives": [
                {
                    "id": (
                        "objective-1"
                    ),
                    "status": (
                        "em_andamento"
                    ),
                },
            ],
            "lessons": [
                {
                    "id": (
                        "lesson-1"
                    ),
                    "status": (
                        "planejada"
                    ),
                },
            ],
            "evidences": [
                {
                    "id": (
                        "evidence-1"
                    ),
                    "evidence_type": (
                        "texto"
                    ),
                },
            ],
            "interactions": [
                {
                    "type": (
                        "recommendation_viewed"
                    ),
                },
            ],
            "accepted_recommendations": (
                1
            ),
        }

    def test_pipeline_returns_complete_contract(
        self,
    ) -> None:
        context = (
            self.create_context()
        )

        payload = (
            self.create_payload()
        )

        profile_result = {
            "profile_type": (
                "teacher"
            ),
        }

        analytics_result = {
            "summary": {
                "score": 75,
            },
        }

        insights_result = {
            "summary": {
                "total": 1,
            },
            "insights": [
                {
                    "id": (
                        "insight-1"
                    ),
                },
            ],
        }

        recommendations_result = {
            "summary": {
                "total": 1,
            },
            "recommendations": [
                {
                    "id": (
                        "recommendation-1"
                    ),
                },
            ],
        }

        learning_result = {
            "accepted_recommendations": (
                1
            ),
        }

        with (
            patch(
                "app.engine.pipelines.pipeline_engine."
                "TeacherProfileEngine.analyze",
                return_value=(
                    profile_result
                ),
            ),
            patch(
                "app.engine.pipelines.pipeline_engine."
                "AnalyticsEngine.summarize",
                return_value=(
                    analytics_result
                ),
            ),
            patch(
                "app.engine.pipelines.pipeline_engine."
                "InsightEngine.generate",
                return_value=(
                    insights_result
                ),
            ),
            patch(
                "app.engine.pipelines.pipeline_engine."
                "RecommendationEngine.generate",
                return_value=(
                    recommendations_result
                ),
            ),
            patch(
                "app.engine.pipelines.pipeline_engine."
                "LearningEngine.learn",
                return_value=(
                    learning_result
                ),
            ),
            patch(
                "app.engine.pipelines.pipeline_engine."
                "MemoryEngine.save",
            ) as memory_save,
            patch(
                "builtins.print",
            ),
        ):
            result = (
                PipelineEngine.execute(
                    context=context,
                    payload=payload,
                )
            )

        self.assertEqual(
            set(
                result.keys(),
            ),
            {
                "context",
                "execution",
                "contract",
                "profile",
                "analytics",
                "insights",
                "recommendations",
                "learning",
            },
        )

        self.assertEqual(
            result[
                "profile"
            ],
            profile_result,
        )

        self.assertEqual(
            result[
                "analytics"
            ],
            analytics_result,
        )

        self.assertEqual(
            result[
                "insights"
            ],
            insights_result,
        )

        self.assertEqual(
            result[
                "recommendations"
            ],
            recommendations_result,
        )

        self.assertEqual(
            result[
                "learning"
            ],
            learning_result,
        )

        execution = (
            result[
                "execution"
            ]
        )

        UUID(
            execution[
                "execution_id"
            ],
        )

        self.assertEqual(
            execution[
                "module"
            ],
            "agenda",
        )

        self.assertEqual(
            execution[
                "contract_version"
            ],
            (
                PipelineEngine
                .PIPELINE_VERSION
            ),
        )

        self.assertEqual(
            execution[
                "metadata"
            ][
                "status"
            ],
            "completed",
        )

        self.assertIsNotNone(
            execution[
                "completed_at"
            ],
        )

        self.assertIsNotNone(
            execution[
                "duration_ms"
            ],
        )

        memory_save.assert_called_once()

        memory_call = (
            memory_save.call_args
        )

        self.assertEqual(
            memory_call.args[
                0
            ],
            context,
        )

        self.assertEqual(
            memory_call.args[
                1
            ],
            "last_pipeline_execution",
        )

        memory_snapshot = (
            memory_call.args[
                2
            ]
        )

        self.assertEqual(
            memory_snapshot[
                "execution"
            ][
                "execution_id"
            ],
            execution[
                "execution_id"
            ],
        )

    def test_pipeline_executes_engines_in_official_order(
        self,
    ) -> None:
        execution_order: list[
            str
        ] = []

        def profile_side_effect(
            *_args,
            **_kwargs,
        ) -> dict:
            execution_order.append(
                "profile",
            )

            return {
                "profile": True,
            }

        def analytics_side_effect(
            *_args,
            **_kwargs,
        ) -> dict:
            execution_order.append(
                "analytics",
            )

            return {
                "summary": {},
            }

        def insights_side_effect(
            *_args,
            **_kwargs,
        ) -> dict:
            execution_order.append(
                "insights",
            )

            return {
                "summary": {},
                "insights": [],
            }

        def recommendations_side_effect(
            *_args,
            **_kwargs,
        ) -> dict:
            execution_order.append(
                "recommendations",
            )

            return {
                "summary": {},
                "recommendations": [],
            }

        def learning_side_effect(
            *_args,
            **_kwargs,
        ) -> dict:
            execution_order.append(
                "learning",
            )

            return {}

        def memory_side_effect(
            *_args,
            **_kwargs,
        ) -> None:
            execution_order.append(
                "memory",
            )

        with (
            patch(
                "app.engine.pipelines.pipeline_engine."
                "TeacherProfileEngine.analyze",
                side_effect=(
                    profile_side_effect
                ),
            ),
            patch(
                "app.engine.pipelines.pipeline_engine."
                "AnalyticsEngine.summarize",
                side_effect=(
                    analytics_side_effect
                ),
            ),
            patch(
                "app.engine.pipelines.pipeline_engine."
                "InsightEngine.generate",
                side_effect=(
                    insights_side_effect
                ),
            ),
            patch(
                "app.engine.pipelines.pipeline_engine."
                "RecommendationEngine.generate",
                side_effect=(
                    recommendations_side_effect
                ),
            ),
            patch(
                "app.engine.pipelines.pipeline_engine."
                "LearningEngine.learn",
                side_effect=(
                    learning_side_effect
                ),
            ),
            patch(
                "app.engine.pipelines.pipeline_engine."
                "MemoryEngine.save",
                side_effect=(
                    memory_side_effect
                ),
            ),
            patch(
                "builtins.print",
            ),
        ):
            PipelineEngine.execute(
                context=(
                    self.create_context()
                ),
                payload=(
                    self.create_payload()
                ),
            )

        self.assertEqual(
            execution_order,
            [
                "profile",
                "analytics",
                "insights",
                "recommendations",
                "learning",
                "memory",
            ],
        )

    def test_pipeline_forwards_analytics_and_insights(
        self,
    ) -> None:
        analytics_result = {
            "summary": {
                "operational_score": (
                    82
                ),
            },
        }

        insights_result = {
            "summary": {
                "critical": 1,
            },
            "insights": [],
        }

        recommendations_result = {
            "summary": {},
            "recommendations": [
                {
                    "id": (
                        "recommendation-1"
                    ),
                },
            ],
        }

        with (
            patch(
                "app.engine.pipelines.pipeline_engine."
                "TeacherProfileEngine.analyze",
                return_value={},
            ),
            patch(
                "app.engine.pipelines.pipeline_engine."
                "AnalyticsEngine.summarize",
                return_value=(
                    analytics_result
                ),
            ),
            patch(
                "app.engine.pipelines.pipeline_engine."
                "InsightEngine.generate",
                return_value=(
                    insights_result
                ),
            ) as insight_generate,
            patch(
                "app.engine.pipelines.pipeline_engine."
                "RecommendationEngine.generate",
                return_value=(
                    recommendations_result
                ),
            ) as recommendation_generate,
            patch(
                "app.engine.pipelines.pipeline_engine."
                "LearningEngine.learn",
                return_value={},
            ) as learning_learn,
            patch(
                "app.engine.pipelines.pipeline_engine."
                "MemoryEngine.save",
            ),
            patch(
                "builtins.print",
            ),
        ):
            PipelineEngine.execute(
                context=(
                    self.create_context()
                ),
                payload=(
                    self.create_payload()
                ),
            )

        insight_generate.assert_called_once()

        self.assertEqual(
            insight_generate
            .call_args
            .args[
                1
            ],
            analytics_result,
        )

        recommendation_payload = (
            recommendation_generate
            .call_args
            .args[
                1
            ]
        )

        self.assertEqual(
            recommendation_payload[
                "analytics"
            ],
            analytics_result,
        )

        self.assertEqual(
            recommendation_payload[
                "insights"
            ],
            insights_result,
        )

        learning_payload = (
            learning_learn
            .call_args
            .args[
                1
            ]
        )

        self.assertEqual(
            learning_payload[
                "recommendations"
            ],
            recommendations_result[
                "recommendations"
            ],
        )

        self.assertEqual(
            learning_payload[
                "accepted_recommendations"
            ],
            1,
        )

    def test_pipeline_reraises_engine_failure(
        self,
    ) -> None:
        controlled_error = (
            RuntimeError(
                "Falha controlada no Analytics.",
            )
        )

        with (
            patch(
                "app.engine.pipelines.pipeline_engine."
                "TeacherProfileEngine.analyze",
                return_value={},
            ),
            patch(
                "app.engine.pipelines.pipeline_engine."
                "AnalyticsEngine.summarize",
                side_effect=(
                    controlled_error
                ),
            ),
            patch(
                "app.engine.pipelines.pipeline_engine."
                "InsightEngine.generate",
            ) as insight_generate,
            patch(
                "app.engine.pipelines.pipeline_engine."
                "RecommendationEngine.generate",
            ) as recommendation_generate,
            patch(
                "app.engine.pipelines.pipeline_engine."
                "LearningEngine.learn",
            ) as learning_learn,
            patch(
                "app.engine.pipelines.pipeline_engine."
                "MemoryEngine.save",
            ) as memory_save,
            patch(
                "builtins.print",
            ) as mocked_print,
        ):
            with self.assertRaisesRegex(
                RuntimeError,
                (
                    "Falha controlada "
                    "no Analytics."
                ),
            ):
                PipelineEngine.execute(
                    context=(
                        self.create_context()
                    ),
                    payload=(
                        self.create_payload()
                    ),
                )

        insight_generate.assert_not_called()

        recommendation_generate.assert_not_called()

        learning_learn.assert_not_called()

        memory_save.assert_not_called()

        mocked_print.assert_called_once()

        logged_data = (
            mocked_print
            .call_args
            .args[
                1
            ]
        )

        self.assertEqual(
            logged_data[
                "event"
            ],
            "pipeline_failed",
        )

        self.assertEqual(
            logged_data[
                "status"
            ],
            "failed",
        )

        self.assertIsNotNone(
            logged_data[
                "execution_id"
            ],
        )


if __name__ == "__main__":
    unittest.main()