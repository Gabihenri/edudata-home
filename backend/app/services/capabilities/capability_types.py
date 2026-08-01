from __future__ import annotations

from enum import Enum
from typing import Any


class CapabilityStatus(
    str,
    Enum,
):
    """
    Estado operacional de uma capacidade.

    DRAFT:
        A capacidade ainda está em modelagem e não deve
        ser oferecida aos agentes ou interfaces.

    EXPERIMENTAL:
        A capacidade pode ser utilizada apenas em ambientes
        ou fluxos explicitamente experimentais.

    BETA:
        A capacidade está disponível para validação controlada,
        mas seu contrato ainda pode evoluir.

    STABLE:
        A capacidade possui contrato estável e pode ser
        utilizada pelos produtos autorizados.

    DEPRECATED:
        A capacidade permanece disponível apenas para
        compatibilidade e deve ser substituída.

    DISABLED:
        A capacidade não pode ser resolvida nem executada.
    """

    DRAFT = "draft"
    EXPERIMENTAL = "experimental"
    BETA = "beta"
    STABLE = "stable"
    DEPRECATED = "deprecated"
    DISABLED = "disabled"


class CapabilityExecutionMode(
    str,
    Enum,
):
    """
    Define como uma capacidade é executada.

    QUERY:
        Consulta dados ou inteligência sem alterar registros.

    COMMAND:
        Executa uma alteração autorizada no estado da plataforma.

    WORKFLOW:
        Coordena duas ou mais operações ou capacidades.

    ANALYSIS:
        Executa processamento analítico pelo EIOS.

    GENERATION:
        Produz um artefato estruturado, como planejamento,
        relatório ou plano de ação.

    INTEGRATION:
        Encaminha ou sincroniza informações com serviço externo.
    """

    QUERY = "query"
    COMMAND = "command"
    WORKFLOW = "workflow"
    ANALYSIS = "analysis"
    GENERATION = "generation"
    INTEGRATION = "integration"


class CapabilityRiskLevel(
    str,
    Enum,
):
    """
    Classificação de risco operacional.

    LOW:
        Apenas leitura de dados não sensíveis ou respostas
        derivadas de contratos já autorizados.

    MODERATE:
        Usa informações pedagógicas contextualizadas ou
        combina diferentes fontes operacionais.

    HIGH:
        Altera registros, executa ações institucionais ou
        exige confirmação explícita.

    RESTRICTED:
        Capacidade reservada a perfis ou contextos altamente
        controlados e sujeita a auditoria obrigatória.
    """

    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    RESTRICTED = "restricted"


class CapabilityScope(
    str,
    Enum,
):
    """
    Escopo mínimo em que a capacidade pode operar.
    """

    PLATFORM = "platform"
    ORGANIZATION = "organization"
    SCHOOL = "school"
    USER = "user"


class CapabilityDataRequirement(
    str,
    Enum,
):
    """
    Fontes de contexto que uma capacidade pode exigir.

    Estes valores identificam contratos ou conjuntos de dados.
    Eles não representam acesso direto às tabelas, ao Storage
    ou a serviços externos.
    """

    USER_CONTEXT = "user_context"
    ORGANIZATION_CONTEXT = "organization_context"
    SCHOOL_CONTEXT = "school_context"

    AGENDA = "agenda"
    CALENDAR = "calendar"
    PLANNING = "planning"
    OBJECTIVES = "objectives"
    LESSONS = "lessons"
    EVIDENCES = "evidences"
    TASKS = "tasks"
    INDICATORS = "indicators"
    RECOMMENDATIONS = "recommendations"
    ANALYTICS = "analytics"
    HISTORY = "history"


class CapabilityOutputType(
    str,
    Enum,
):
    """
    Tipo principal de saída produzido pela capacidade.
    """

    STRUCTURED_RESPONSE = "structured_response"
    COLLECTION = "collection"
    RECORD = "record"
    ANALYSIS = "analysis"
    RECOMMENDATION_SET = "recommendation_set"
    ACTION_RESULT = "action_result"
    DOCUMENT = "document"
    WORKFLOW_RESULT = "workflow_result"


def enum_value(
    value: Enum | str,
) -> str:
    """
    Retorna o valor textual seguro de um Enum.

    Aceita também string para facilitar serialização de
    contratos legados, sem converter outros tipos
    silenciosamente.
    """

    if isinstance(
        value,
        Enum,
    ):
        return str(
            value.value,
        )

    if isinstance(
        value,
        str,
    ):
        return value.strip()

    raise TypeError(
        "O valor deve ser uma string ou uma instância de Enum.",
    )


def enum_values(
    enum_type: type[Enum],
) -> list[str]:
    """
    Retorna os valores públicos de um tipo Enum.
    """

    return [
        str(
            item.value,
        )
        for item in enum_type
    ]


def is_valid_enum_value(
    enum_type: type[Enum],
    value: Any,
) -> bool:
    """
    Verifica se um valor pertence ao Enum informado.
    """

    if not isinstance(
        value,
        str,
    ):
        return False

    normalized_value = (
        value.strip()
    )

    return normalized_value in (
        enum_values(
            enum_type,
        )
    )