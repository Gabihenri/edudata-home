from __future__ import annotations

from typing import Any

from app.engine.context import EngineContext
from app.engine.pipelines.pipeline_engine import (
    PipelineEngine,
)
from app.services.capabilities.agenda_capabilities import (
    AGENDA_DASHBOARD_INTELLIGENCE_ID,
)
from app.services.capabilities.dispatcher import (
    CapabilityDispatcher,
    CapabilityResolution,
    capability_dispatcher,
)
from app.services.capabilities.exceptions import (
    CapabilityValidationError,
)


def _as_engine_context(
    value: Any,
) -> EngineContext:
    if not isinstance(
        value,
        EngineContext,
    ):
        raise CapabilityValidationError(
            (
                "A capacidade de inteligência da Agenda "
                "exige um EngineContext válido."
            ),
            capability_id=(
                AGENDA_DASHBOARD_INTELLIGENCE_ID
            ),
        )

    return value


def _as_pipeline_payload(
    value: Any,
) -> dict[str, Any]:
    if not isinstance(
        value,
        dict,
    ):
        raise CapabilityValidationError(
            (
                "A capacidade de inteligência da Agenda "
                "exige um payload de pipeline válido."
            ),
            capability_id=(
                AGENDA_DASHBOARD_INTELLIGENCE_ID
            ),
        )

    return {
        **value,
    }


def execute_agenda_dashboard_intelligence(
    resolution: CapabilityResolution,
    payload: dict[str, Any],
) -> dict[str, Any]:
    """
    Handler oficial da capacidade:

    agenda.dashboard_intelligence

    Responsabilidades:

    - receber uma capacidade previamente resolvida;
    - validar o contexto técnico da execução;
    - encaminhar o processamento ao PipelineEngine;
    - devolver o contrato oficial do EIOS.

    Este handler não:

    - autentica usuários;
    - acessa banco de dados;
    - coleta registros;
    - altera RLS;
    - sanitiza a resposta HTTP;
    - implementa regras pedagógicas paralelas;
    - substitui o PipelineEngine.
    """

    if (
        resolution.capability_id
        != AGENDA_DASHBOARD_INTELLIGENCE_ID
    ):
        raise CapabilityValidationError(
            (
                "O handler recebeu uma resolução "
                "de capacidade incompatível."
            ),
            capability_id=(
                resolution.capability_id
            ),
            details={
                "expected_capability_id": (
                    AGENDA_DASHBOARD_INTELLIGENCE_ID
                ),
            },
        )

    engine_context = (
        _as_engine_context(
            payload.get(
                "engine_context",
            ),
        )
    )

    pipeline_payload = (
        _as_pipeline_payload(
            payload.get(
                "pipeline_payload",
            ),
        )
    )

    return PipelineEngine.execute(
        context=engine_context,
        payload=pipeline_payload,
    )


def register_agenda_handlers(
    dispatcher: CapabilityDispatcher | None = None,
) -> tuple[str, ...]:
    """
    Registra os handlers oficiais da Agenda.

    O processo é idempotente e pode ser executado durante
    a inicialização do backend sem criar duplicidade.
    """

    target_dispatcher = (
        dispatcher
        or capability_dispatcher
    )

    if not target_dispatcher.has_handler(
        AGENDA_DASHBOARD_INTELLIGENCE_ID,
    ):
        target_dispatcher.register_handler(
            AGENDA_DASHBOARD_INTELLIGENCE_ID,
            execute_agenda_dashboard_intelligence,
        )

    return (
        AGENDA_DASHBOARD_INTELLIGENCE_ID,
    )