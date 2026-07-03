from abc import ABC, abstractmethod
from typing import Any


class BaseProvider(ABC):
    """
    Classe base para todos os provedores de IA.
    """

    @abstractmethod
    def generate(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> dict[str, Any]:
        pass