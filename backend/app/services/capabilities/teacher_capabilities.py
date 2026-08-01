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
from app.services.capabilities.agenda_capabilities import (
    AGENDA_DASHBOARD_INTELLIGENCE_ID,
    CALENDAR_WORKLOAD_BALANCE_ID,
    EVIDENCE_COMPLETION_ANALYSIS_ID,
    PLANNING_DAILY_PRIORITIES_ID,
    PLANNING_WEEKLY_ANALYSIS_ID,
    TASKS_SMART_PRIORITIZATION_ID,
)


TEACHER_PERFORMANCE_SNAPSHOT_ID = (
    "teacher.performance_snapshot"
)


def build_teacher_performance_snapshot_capability(
) -> Capability:
    """
    Constrói o contrato oficial do snapshot consolidado
    de desempenho operacional docente.

    A capacidade agrega resultados previamente produzidos
    pelas capacidades da Agenda Inteligente EDI.

    Ela não:

    - recalcula as capacidades dependentes;
    - avalia estudantes;
    - classifica a qualidade profissional do professor;
    - cria ou altera planejamentos;
    - cria ou altera evidências;
    - conclui ou modifica tarefas;
    - altera eventos ou aulas;
    - acessa diretamente banco ou Storage;
    - executa ações automáticas;
    - utiliza IA generativa;
    - substitui a análise profissional ou institucional.
    """

    return Capability(
        capability_id=(
            TEACHER_PERFORMANCE_SNAPSHOT_ID
        ),
        title=(
            "Snapshot de Desempenho Operacional Docente"
        ),
        description=(
            "Consolida em uma única visão os resultados "
            "operacionais de planejamento, evidências, tarefas, "
            "calendário, prioridades e indicadores do professor, "
            "produzindo score geral EDI, status, pontos fortes, "
            "riscos, recomendações e próximas ações."
        ),
        module="teacher",
        owner="EIOS — Core Compartilhado",
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
            CapabilityDataRequirement.CALENDAR,
            CapabilityDataRequirement.PLANNING,
            CapabilityDataRequirement.OBJECTIVES,
            CapabilityDataRequirement.LESSONS,
            CapabilityDataRequirement.EVIDENCES,
            CapabilityDataRequirement.TASKS,
            CapabilityDataRequirement.INDICATORS,
            CapabilityDataRequirement.RECOMMENDATIONS,
            CapabilityDataRequirement.ANALYTICS,
            CapabilityDataRequirement.HISTORY,
        ),
        dependencies=(
            AGENDA_DASHBOARD_INTELLIGENCE_ID,
            PLANNING_DAILY_PRIORITIES_ID,
            PLANNING_WEEKLY_ANALYSIS_ID,
            EVIDENCE_COMPLETION_ANALYSIS_ID,
            TASKS_SMART_PRIORITIZATION_ID,
            CALENDAR_WORKLOAD_BALANCE_ID,
        ),
        tags=(
            "teacher",
            "performance",
            "snapshot",
            "dashboard",
            "planning",
            "evidences",
            "tasks",
            "calendar",
            "indicators",
            "recommendations",
            "eios",
        ),
        estimated_execution_ms=300,
        requires_confirmation=False,
        audit_required=True,
        enabled=True,
        metadata={
            "contract_version": (
                "teacher-performance-snapshot-v1"
            ),
            "engine": (
                "edi-intelligence"
            ),
            "architecture_layer": (
                "eios-shared-core"
            ),
            "dependencies": (
                AGENDA_DASHBOARD_INTELLIGENCE_ID,
                PLANNING_DAILY_PRIORITIES_ID,
                PLANNING_WEEKLY_ANALYSIS_ID,
                EVIDENCE_COMPLETION_ANALYSIS_ID,
                TASKS_SMART_PRIORITIZATION_ID,
                CALENDAR_WORKLOAD_BALANCE_ID,
            ),
            "deterministic": True,
            "generative_ai_used": False,
            "automatic_changes": False,
            "student_assessment": False,
            "professional_classification": False,
            "professional_decision_required": True,
            "database_access_required": False,
            "storage_access_required": False,
            "source": (
                "eios-consolidated-teacher-intelligence"
            ),
            "snapshot_sections": (
                "overall_score",
                "operational_status",
                "planning",
                "evidences",
                "tasks",
                "calendar",
                "indicators",
                "risks",
                "strengths",
                "priorities",
                "recommendations",
                "next_actions",
                "history",
            ),
            "consumer_products": (
                "agenda-inteligente-edi",
                "professor-digital",
                "edudata-analytics",
                "sgpa",
                "backoffice",
            ),
        },
    )


def register_teacher_capabilities(
    registry: CapabilityRegistry | None = None,
) -> tuple[Capability, ...]:
    """
    Registra as capacidades oficiais de inteligência docente.

    O processo é idempotente e preserva as dependências
    previamente registradas pelas capacidades da Agenda.
    """

    target_registry = (
        registry
        or capability_registry
    )

    capability = (
        build_teacher_performance_snapshot_capability()
    )

    existing_capability = (
        target_registry.find(
            capability.capability_id,
        )
    )

    if existing_capability is not None:
        return (
            existing_capability,
        )

    registered_capability = (
        target_registry.register(
            capability,
            validate_dependencies=True,
        )
    )

    return (
        registered_capability,
    )