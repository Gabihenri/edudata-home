from dataclasses import dataclass
from typing import Any, Optional


@dataclass
class EngineContext:
    """
    Contexto compartilhado entre todos os módulos
    da EduData IA.
    """

    organization_id: Optional[str] = None
    school_id: Optional[str] = None
    user_id: Optional[str] = None

    module: Optional[str] = None

    role: Optional[str] = None

    metadata: dict[str, Any] | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "organization_id": self.organization_id,
            "school_id": self.school_id,
            "user_id": self.user_id,
            "module": self.module,
            "role": self.role,
            "metadata": self.metadata or {},
        }
