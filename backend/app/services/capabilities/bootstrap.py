from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.services.agenda_handlers import (
    register_agenda_handlers,
)
from app.services.capabilities.calendar_handlers import (
    register_calendar_handlers,
)
from app.services.capabilities.dispatcher import (
    CapabilityDispatcher,
    capability_dispatcher,
)
from app.services.capabilities.evidence_handlers import (
    register_evidence_handlers,
)
from app.services.capabilities.loader import (
    CapabilityLoadReport,
    CapabilityLoader,
    capability_loader,
)
from app.services.capabilities.planning_handlers import (
    register_planning_handlers,
)
from app.services.capabilities.professor_digital_handlers import (
    register_professor_digital_handlers,
)
from app.services.capabilities.registry import (
    CapabilityRegistry,
    capability_registry,
)
from app.services.capabilities.task_handlers import (
    register_task_handlers,
)
from app.services.capabilities.teacher_handlers import (
    register_teacher_handlers,
)


@dataclass(frozen=True)
class CapabilityBootstrapReport:
    load_report: CapabilityLoadReport
    registered_handlers: tuple[str, ...]
    registry_total: int
    dispatcher_summary: dict[str, Any]

    @property
    def success(self) -> bool:
        return (
            not self.dispatcher_summary.get("capabilities_without_handler", [])
            and not self.dispatcher_summary.get("handlers_without_capability", [])
        )

    def to_dict(self) -> dict[str, Any]:
        return {
            "success": self.success,
            "registry_total": self.registry_total,
            "registered_handlers": [*self.registered_handlers],
            "loader": self.load_report.to_dict(),
            "dispatcher": {**self.dispatcher_summary},
        }


class CapabilityBootstrap:
    """Inicializador oficial da Educational Capability Platform."""

    def __init__(
        self,
        *,
        registry: CapabilityRegistry | None = None,
        loader: CapabilityLoader | None = None,
        dispatcher: CapabilityDispatcher | None = None,
    ) -> None:
        self._registry = registry or capability_registry
        self._loader = loader or capability_loader
        self._dispatcher = dispatcher or capability_dispatcher
        self._last_report: CapabilityBootstrapReport | None = None

    @property
    def registry(self) -> CapabilityRegistry:
        return self._registry

    @property
    def loader(self) -> CapabilityLoader:
        return self._loader

    @property
    def dispatcher(self) -> CapabilityDispatcher:
        return self._dispatcher

    @property
    def last_report(self) -> CapabilityBootstrapReport | None:
        return self._last_report

    def initialize(self) -> CapabilityBootstrapReport:
        load_report = self._loader.load_all()
        agenda_handlers = register_agenda_handlers(self._dispatcher)
        planning_handlers = register_planning_handlers(self._dispatcher)
        evidence_handlers = register_evidence_handlers(self._dispatcher)
        task_handlers = register_task_handlers(self._dispatcher)
        calendar_handlers = register_calendar_handlers(self._dispatcher)
        teacher_handlers = register_teacher_handlers(self._dispatcher)
        professor_digital_handlers = register_professor_digital_handlers(
            self._dispatcher,
        )

        registered_handlers = (
            agenda_handlers
            + planning_handlers
            + evidence_handlers
            + task_handlers
            + calendar_handlers
            + teacher_handlers
            + professor_digital_handlers
        )

        dispatcher_summary = self._dispatcher.summary()
        report = CapabilityBootstrapReport(
            load_report=load_report,
            registered_handlers=registered_handlers,
            registry_total=self._registry.count(),
            dispatcher_summary=dispatcher_summary,
        )
        self._last_report = report

        print(
            "[ECP_BOOTSTRAP_COMPLETED]",
            {
                "success": report.success,
                "registry_total": report.registry_total,
                "registered_handlers": len(report.registered_handlers),
                "capabilities_without_handler": len(
                    dispatcher_summary.get("capabilities_without_handler", []),
                ),
                "handlers_without_capability": len(
                    dispatcher_summary.get("handlers_without_capability", []),
                ),
            },
        )
        return report

    def status(self) -> dict[str, Any]:
        if self._last_report is None:
            return {
                "initialized": False,
                "registry_total": self._registry.count(),
                "dispatcher": self._dispatcher.summary(),
            }
        return {"initialized": True, **self._last_report.to_dict()}


capability_bootstrap = CapabilityBootstrap()
