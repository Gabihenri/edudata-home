from __future__ import annotations

from app.services.capabilities import (
    Capability,
    CapabilityDataRequirement,
    CapabilityExecutionMode,
    CapabilityOutputType,
    CapabilityRegistry,
    CapabilityRiskLevel,
    CapabilityScope,
    CapabilityStatus,
    capability_registry,
)


AGENDA_DASHBOARD_INTELLIGENCE_ID = (
    "agenda.dashboard_intelligence"
)

PLANNING_DAILY_PRIORITIES_ID = (
    "planning.daily_priorities"
)


def build_agenda_dashboard_intelligence_capability(
) -> Capability:
    """
    Constrói o contrato oficial da inteligência do Dashboard.

    Esta função apenas descreve a capacidade.

    Ela não:

    - executa o Pipeline;
    - acessa banco de dados;
    - coleta registros;
    - autentica usuários;
    - altera o Dashboard;
    - registra handlers.
    """

    return Capability(
        capability_id=(
            AGENDA_DASHBOARD_INTELLIGENCE_ID
        ),
        title=(
            "Inteligência do Dashboard da Agenda"
        ),
        description=(
            "Analisa o ciclo operacional docente da Agenda "
            "Inteligente EDI e produz perfil, indicadores, "
            "insights, recomendações e aprendizagem por meio "
            "do pipeline oficial do EIOS."
        ),
        module="agenda",
        owner="Agenda Inteligente EDI",
        version="1.0.0",
        status=(
            CapabilityStatus.STABLE
        ),
        execution_mode=(
            CapabilityExecutionMode.ANALYSIS
        ),
        risk_level=(
            CapabilityRiskLevel.MODERATE
        ),
        scope=(
            CapabilityScope.USER
        ),
        output_type=(
            CapabilityOutputType.ANALYSIS
        ),
        required_roles=(
            "professor",
            "coordenador",
            "diretor",
            "gestor",
            "super_admin",
        ),
        required_context=(
            CapabilityDataRequirement.USER_CONTEXT,
            CapabilityDataRequirement.AGENDA,
            CapabilityDataRequirement.PLANNING,
            CapabilityDataRequirement.OBJECTIVES,
            CapabilityDataRequirement.LESSONS,
            CapabilityDataRequirement.EVIDENCES,
        ),
        dependencies=(),
        tags=(
            "agenda",
            "dashboard",
            "eios",
            "analytics",
            "insights",
            "recommendations",
        ),
        estimated_execution_ms=500,
        requires_confirmation=False,
        audit_required=True,
        enabled=True,
        metadata={
            "contract_version": (
                "agenda-operational-v1"
            ),
            "engine": (
                "edi-intelligence"
            ),
            "pipeline": (
                "pipeline-engine"
            ),
            "deterministic": True,
            "generative_ai_used": False,
            "source": (
                "agenda-operational-snapshot"
            ),
        },
    )


def build_planning_daily_priorities_capability(
) -> Capability:
    """
    Constrói o contrato oficial de prioridades diárias.

    Esta capacidade organiza prioridades operacionais com base
    nas análises já produzidas pelo EIOS.

    Ela não:

    - cria planejamentos automaticamente;
    - altera tarefas;
    - modifica objetivos;
    - registra evidências;
    - executa ações sem autorização;
    - utiliza IA generativa;
    - substitui a decisão profissional do professor.
    """

    return Capability(
        capability_id=(
            PLANNING_DAILY_PRIORITIES_ID
        ),
        title=(
            "Prioridades Diárias do Planejamento"
        ),
        description=(
            "Organiza as principais prioridades operacionais "
            "do professor para o período atual, considerando "
            "planejamentos, objetivos, aulas, evidências, "
            "indicadores e recomendações produzidas pelo EIOS."
        ),
        module="agenda",
        owner="Agenda Inteligente EDI",
        version="1.0.0",
        status=(
            CapabilityStatus.STABLE
        ),
        execution_mode=(
            CapabilityExecutionMode.ANALYSIS
        ),
        risk_level=(
            CapabilityRiskLevel.MODERATE
        ),
        scope=(
            CapabilityScope.USER
        ),
        output_type=(
            CapabilityOutputType.RECOMMENDATION_SET
        ),
        required_roles=(
            "professor",
            "coordenador",
            "diretor",
            "gestor",
            "super_admin",
        ),
        required_context=(
            CapabilityDataRequirement.USER_CONTEXT,
            CapabilityDataRequirement.AGENDA,
            CapabilityDataRequirement.PLANNING,
            CapabilityDataRequirement.OBJECTIVES,
            CapabilityDataRequirement.LESSONS,
            CapabilityDataRequirement.EVIDENCES,
            CapabilityDataRequirement.INDICATORS,
            CapabilityDataRequirement.RECOMMENDATIONS,
        ),
        dependencies=(
            AGENDA_DASHBOARD_INTELLIGENCE_ID,
        ),
        tags=(
            "agenda",
            "planning",
            "priorities",
            "daily",
            "eios",
            "recommendations",
        ),
        estimated_execution_ms=150,
        requires_confirmation=False,
        audit_required=True,
        enabled=True,
        metadata={
            "contract_version": (
                "planning-daily-priorities-v1"
            ),
            "engine": (
                "edi-intelligence"
            ),
            "dependency": (
                AGENDA_DASHBOARD_INTELLIGENCE_ID
            ),
            "deterministic": True,
            "generative_ai_used": False,
            "source": (
                "eios-dashboard-intelligence"
            ),
            "maximum_priorities": 5,
        },
    )


def register_agenda_capabilities(
    registry: CapabilityRegistry | None = None,
) -> tuple[Capability, ...]:
    """
    Registra as capacidades oficiais da Agenda.

    O processo é idempotente: importar ou inicializar o módulo
    mais de uma vez não cria registros duplicados.

    A ordem de registro preserva as dependências:

    1. agenda.dashboard_intelligence;
    2. planning.daily_priorities.
    """

    target_registry = (
        registry
        or capability_registry
    )

    capabilities = (
        build_agenda_dashboard_intelligence_capability(),
        build_planning_daily_priorities_capability(),
    )

    registered_capabilities: list[
        Capability
    ] = []

    for capability in capabilities:
        existing_capability = (
            target_registry.find(
                capability.capability_id,
            )
        )

        if existing_capability is not None:
            registered_capabilities.append(
                existing_capability,
            )
            continue

        registered_capabilities.append(
            target_registry.register(
                capability,
                validate_dependencies=True,
            ),
        )

    return tuple(
        registered_capabilities,
    )