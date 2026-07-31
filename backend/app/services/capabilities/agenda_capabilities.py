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

PLANNING_WEEKLY_ANALYSIS_ID = (
    "planning.weekly_planning_analysis"
)

EVIDENCE_COMPLETION_ANALYSIS_ID = (
    "evidence.completion_analysis"
)

TASKS_SMART_PRIORITIZATION_ID = (
    "tasks.smart_prioritization"
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


def build_planning_weekly_analysis_capability(
) -> Capability:
    """
    Constrói o contrato oficial de análise semanal
    do planejamento docente.

    Esta capacidade analisa coerência, cobertura e continuidade
    do planejamento semanal a partir dos dados já processados
    pelo EIOS.

    Ela não:

    - cria ou altera planejamentos;
    - muda objetivos;
    - registra aulas;
    - modifica evidências;
    - executa recomendações;
    - substitui a análise profissional do professor;
    - utiliza IA generativa.
    """

    return Capability(
        capability_id=(
            PLANNING_WEEKLY_ANALYSIS_ID
        ),
        title=(
            "Análise Semanal do Planejamento"
        ),
        description=(
            "Analisa a consistência do planejamento semanal, "
            "a relação entre objetivos, aulas e evidências, "
            "a cobertura prevista e realizada, os pontos de "
            "atenção e as oportunidades de replanejamento."
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
            CapabilityDataRequirement.INDICATORS,
            CapabilityDataRequirement.RECOMMENDATIONS,
            CapabilityDataRequirement.HISTORY,
        ),
        dependencies=(
            AGENDA_DASHBOARD_INTELLIGENCE_ID,
            PLANNING_DAILY_PRIORITIES_ID,
        ),
        tags=(
            "agenda",
            "planning",
            "weekly",
            "analysis",
            "coverage",
            "coherence",
            "replanning",
            "eios",
        ),
        estimated_execution_ms=250,
        requires_confirmation=False,
        audit_required=True,
        enabled=True,
        metadata={
            "contract_version": (
                "planning-weekly-analysis-v1"
            ),
            "engine": (
                "edi-intelligence"
            ),
            "dependencies": (
                AGENDA_DASHBOARD_INTELLIGENCE_ID,
                PLANNING_DAILY_PRIORITIES_ID,
            ),
            "deterministic": True,
            "generative_ai_used": False,
            "automatic_changes": False,
            "source": (
                "agenda-weekly-operational-cycle"
            ),
            "analysis_dimensions": (
                "coverage",
                "coherence",
                "continuity",
                "evidence_alignment",
                "replanning",
            ),
        },
    )


def build_evidence_completion_analysis_capability(
) -> Capability:
    """
    Constrói o contrato oficial de análise de conclusão
    e integridade das evidências pedagógicas.

    A capacidade identifica pendências e inconsistências
    entre aulas, objetivos e evidências previamente
    autorizados e processados pelo EIOS.

    Ela não:

    - cria evidências;
    - altera arquivos;
    - modifica aulas ou objetivos;
    - acessa diretamente o banco;
    - acessa diretamente o Storage;
    - executa correções automáticas;
    - avalia ou classifica estudantes;
    - utiliza IA generativa;
    - substitui a decisão profissional do professor.
    """

    return Capability(
        capability_id=(
            EVIDENCE_COMPLETION_ANALYSIS_ID
        ),
        title=(
            "Análise de Conclusão das Evidências"
        ),
        description=(
            "Analisa a cobertura, a conclusão e a integridade "
            "dos registros de evidências pedagógicas, "
            "identificando aulas realizadas sem evidência, "
            "objetivos sem comprovação, vínculos incompletos "
            "e pendências que exigem acompanhamento docente."
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
            CapabilityDataRequirement.INDICATORS,
            CapabilityDataRequirement.RECOMMENDATIONS,
            CapabilityDataRequirement.ANALYTICS,
        ),
        dependencies=(
            AGENDA_DASHBOARD_INTELLIGENCE_ID,
            PLANNING_WEEKLY_ANALYSIS_ID,
        ),
        tags=(
            "agenda",
            "evidence",
            "completion",
            "coverage",
            "integrity",
            "objectives",
            "lessons",
            "analytics",
            "eios",
        ),
        estimated_execution_ms=200,
        requires_confirmation=False,
        audit_required=True,
        enabled=True,
        metadata={
            "contract_version": (
                "evidence-completion-analysis-v1"
            ),
            "engine": (
                "edi-intelligence"
            ),
            "dependencies": (
                AGENDA_DASHBOARD_INTELLIGENCE_ID,
                PLANNING_WEEKLY_ANALYSIS_ID,
            ),
            "deterministic": True,
            "generative_ai_used": False,
            "automatic_changes": False,
            "student_assessment": False,
            "file_content_required": False,
            "source": (
                "agenda-evidence-operational-cycle"
            ),
            "analysis_dimensions": (
                "lesson_coverage",
                "objective_coverage",
                "linkage_integrity",
                "completion_status",
                "evidence_backlog",
            ),
        },
    )


def build_tasks_smart_prioritization_capability(
) -> Capability:
    """
    Constrói o contrato oficial de priorização inteligente
    das tarefas do professor.

    A capacidade organiza tarefas previamente autorizadas
    utilizando prazo, prioridade declarada, impacto pedagógico,
    dependências, pendências do planejamento e evidências.

    Ela não:

    - cria tarefas;
    - altera prazos;
    - conclui tarefas automaticamente;
    - exclui registros;
    - modifica prioridades salvas;
    - acessa diretamente o banco;
    - envia notificações;
    - executa ações sem autorização;
    - utiliza IA generativa;
    - substitui a decisão profissional do professor.
    """

    return Capability(
        capability_id=(
            TASKS_SMART_PRIORITIZATION_ID
        ),
        title=(
            "Priorização Inteligente de Tarefas"
        ),
        description=(
            "Organiza as tarefas do professor por urgência, "
            "prazo, prioridade declarada, impacto pedagógico, "
            "dependências e relação com pendências de "
            "planejamento, aulas, objetivos e evidências."
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
            CapabilityDataRequirement.TASKS,
            CapabilityDataRequirement.PLANNING,
            CapabilityDataRequirement.OBJECTIVES,
            CapabilityDataRequirement.LESSONS,
            CapabilityDataRequirement.EVIDENCES,
            CapabilityDataRequirement.INDICATORS,
            CapabilityDataRequirement.RECOMMENDATIONS,
            CapabilityDataRequirement.ANALYTICS,
        ),
        dependencies=(
            PLANNING_DAILY_PRIORITIES_ID,
            PLANNING_WEEKLY_ANALYSIS_ID,
            EVIDENCE_COMPLETION_ANALYSIS_ID,
        ),
        tags=(
            "agenda",
            "tasks",
            "prioritization",
            "deadlines",
            "urgency",
            "pedagogical-impact",
            "dependencies",
            "recommendations",
            "eios",
        ),
        estimated_execution_ms=200,
        requires_confirmation=False,
        audit_required=True,
        enabled=True,
        metadata={
            "contract_version": (
                "tasks-smart-prioritization-v1"
            ),
            "engine": (
                "edi-intelligence"
            ),
            "dependencies": (
                PLANNING_DAILY_PRIORITIES_ID,
                PLANNING_WEEKLY_ANALYSIS_ID,
                EVIDENCE_COMPLETION_ANALYSIS_ID,
            ),
            "deterministic": True,
            "generative_ai_used": False,
            "automatic_changes": False,
            "automatic_completion": False,
            "automatic_notification": False,
            "professional_decision_required": True,
            "source": (
                "agenda-operational-tasks"
            ),
            "maximum_prioritized_tasks": 20,
            "prioritization_dimensions": (
                "deadline",
                "declared_priority",
                "pedagogical_impact",
                "dependencies",
                "planning_alignment",
                "evidence_alignment",
            ),
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
    2. planning.daily_priorities;
    3. planning.weekly_planning_analysis;
    4. evidence.completion_analysis;
    5. tasks.smart_prioritization.
    """

    target_registry = (
        registry
        or capability_registry
    )

    capabilities = (
        build_agenda_dashboard_intelligence_capability(),
        build_planning_daily_priorities_capability(),
        build_planning_weekly_analysis_capability(),
        build_evidence_completion_analysis_capability(),
        build_tasks_smart_prioritization_capability(),
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