from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException

from app.core.exceptions.exceptions import EduDataException
from app.core.responses.api_response import ApiResponse
from app.engine.context import EngineContext
from app.services.capabilities.agenda_capabilities import (
    AGENDA_DASHBOARD_INTELLIGENCE_ID,
)
from app.services.capabilities.dispatcher import (
    capability_dispatcher,
)
from app.services.capabilities.exceptions import (
    CapabilityError,
)


router = APIRouter(
    prefix="/api/v1/intelligence",
    tags=["EDI Intelligence Engine"],
)


MAX_RECORDS_PER_COLLECTION = 5000


def _as_record(
    value: Any,
) -> dict[str, Any]:
    if not isinstance(
        value,
        dict,
    ):
        return {}

    return value


def _as_record_list(
    value: Any,
    field_name: str,
) -> list[dict[str, Any]]:
    if value is None:
        return []

    if not isinstance(
        value,
        list,
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                f"O campo '{field_name}' deve ser uma lista."
            ),
        )

    if (
        len(value)
        > MAX_RECORDS_PER_COLLECTION
    ):
        raise HTTPException(
            status_code=413,
            detail=(
                f"O campo '{field_name}' ultrapassou o limite "
                f"de {MAX_RECORDS_PER_COLLECTION} registros."
            ),
        )

    return [
        item
        for item in value
        if isinstance(
            item,
            dict,
        )
    ]


def _optional_text(
    value: Any,
) -> str | None:
    if (
        isinstance(
            value,
            str,
        )
        and value.strip()
    ):
        return value.strip()

    return None


def _optional_non_negative_integer(
    value: Any,
) -> int | None:
    if isinstance(
        value,
        bool,
    ):
        return None

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

    return None


def _non_negative_integer(
    value: Any,
) -> int:
    normalized_value = (
        _optional_non_negative_integer(
            value,
        )
    )

    return (
        normalized_value
        if normalized_value
        is not None
        else 0
    )


def _safe_execution_scope(
    value: Any,
) -> dict[str, str | None]:
    scope = _as_record(
        value,
    )

    return {
        "organization_id": (
            _optional_text(
                scope.get(
                    "organization_id",
                ),
            )
        ),
        "school_id": (
            _optional_text(
                scope.get(
                    "school_id",
                ),
            )
        ),
        "user_id": (
            _optional_text(
                scope.get(
                    "user_id",
                ),
            )
        ),
        "role": (
            _optional_text(
                scope.get(
                    "role",
                ),
            )
        ),
    }


def _safe_execution_metadata(
    value: Any,
) -> dict[str, Any]:
    metadata = _as_record(
        value,
    )

    safe_metadata: dict[str, Any] = {}

    allowed_text_fields = [
        "status",
        "engine",
        "component",
        "error_type",
    ]

    for field_name in (
        allowed_text_fields
    ):
        field_value = (
            _optional_text(
                metadata.get(
                    field_name,
                ),
            )
        )

        if field_value is not None:
            safe_metadata[
                field_name
            ] = field_value

    deterministic = (
        metadata.get(
            "deterministic",
        )
    )

    if isinstance(
        deterministic,
        bool,
    ):
        safe_metadata[
            "deterministic"
        ] = deterministic

    generative_ai_used = (
        metadata.get(
            "generative_ai_used",
        )
    )

    if isinstance(
        generative_ai_used,
        bool,
    ):
        safe_metadata[
            "generative_ai_used"
        ] = generative_ai_used

    return safe_metadata


def _sanitize_execution(
    value: Any,
) -> dict[str, Any]:
    execution = _as_record(
        value,
    )

    if not execution:
        return {}

    return {
        "execution_id": (
            _optional_text(
                execution.get(
                    "execution_id",
                ),
            )
        ),
        "started_at": (
            _optional_text(
                execution.get(
                    "started_at",
                ),
            )
        ),
        "completed_at": (
            _optional_text(
                execution.get(
                    "completed_at",
                ),
            )
        ),
        "duration_ms": (
            _optional_non_negative_integer(
                execution.get(
                    "duration_ms",
                ),
            )
        ),
        "module": (
            _optional_text(
                execution.get(
                    "module",
                ),
            )
        ),
        "contract_version": (
            _optional_text(
                execution.get(
                    "contract_version",
                ),
            )
        ),
        "scope": (
            _safe_execution_scope(
                execution.get(
                    "scope",
                ),
            )
        ),
        "cache_key": (
            _optional_text(
                execution.get(
                    "cache_key",
                ),
            )
        ),
        "metadata": (
            _safe_execution_metadata(
                execution.get(
                    "metadata",
                ),
            )
        ),
    }


