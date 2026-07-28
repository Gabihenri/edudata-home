from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException

from app.core.exceptions.exceptions import EduDataException
from app.core.responses.api_response import ApiResponse
from app.engine.context import EngineContext
from app.engine.pipelines.pipeline_engine import PipelineEngine


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
        len(value) >
        MAX_RECORDS_PER_COLLECTION
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
        organization_id=_optional_text(
            context_payload.get(
                "organization_id",
            ),
        ),
        school_id=_optional_text(
            context_payload.get(
                "school_id",
            ),
        ),
        user_id=_optional_text(
            context_payload.get(
                "user_id",
            ),
        ),
        module="agenda",
        role=_optional_text(
            context_payload.get(
                "role",
            ),
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
    - chaves;
    - dados pessoais desnecessários.
    """

    return {
        "context": _as_record(
            engine_result.get(
                "context",
            ),
        ),
        "contract": _as_record(
            engine_result.get(
                "contract",
            ),
        ),
        "profile": _as_record(
            engine_result.get(
                "profile",
            ),
        ),
        "analytics": _as_record(
            engine_result.get(
                "analytics",
            ),
        ),
        "insights": _as_record(
            engine_result.get(
                "insights",
            ),
        ),
        "recommendations": _as_record(
            engine_result.get(
                "recommendations",
            ),
        ),
        "learning": _as_record(
            engine_result.get(
                "learning",
            ),
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
    Executa o pipeline oficial de inteligência da Agenda.

    Responsabilidades desta rota:

    - validar o contrato de transporte;
    - construir o EngineContext;
    - normalizar os registros recebidos;
    - executar o PipelineEngine;
    - devolver um contrato único.

    Esta rota não:

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

        context = _build_engine_context(
            normalized_payload,
        )

        pipeline_payload = (
            _build_pipeline_payload(
                normalized_payload,
            )
        )

        engine_result = (
            PipelineEngine.execute(
                context=context,
                payload=pipeline_payload,
            )
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
                "engine": safe_result,
            },
            message=(
                "Inteligência da Agenda processada com sucesso."
            ),
        )

    except HTTPException:
        raise

    except EduDataException as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
        ) from exc

    except Exception as exc:
        print(
            "[EDI_INTELLIGENCE_AGENDA_ERROR]",
            {
                "error_type": (
                    type(exc).__name__
                ),
                "message": str(exc),
            },
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Não foi possível processar a inteligência da Agenda."
            ),
        ) from exc