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


PROFESSIONAL_TRAJECTORY_INTELLIGENCE_ID = (
    "professor_digital.professional_trajectory_intelligence"
)


def build_professional_trajectory_intelligence_capability() -> Capability:
    """Define o contrato oficial da inteligência da trajetória profissional.

    Esta capacidade pertence ao EIOS e produz subsídios para autoanálise
    profissional a partir de contexto e dados explicitamente autorizados.

    Ela não avalia desempenho institucional, não produz diagnósticos
    psicológicos, não atribui notas ou rótulos e não toma decisões pelo
    educador.
    """
    return Capability(
        capability_id=PROFESSIONAL_TRAJECTORY_INTELLIGENCE_ID,
        title="Inteligência da Trajetória Profissional",
        description=(
            "Analisa contexto, objetivos, produções e evidências profissionais "
            "autorizadas para produzir sínteses, conexões e perguntas reflexivas "
            "que apoiem o desenvolvimento do educador."
        ),
        module="professor_digital",
        owner="Professor Digital",
        version="1.0.0",
        status=CapabilityStatus.STABLE,
        execution_mode=CapabilityExecutionMode.ANALYSIS,
        risk_level=CapabilityRiskLevel.MODERATE,
        scope=CapabilityScope.USER,
        output_type=CapabilityOutputType.ANALYSIS,
        required_roles=("professor",),
        required_context=(
            CapabilityDataRequirement.USER_CONTEXT,
            CapabilityDataRequirement.OBJECTIVES,
            CapabilityDataRequirement.HISTORY,
        ),
        dependencies=(),
        tags=(
            "professor-digital",
            "eios",
            "professional-development",
            "reflection",
            "trajectory",
        ),
        estimated_execution_ms=300,
        requires_confirmation=False,
        audit_required=True,
        enabled=True,
        metadata={
            "contract_version": "professional-trajectory-v1",
            "engine": "edi-intelligence",
            "pipeline": "pipeline-engine",
            "source_control": "user-authorized-data-only",
            "deterministic": True,
            "generative_ai_used": False,
            "institutional_evaluation": False,
            "psychological_assessment": False,
            "automatic_decisions": False,
            "analysis_dimensions": (
                "trajectory_summary",
                "production_connections",
                "recurring_themes",
                "reflective_questions",
                "development_possibilities",
            ),
        },
    )


def register_professor_digital_capabilities(
    registry: CapabilityRegistry | None = None,
) -> tuple[Capability, ...]:
    """Registra as capacidades oficiais do Professor Digital no EIOS.

    O registro é idempotente para permitir reinicializações seguras do
    Educational Capability Platform.
    """
    target_registry = registry or capability_registry
    capability = build_professional_trajectory_intelligence_capability()

    existing_capability = target_registry.find(capability.capability_id)
    if existing_capability is not None:
        return (existing_capability,)

    registered_capability = target_registry.register(
        capability,
        validate_dependencies=True,
    )

    return (registered_capability,)