def _build_engine_context(
    payload: dict[str, Any],
) -> EngineContext:
    context_payload = _as_record(
        payload.get(
            "context",
        ),
    )

    metadata = _as_record(
        context_payload.get(
            "metadata",
        ),
    )

    return EngineContext(
        organization_id=(
            _optional_text(
                context_payload.get(
                    "organization_id",
                ),
            )
        ),
        school_id=(
            _optional_text(
                context_payload.get(
                    "school_id",
                ),
            )
        ),
        user_id=(
            _optional_text(
                context_payload.get(
                    "user_id",
                ),
            )
        ),
        module="agenda",
        role=(
            _optional_text(
                context_payload.get(
                    "role",
                ),
            )
        ),
        metadata={
            **metadata,
            "source": (
                "agenda-intelligence-api"
            ),
            "contract_version": (
                "agenda-operational-v1"
            ),
        },
    )


def _build_pipeline_payload(
    payload: dict[str, Any],
) -> dict[str, Any]:
    """
    Normaliza o contrato recebido pelo Intelligence Gateway.

    A rota não acessa banco de dados.

    Os registros devem chegar previamente:

    - autenticados;
    - autorizados;
    - filtrados por RLS;
    - limitados ao escopo do usuário;
    - sem conteúdo sensível desnecessário.
    """

    planning = _as_record_list(
        payload.get(
            "planning",
        ),
        "planning",
    )

    objectives = _as_record_list(
        payload.get(
            "objectives",
        ),
        "objectives",
    )

    lessons = _as_record_list(
        payload.get(
            "lessons",
        ),
        "lessons",
    )

    evidences = _as_record_list(
        payload.get(
            "evidences",
        ),
        "evidences",
    )

    interactions = _as_record_list(
        payload.get(
            "interactions",
        ),
        "interactions",
    )

    accepted_recommendations = (
        _non_negative_integer(
            payload.get(
                "accepted_recommendations",
            ),
        )
    )

    return {
        "planning": planning,
        "objectives": objectives,
        "lessons": lessons,
        "evidences": evidences,
        "interactions": interactions,
        "accepted_recommendations": (
            accepted_recommendations
        ),
    }


def _sanitize_engine_result(
    engine_result: dict[str, Any],
) -> dict[str, Any]:
    """
    Expõe somente o contrato necessário aos consumidores.

    A memória interna do motor não é devolvida.

    O resultado não deve incluir:

    - arquivos;
    - conteúdo de evidências;
    - referências sensíveis de autorização;
    - tokens;
    - chaves privadas;
    - payload operacional original;
    - dados pessoais desnecessários.
    """

    return {
        "context": (
            _as_record(
                engine_result.get(
                    "context",
                ),
            )
        ),
        "execution": (
            _sanitize_execution(
                engine_result.get(
                    "execution",
                ),
            )
        ),
        "contract": (
            _as_record(
                engine_result.get(
                    "contract",
                ),
            )
        ),
        "profile": (
            _as_record(
                engine_result.get(
                    "profile",
                ),
            )
        ),
        "analytics": (
            _as_record(
                engine_result.get(
                    "analytics",
                ),
            )
        ),
        "insights": (
            _as_record(
                engine_result.get(
                    "insights",
                ),
            )
        ),
        "recommendations": (
            _as_record(
                engine_result.get(
                    "recommendations",
                ),
            )
        ),
        "learning": (
            _as_record(
                engine_result.get(
                    "learning",
                ),
            )
        ),
    }


@router.get("/health")
def intelligence_health() -> dict[str, Any]:
    """
    Verifica apenas a disponibilidade do router.

    Não executa análise nem acessa dados operacionais.
    """

    return ApiResponse.success(
        data={
            "service": (
                "edi-intelligence"
            ),
            "module": "agenda",
            "status": "available",
            "contract_version": (
                "agenda-operational-v1"
            ),
            "generative_ai_used": False,
            "execution_layer": (
                "educational-capability-platform"
            ),
            "capability_id": (
                AGENDA_DASHBOARD_INTELLIGENCE_ID
            ),
        },
        message=(
            "EDI Intelligence Engine disponível."
        ),
    )


