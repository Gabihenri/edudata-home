from typing import Any

from app.engine.providers.base_provider import BaseProvider


class ClaudeProvider(BaseProvider):
    """
    Provider oficial para Claude.
    """

    def generate(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> dict[str, Any]:

        return {
            "provider": "claude",
            "system_prompt": system_prompt,
            "user_prompt": user_prompt,
            "status": "ready",
        }