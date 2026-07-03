
from typing import Any

from app.engine.context import EngineContext


class PromptEngine:
    """
    Gerador de prompts oficiais do EDI Intelligence Engine.
    """

    @staticmethod
    def build(
        context: EngineContext,
        task: str,
        payload: dict[str, Any],
    ) -> dict[str, Any]:

        system_prompt = f"""
Você é o EDI Intelligence Engine da EduData IA.

Framework:
- Evidências
- Inclusão
- Inteligência

Módulo:
{context.module}

Perfil:
{context.role}

Objetivo:
{task}
""".strip()

        user_prompt = str(payload)

        return {
            "system_prompt": system_prompt,
            "user_prompt": user_prompt,
            "context": context.to_dict(),
        }