from app.services.capabilities import (
    Capability,
    CapabilityExecutionMode,
    CapabilityOutputType,
    CapabilityRegistry,
    CapabilityRiskLevel,
    CapabilityScope,
    CapabilityStatus,
)


def build_capability(
    capability_id: str,
) -> Capability:
    return Capability(
        capability_id=capability_id,
        name=f"Capability {capability_id}",
        description="Teste",
        module="agenda",
        scope=CapabilityScope.USER,
        execution_mode=CapabilityExecutionMode.SYNCHRONOUS,
        output_type=CapabilityOutputType.STRUCTURED,
        risk_level=CapabilityRiskLevel.LOW,
        status=CapabilityStatus.STABLE,
    )


def test_register_capability():
    registry = CapabilityRegistry()

    capability = build_capability(
        "agenda.dashboard",
    )

    registry.register(capability)

    assert registry.exists(
        "agenda.dashboard",
    )


def test_get_registered_capability():
    registry = CapabilityRegistry()

    capability = build_capability(
        "agenda.dashboard",
    )

    registry.register(capability)

    recovered = registry.get(
        "agenda.dashboard",
    )

    assert recovered.capability_id == "agenda.dashboard"


def test_list_capabilities():
    registry = CapabilityRegistry()

    registry.register(
        build_capability("agenda.dashboard"),
    )

    registry.register(
        build_capability("agenda.evidence"),
    )

    assert len(registry.list()) == 2