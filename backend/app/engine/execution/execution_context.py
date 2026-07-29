from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from hashlib import sha256
from time import perf_counter
from typing import Any
from uuid import uuid4

from app.engine.context import EngineContext


DEFAULT_CONTRACT_VERSION = "agenda-operational-v1"
DEFAULT_MODULE = "platform"


def _utc_now() -> datetime:
    return datetime.now(
        timezone.utc,
    )


def _normalize_optional_text(
    value: Any,
) -> str | None:
    if not isinstance(
        value,
        str,
    ):
        return None

    normalized_value = value.strip()

    return (
        normalized_value
        or None
    )


def _normalize_required_text(
    value: Any,
    fallback: str,
) -> str:
    normalized_value = (
        _normalize_optional_text(
            value,
        )
    )

    return (
        normalized_value
        or fallback
    )


def _isoformat(
    value: datetime | None,
) -> str | None:
    if value is None:
        return None

    return value.isoformat()


@dataclass
class ExecutionContext:
    """
    Contrato central de execução do EDI Intelligence Engine.

    Responsabilidades:

    - identificar unicamente cada execução;
    - registrar início, conclusão e duração;
    - representar o escopo organizacional da análise;
    - produzir uma chave estável de cache;
    - padronizar metadados compartilhados entre produtos;
    - não acessar banco de dados;
    - não executar regras pedagógicas;
    - não substituir o EngineContext.
    """

    execution_id: str

    module: str

    contract_version: str

    organization_id: str | None

    school_id: str | None

    user_id: str | None

    role: str | None

    started_at: datetime

    completed_at: datetime | None

    duration_ms: int | None

    cache_key: str

    metadata: dict[str, Any]

    _started_counter: float

    @classmethod
    def start(
        cls,
        context: EngineContext,
        contract_version: str = DEFAULT_CONTRACT_VERSION,
        metadata: dict[str, Any] | None = None,
    ) -> ExecutionContext:
        """
        Inicia uma nova execução do EIOS.

        O identificador é único para cada processamento.

        A chave de cache é estável para o mesmo:

        - módulo;
        - versão de contrato;
        - organização;
        - escola;
        - usuário;
        - perfil.
        """

        module = _normalize_required_text(
            context.module,
            DEFAULT_MODULE,
        )

        normalized_contract_version = (
            _normalize_required_text(
                contract_version,
                DEFAULT_CONTRACT_VERSION,
            )
        )

        organization_id = (
            _normalize_optional_text(
                context.organization_id,
            )
        )

        school_id = (
            _normalize_optional_text(
                context.school_id,
            )
        )

        user_id = (
            _normalize_optional_text(
                context.user_id,
            )
        )

        role = (
            _normalize_optional_text(
                context.role,
            )
        )

        normalized_metadata = {
            **(
                context.metadata
                if isinstance(
                    context.metadata,
                    dict,
                )
                else {}
            ),
            **(
                metadata
                if isinstance(
                    metadata,
                    dict,
                )
                else {}
            ),
        }

        cache_key = cls.build_cache_key(
            module=module,
            contract_version=(
                normalized_contract_version
            ),
            organization_id=organization_id,
            school_id=school_id,
            user_id=user_id,
            role=role,
        )

        return cls(
            execution_id=str(
                uuid4(),
            ),
            module=module,
            contract_version=(
                normalized_contract_version
            ),
            organization_id=organization_id,
            school_id=school_id,
            user_id=user_id,
            role=role,
            started_at=_utc_now(),
            completed_at=None,
            duration_ms=None,
            cache_key=cache_key,
            metadata=normalized_metadata,
            _started_counter=perf_counter(),
        )

    @staticmethod
    def build_cache_key(
        module: str,
        contract_version: str,
        organization_id: str | None,
        school_id: str | None,
        user_id: str | None,
        role: str | None,
    ) -> str:
        """
        Gera uma chave de cache sem expor identificadores brutos.

        A chave utiliza SHA-256 para evitar que IDs de usuários,
        escolas ou organizações apareçam diretamente em logs,
        respostas ou mecanismos futuros de cache.
        """

        raw_scope = "|".join(
            [
                _normalize_required_text(
                    module,
                    DEFAULT_MODULE,
                ),
                _normalize_required_text(
                    contract_version,
                    DEFAULT_CONTRACT_VERSION,
                ),
                organization_id
                or "no-organization",
                school_id
                or "no-school",
                user_id
                or "no-user",
                role
                or "no-role",
            ],
        )

        scope_hash = (
            sha256(
                raw_scope.encode(
                    "utf-8",
                ),
            )
            .hexdigest()
        )

        return (
            f"eios:"
            f"{_normalize_required_text(module, DEFAULT_MODULE)}:"
            f"{scope_hash}"
        )

    def complete(
        self,
    ) -> None:
        """
        Finaliza a execução e calcula sua duração.

        A duração utiliza contador monotônico para evitar
        inconsistências causadas por alterações no relógio
        do sistema durante o processamento.
        """

        if self.completed_at is not None:
            return

        completed_at = _utc_now()

        elapsed_seconds = (
            perf_counter()
            - self._started_counter
        )

        self.completed_at = completed_at

        self.duration_ms = max(
            round(
                elapsed_seconds
                * 1000,
            ),
            0,
        )

    def fail(
        self,
        error: Exception | str,
    ) -> None:
        """
        Registra metadados mínimos de uma execução com falha.

        Não armazena stack trace, payload, tokens ou dados
        sensíveis dentro do contexto de execução.
        """

        error_type = (
            type(error).__name__
            if isinstance(
                error,
                Exception,
            )
            else "ExecutionError"
        )

        error_message = (
            str(
                error,
            ).strip()
            or "Erro não identificado."
        )

        self.metadata = {
            **self.metadata,
            "status": "failed",
            "error_type": error_type,
            "error_message": error_message,
        }

        self.complete()

    def mark_success(
        self,
    ) -> None:
        """
        Marca a execução como concluída com sucesso.
        """

        self.metadata = {
            **self.metadata,
            "status": "completed",
        }

        self.complete()

    def scope(
        self,
    ) -> dict[str, str | None]:
        """
        Retorna o escopo institucional da execução.
        """

        return {
            "organization_id": (
                self.organization_id
            ),
            "school_id": (
                self.school_id
            ),
            "user_id": (
                self.user_id
            ),
            "role": (
                self.role
            ),
        }

    def to_dict(
        self,
    ) -> dict[str, Any]:
        """
        Serializa somente os metadados seguros da execução.
        """

        return {
            "execution_id": (
                self.execution_id
            ),
            "started_at": (
                _isoformat(
                    self.started_at,
                )
            ),
            "completed_at": (
                _isoformat(
                    self.completed_at,
                )
            ),
            "duration_ms": (
                self.duration_ms
            ),
            "module": (
                self.module
            ),
            "contract_version": (
                self.contract_version
            ),
            "scope": (
                self.scope()
            ),
            "cache_key": (
                self.cache_key
            ),
            "metadata": {
                **self.metadata,
            },
        }