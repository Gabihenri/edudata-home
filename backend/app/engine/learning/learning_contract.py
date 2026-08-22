from __future__ import annotations

from typing import Any, TypedDict


class LearningEvent(TypedDict, total=False):
    """Contrato seguro de um evento de aprendizagem da Agenda EDI."""

    recommendation_id: str
    outcome: str
    recommendation_type: str
    module: str
    context_type: str
    executed: bool
    result: str
    organization_id: str
    school_id: str
    user_id: str


def to_persistable_event(
    event: dict[str, Any],
    *,
    organization_id: str | None = None,
    school_id: str | None = None,
    user_id: str | None = None,
) -> LearningEvent:
    """Remove campos desconhecidos antes de persistir feedback."""

    allowed = {
        "recommendation_id",
        "outcome",
        "recommendation_type",
        "module",
        "context_type",
        "executed",
        "result",
    }
    persisted: LearningEvent = {
        key: value
        for key, value in event.items()
        if key in allowed and value is not None
    }

    if organization_id:
        persisted["organization_id"] = organization_id
    if school_id:
        persisted["school_id"] = school_id
    if user_id:
        persisted["user_id"] = user_id

    return persisted