@router.post("/agenda")
def analyze_agenda(
    payload: dict[str, Any],
) -> dict[str, Any]:
    """
    Executa a capacidade oficial de inteligência da Agenda.

    Responsabilidades desta rota:

    - validar o contrato de transporte;
    - construir o EngineContext;
    - normalizar os registros recebidos;
    - encaminhar a execução ao CapabilityDispatcher;
    - utilizar a capacidade agenda.dashboard_intelligence;
    - devolver o contrato único do EIOS;
    - expor somente metadados seguros da execução.

    Esta rota não:

    - chama diretamente o PipelineEngine;
    - autentica diretamente o usuário;
    - acessa o banco;
    - contorna RLS;
    - recebe service role;
    - altera registros;
    - manipula arquivos;
    - altera a política ECA Digital.

    A autenticação, a autorização e a coleta dos registros
    pertencem ao gateway consumidor, inicialmente a rota
    Next.js da Agenda Inteligente EDI.
    """

    try:
        normalized_payload = (
            payload
            if isinstance(
                payload,
                dict,
            )
            else {}
        )

        context = (
            _build_engine_context(
                normalized_payload,
            )
        )

        pipeline_payload = (
            _build_pipeline_payload(
                normalized_payload,
            )
        )

        dispatch_result = (
            capability_dispatcher.dispatch(
                AGENDA_DASHBOARD_INTELLIGENCE_ID,
                payload={
                    "engine_context": (
                        context
                    ),
                    "pipeline_payload": (
                        pipeline_payload
                    ),
                },
                role=(
                    context.role
                ),
                context={
                    "user_context": True,
                    "agenda": True,
                    "planning": True,
                    "objectives": True,
                    "lessons": True,
                    "evidences": True,
                },
                confirmation_provided=False,
                allow_experimental=False,
                allow_beta=False,
                allow_deprecated=False,
                require_stable=True,
                metadata={
                    "source": (
                        "agenda-intelligence-api"
                    ),
                    "contract_version": (
                        "agenda-operational-v1"
                    ),
                    "transport": (
                        "fastapi"
                    ),
                },
            )
        )

        engine_result = (
            dispatch_result.result
        )

        if not isinstance(
            engine_result,
            dict,
        ):
            raise HTTPException(
                status_code=500,
                detail=(
                    "A capacidade da Agenda retornou "
                    "um contrato inválido."
                ),
            )

        safe_result = (
            _sanitize_engine_result(
                engine_result,
            )
        )

        generated_at = (
            datetime.now(
                timezone.utc,
            ).isoformat()
        )

        return ApiResponse.success(
            data={
                "generated_at": (
                    generated_at
                ),
                "module": "agenda",
                "contract_version": (
                    "agenda-operational-v1"
                ),
                "capability": {
                    "capability_id": (
                        dispatch_result
                        .capability_id
                    ),
                    "identity": (
                        dispatch_result
                        .capability
                        .identity()
                    ),
                    "duration_ms": (
                        dispatch_result
                        .duration_ms
                    ),
                    "execution_mode": (
                        dispatch_result
                        .capability
                        .execution_mode
                        .value
                    ),
                    "risk_level": (
                        dispatch_result
                        .capability
                        .risk_level
                        .value
                    ),
                },
                "engine": (
                    safe_result
                ),
            },
            message=(
                "Inteligência da Agenda processada com sucesso."
            ),
        )

    except HTTPException:
        raise

    except CapabilityError as exc:
        print(
            "[ECP_AGENDA_CAPABILITY_ERROR]",
            {
                "capability_id": (
                    exc.capability_id
                ),
                "error_code": (
                    exc.error_code
                ),
                "status_code": (
                    exc.status_code
                ),
            },
        )

        raise HTTPException(
            status_code=(
                exc.status_code
            ),
            detail=(
                exc.message
            ),
        ) from exc

    except EduDataException as exc:
        raise HTTPException(
            status_code=(
                exc.status_code
            ),
            detail=exc.message,
        ) from exc

    except Exception as exc:
        print(
            "[EDI_INTELLIGENCE_AGENDA_ERROR]",
            {
                "error_type": (
                    type(
                        exc,
                    ).__name__
                ),
                "message": (
                    str(
                        exc,
                    )
                ),
            },
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Não foi possível processar a inteligência da Agenda."
            ),
        ) from exc