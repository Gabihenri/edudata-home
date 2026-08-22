from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException

router = APIRouter(
    prefix="/api/v1/intelligence",
    tags=["EDI Intelligence Learning"],
)

ALLOWED_OUTCOMES = {
    "accepted", "rejected", "ignored", "edited",
    "executed", "positive", "neutral", "negative",
}


def _text(value: Any) -> str | None:
    if isinstance(value, str) and value.strip():
        return value.strip()
    return None


def _bool(value: Any) -> bool | None:
    return value if isinstance(value, bool) else None


@router.post("/agenda/feedback")
def record_agenda_feedback(payload: dict[str, Any]) -> dict[str, Any]:
    """Valida e normaliza um sinal de feedback da Agenda EDI."""
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Payload inválido.")

    outcome = _text(payload.get("outcome"))
    if outcome not in ALLOWED_OUTCOMES:
        raise HTTPException(
            status_code=400,
            detail="Outcome de aprendizagem inválido.",
        )

    result = _text(payload.get("result"))
    if result not in {None, "positive", "neutral", "negative"}:
        raise HTTPException(
            status_code=400,
            detail="Resultado de aprendizagem inválido.",
        )

    event = {
        "recommendation_id": _text(payload.get("recommendation_id")),
        "recommendation_type": _text(payload.get("recommendation_type")),
        "module": "agenda",
        "context_type": _text(payload.get("context_type")),
        "outcome": outcome,
        "executed": _bool(payload.get("executed")),
        "result": result,
    }

    return {
        "status": "accepted",
        "contract_version": "learning-v2",
        "event": {
            key: value for key, value in event.items() if value is not None
        },
    }
