from __future__ import annotations

from typing import Any

from app.engine.analytics.analytics_engine import AnalyticsEngine
from app.engine.context import EngineContext
from app.engine.execution.execution_context import ExecutionContext
from app.engine.insights.insight_engine import InsightEngine
from app.engine.learning.learning_engine import LearningEngine
from app.engine.memory.memory_engine import MemoryEngine
from app.engine.profiles.teacher_profile_engine import TeacherProfileEngine
from app.engine.recommendations.recommendation_engine import (
    RecommendationEngine,
)


class PipelineEngine:
    """
    Orquestrador oficial do EDI Intelligence Engine.

    Ordem oficial de execução:

    1. Contexto de execução
    2. Perfil
    3. Analytics
    4. Insights
    5. Recomendações
    6. Aprendizagem
    7. Memória

    Responsabilidades:

    - organizar a execução dos motores;
    - preservar a separação de responsabilidades;
    - encaminhar resultados estruturados entre os motores;
    - manter comportamento determinístico;
    - registrar metadados seguros da execução;
    - não acessar diretamente banco de dados;
    - não implementar regras pertencentes aos motores especializados.
    """

    PIPELINE_VERSION = (
        "agenda-operational-v1"
    )

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

        Toda execução recebe:

        - identificador único;
        - início e conclusão;
        - duração;
        - módulo;
        - escopo;
        - versão do contrato;
        - chave segura de cache;
        - status de conclusão ou falha.
        """

        normalized_payload = (
            payload
            if isinstance(
                payload,
                dict,
            )
            else {}
        )

        execution = (
            ExecutionContext.start(
                context=context,
                contract_version=(
                    PipelineEngine
                    .PIPELINE_VERSION
                ),
                metadata={
                    "engine": (
                        "edi-intelligence"
                    ),
                    "component": (
                        "pipeline-engine"
                    ),
                    "deterministic": True,
                    "generative_ai_used": (
                        False
                    ),
                },
            )
        )

        try:
            profile = (
                TeacherProfileEngine
                .analyze(
                    context,
                    normalized_payload,
                )
            )

            analytics = (
                AnalyticsEngine
                .summarize(
                    context,
                    normalized_payload,
                )
            )

            insights = (
                InsightEngine
                .generate(
                    context,
                    analytics,
                )
            )

            recommendation_payload = {
                **normalized_payload,
                "analytics": analytics,
                "insights": insights,
            }

            recommendations = (
                RecommendationEngine
                .generate(
                    context,
                    recommendation_payload,
                )
            )

            learning = (
                LearningEngine
                .learn(
                    context,
                    {
                        "interactions": (
                            PipelineEngine
                            ._as_list(
                                normalized_payload
                                .get(
                                    "interactions",
                                ),
                            )
                        ),
                        "recommendations": (
                            PipelineEngine
                            ._recommendation_list(
                                recommendations,
                            )
                        ),
                        "accepted_recommendations": (
                            PipelineEngine
                            ._non_negative_integer(
                                normalized_payload
                                .get(
                                    "accepted_recommendations",
                                ),
                            )
                        ),
                    },
                )
            )

            execution.mark_success()

            execution_data = (
                execution.to_dict()
            )

            memory_snapshot = {
                "execution": (
                    execution_data
                ),
                "pipeline_version": (
                    PipelineEngine
                    .PIPELINE_VERSION
                ),
                "module": (
                    context.module
                    or "platform"
                ),
                "profile": profile,
                "analytics": analytics,
                "insights_summary": (
                    PipelineEngine
                    ._as_record(
                        insights.get(
                            "summary",
                        ),
                    )
                ),
                "recommendations_summary": (
                    PipelineEngine
                    ._as_record(
                        recommendations
                        .get(
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

            PipelineEngine._log_execution(
                event=(
                    "pipeline_completed"
                ),
                execution=execution_data,
            )

            return {
                "context": (
                    context.to_dict()
                ),
                "execution": (
                    execution_data
                ),
                "contract": {
                    "engine": (
                        "edi-intelligence"
                    ),
                    "component": (
                        "pipeline-engine"
                    ),
                    "version": (
                        PipelineEngine
                        .PIPELINE_VERSION
                    ),
                    "deterministic": (
                        True
                    ),
                    "generative_ai_used": (
                        False
                    ),
                    "execution_order": [
                        "execution",
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
                "recommendations": (
                    recommendations
                ),
                "learning": learning,
            }

        except Exception as error:
            execution.fail(
                error,
            )

            PipelineEngine._log_execution(
                event=(
                    "pipeline_failed"
                ),
                execution=(
                    execution.to_dict()
                ),
            )

            raise

    @staticmethod
    def _log_execution(
        event: str,
        execution: dict[str, Any],
    ) -> None:
        """
        Registra somente metadados seguros da execução.

        Não registra:

        - payload operacional;
        - conteúdo de evidências;
        - arquivos;
        - tokens;
        - chaves;
        - referências de autorização;
        - dados pedagógicos detalhados.
        """

        metadata = (
            PipelineEngine
            ._as_record(
                execution.get(
                    "metadata",
                ),
            )
        )

        scope = (
            PipelineEngine
            ._as_record(
                execution.get(
                    "scope",
                ),
            )
        )

        print(
            "[EDI_PIPELINE_EXECUTION]",
            {
                "event": event,
                "execution_id": (
                    execution.get(
                        "execution_id",
                    )
                ),
                "module": (
                    execution.get(
                        "module",
                    )
                ),
                "contract_version": (
                    execution.get(
                        "contract_version",
                    )
                ),
                "started_at": (
                    execution.get(
                        "started_at",
                    )
                ),
                "completed_at": (
                    execution.get(
                        "completed_at",
                    )
                ),
                "duration_ms": (
                    execution.get(
                        "duration_ms",
                    )
                ),
                "status": (
                    metadata.get(
                        "status",
                    )
                ),
                "organization_scoped": (
                    bool(
                        scope.get(
                            "organization_id",
                        ),
                    )
                ),
                "school_scoped": (
                    bool(
                        scope.get(
                            "school_id",
                        ),
                    )
                ),
                "user_scoped": (
                    bool(
                        scope.get(
                            "user_id",
                        ),
                    )
                ),
            },
        )

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
            for item in (
                recommendation_items
            )
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
                int(
                    value,
                ),
                0,
            )

        return 0