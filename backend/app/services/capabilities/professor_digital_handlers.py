from __future__ import annotations

from collections import Counter
from typing import Any

from app.services.capabilities.dispatcher import (
    CapabilityDispatcher,
    capability_dispatcher,
)
from app.services.capabilities.professor_digital_capabilities import (
    PROFESSIONAL_TRAJECTORY_INTELLIGENCE_ID,
)
from app.services.capabilities.resolver import (
    CapabilityResolution,
)


MAXIMUM_THEMES = 5
MAXIMUM_REFLECTIVE_QUESTIONS = 3
MAXIMUM_DEVELOPMENT_POSSIBILITIES = 3


def _record(value: Any) -> dict[str, Any]:
    return {**value} if isinstance(value, dict) else {}


def _records(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []
    return [{**item} for item in value if isinstance(item, dict)]


def _text(value: Any) -> str:
    return value.strip() if isinstance(value, str) else ""


def _keywords(value: Any) -> list[str]:
    text = _text(value).lower()
    if not text:
        return []
    separators = [",", ";", "\n", "/"]
    for separator in separators:
        text = text.replace(separator, "|")
    return [item.strip() for item in text.split("|") if item.strip()]


def _extract_themes(context: dict[str, Any], history: list[dict[str, Any]]) -> list[str]:
    candidates: list[str] = []
    for key in ("interests", "themes", "knowledge_interests"):
        candidates.extend(_keywords(context.get(key)))

    for item in history:
        for key in ("theme", "area", "category", "title", "tags"):
            value = item.get(key)
            if isinstance(value, list):
                candidates.extend(_text(entry).lower() for entry in value)
            else:
                candidates.extend(_keywords(value))

    counter = Counter(item for item in candidates if item)
    return [theme for theme, _ in counter.most_common(MAXIMUM_THEMES)]


def _build_summary(context: dict[str, Any], history: list[dict[str, Any]], themes: list[str]) -> str:
    objective = _text(context.get("development_objective") or context.get("objective"))
    production_count = len(history)

    if production_count and themes:
        return (
            f"Nesta leitura inicial, o EIOS encontrou {production_count} registros autorizados "
            f"e conexões recorrentes com {', '.join(themes[:3])}. "
            "Use essa síntese como ponto de partida para interpretar sua própria trajetória."
        )
    if production_count:
        return (
            f"Você possui {production_count} registros autorizados disponíveis para reflexão. "
            "Com mais contexto e produções selecionadas, o EIOS poderá identificar conexões ao longo do tempo."
        )
    if objective:
        return (
            "Seu objetivo de desenvolvimento foi registrado como ponto de partida. "
            "À medida que você selecionar experiências e produções para sua trajetória, o EIOS poderá relacioná-las a esse objetivo."
        )
    return (
        "Ainda há poucos elementos para uma leitura da trajetória. Você pode começar registrando um objetivo, "
        "selecionando produções ou autorizando experiências que deseja usar na sua reflexão profissional."
    )


def _build_questions(context: dict[str, Any], themes: list[str], history_count: int) -> list[str]:
    questions: list[str] = []
    objective = _text(context.get("development_objective") or context.get("objective"))

    if themes:
        questions.append(
            f"A conexão entre {', '.join(themes[:2])} faz sentido para a trajetória que você deseja construir?"
        )
    if objective:
        questions.append(
            "O que, nas experiências que você selecionou, ajuda a aproximá-lo do objetivo que declarou?"
        )
    if history_count:
        questions.append(
            "Qual dessas experiências merece ser preservada, aprofundada ou transformada em um próximo projeto?"
        )
    else:
        questions.append(
            "Qual experiência recente você considera importante o suficiente para se tornar parte da sua memória profissional?"
        )

    return questions[:MAXIMUM_REFLECTIVE_QUESTIONS]


def _build_development_possibilities(context: dict[str, Any], themes: list[str]) -> list[str]:
    possibilities: list[str] = []
    objective = _text(context.get("development_objective") or context.get("objective"))

    if objective:
        possibilities.append(
            "Relacionar o objetivo declarado às experiências e produções que você considera mais significativas."
        )
    if themes:
        possibilities.append(
            "Explorar se os temas recorrentes podem formar uma linha de aprofundamento ou um novo projeto profissional."
        )
    possibilities.append(
        "Conhecer, quando disponível, formações ou experiências da EduData Academy relacionadas aos interesses que você confirmar."
    )

    return possibilities[:MAXIMUM_DEVELOPMENT_POSSIBILITIES]


def professional_trajectory_intelligence_handler(
    resolution: CapabilityResolution,
    payload: dict[str, Any],
) -> dict[str, Any]:
    """Produz uma leitura determinística e reflexiva da trajetória profissional.

    A função trabalha exclusivamente com os dados fornecidos pelo fluxo autorizado
    e não calcula nota, ranking, perfil psicológico ou avaliação institucional.
    """
    context = _record(payload.get("user_context"))
    history = _records(payload.get("history"))
    themes = _extract_themes(context, history)

    return {
        "capability_id": PROFESSIONAL_TRAJECTORY_INTELLIGENCE_ID,
        "capability_title": resolution.capability.title,
        "summary": _build_summary(context, history, themes),
        "recurring_themes": themes,
        "history_count": len(history),
        "reflective_questions": _build_questions(context, themes, len(history)),
        "development_possibilities": _build_development_possibilities(context, themes),
        "guardrails": {
            "institutional_evaluation": False,
            "professional_score": False,
            "psychological_assessment": False,
            "automatic_decision": False,
            "requires_user_interpretation": True,
        },
    }


def register_professor_digital_handlers(
    dispatcher: CapabilityDispatcher | None = None,
) -> tuple[str, ...]:
    target_dispatcher = dispatcher or capability_dispatcher
    target_dispatcher.register(
        PROFESSIONAL_TRAJECTORY_INTELLIGENCE_ID,
        professional_trajectory_intelligence_handler,
    )
    return (PROFESSIONAL_TRAJECTORY_INTELLIGENCE_ID,)
