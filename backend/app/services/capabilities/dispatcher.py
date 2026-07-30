from __future__ import annotations

from dataclasses import dataclass
from time import perf_counter
from typing import Any, Callable

from app.services.capabilities.capability import (
    Capability,
)
from app.services.capabilities.exceptions import (
    CapabilityAlreadyRegisteredError,
    CapabilityError,
    CapabilityExecutionError,
    CapabilityNotFoundError,
    CapabilityValidationError,
)
from app.services.capabilities.resolver import (
    CapabilityResolution,
    CapabilityResolver,
    capability_resolver,
)


CapabilityHandler = Callable[
    [
        CapabilityResolution,
        dict[str, Any],
    ],
    Any,
]


def _normalize_capability_id(
    value: Any,
) -> str:
    if not isinstance(
        value,
        str,
    ):
        raise CapabilityValidationError(
            "O capability_id deve ser uma string.",
        )

    normalized_value = (
        value
        .strip()
        .lower()
    )

    if not normalized_value:
        raise CapabilityValidationError(
            "O capability_id é obrigatório.",
        )

    return normalized_value


def _normalize_payload(
    value: Any,
) -> dict[str, Any]:
    if value is None:
        return {}

    if not isinstance(
        value,
        dict,
    ):
        raise CapabilityValidationError(
            "O payload da capacidade deve ser um dicionário.",
        )

    return {
        **value,
    }


def _normalize_metadata(
    value: Any,
) -> dict[str, Any]:
    if value is None:
        return {}

    if not isinstance(
        value,
        dict,
    ):
        raise CapabilityValidationError(
            "Os metadados da execução devem ser um dicionário.",
        )

    return {
        **value,
    }


@dataclass(frozen=True)
class CapabilityDispatchResult:
    """
    Contrato padronizado de execução de uma capacidade.

    Não expõe:

    - handler;
    - tokens;
    - credenciais;
    - stack trace;
    - estado interno do Registry;
    - payload original completo.
    """

    capability: Capability

    resolution: CapabilityResolution

    success: bool

    result: Any

    duration_ms: int

    metadata: dict[str, Any]

    @property
    def capability_id(
        self,
    ) -> str:
        return (
            self.capability
            .capability_id
        )

    def to_dict(
        self,
    ) -> dict[str, Any]:
        return {
            "success": (
                self.success
            ),
            "capability_id": (
                self.capability_id
            ),
            "identity": (
                self.capability
                .identity()
            ),
            "duration_ms": (
                self.duration_ms
            ),
            "resolution": (
                self.resolution
                .to_dict()
            ),
            "result": (
                self.result
            ),
            "metadata": {
                **self.metadata,
            },
        }


class CapabilityDispatcher:
    """
    Ponte oficial entre resolução e execução de capacidades.

    Responsabilidades:

    - registrar handlers;
    - impedir duplicidade;
    - localizar handlers;
    - resolver a capacidade antes da execução;
    - encaminhar payload ao handler autorizado;
    - medir duração;
    - devolver contrato padronizado;
    - transformar falhas inesperadas em erro controlado.

    O Dispatcher não:

    - implementa lógica pedagógica;
    - autentica usuários;
    - substitui autorização institucional;
    - acessa banco diretamente;
    - chama motores do EIOS sem um handler registrado;
    - classifica intenções;
    - mantém memória conversacional.
    """

    def __init__(
        self,
        resolver: CapabilityResolver | None = None,
    ) -> None:
        self._resolver = (
            resolver
            or capability_resolver
        )

        self._handlers: dict[
            str,
            CapabilityHandler,
        ] = {}

    @property
    def resolver(
        self,
    ) -> CapabilityResolver:
        return (
            self._resolver
        )

    def register_handler(
        self,
        capability_id: str,
        handler: CapabilityHandler,
        *,
        replace: bool = False,
    ) -> CapabilityHandler:
        """
        Registra o handler responsável por executar uma capacidade.

        O Registry deve conter a capacidade antes do registro
        do handler.
        """

        normalized_id = (
            _normalize_capability_id(
                capability_id,
            )
        )

        self._resolver.registry.get(
            normalized_id,
        )

        if not callable(
            handler,
        ):
            raise CapabilityValidationError(
                "O handler da capacidade deve ser executável.",
                capability_id=(
                    normalized_id
                ),
            )

        if (
            normalized_id
            in self._handlers
            and not replace
        ):
            raise CapabilityAlreadyRegisteredError(
                normalized_id,
            )

        self._handlers[
            normalized_id
        ] = handler

        return handler

    def register(
        self,
        capability_id: str,
        *,
        replace: bool = False,
    ) -> Callable[
        [CapabilityHandler],
        CapabilityHandler,
    ]:
        """
        Decorador para registrar handlers.

        Exemplo:

        @dispatcher.register(
            "planning.daily_priorities",
        )
        def execute_priorities(
            resolution,
            payload,
        ):
            ...
        """

        def decorator(
            handler: CapabilityHandler,
        ) -> CapabilityHandler:
            return self.register_handler(
                capability_id,
                handler,
                replace=replace,
            )

        return decorator

    def unregister_handler(
        self,
        capability_id: str,
    ) -> CapabilityHandler:
        normalized_id = (
            _normalize_capability_id(
                capability_id,
            )
        )

        handler = (
            self._handlers
            .get(
                normalized_id,
            )
        )

        if handler is None:
            raise CapabilityNotFoundError(
                normalized_id,
            )

        return (
            self._handlers
            .pop(
                normalized_id,
            )
        )

    def get_handler(
        self,
        capability_id: str,
    ) -> CapabilityHandler:
        normalized_id = (
            _normalize_capability_id(
                capability_id,
            )
        )

        handler = (
            self._handlers
            .get(
                normalized_id,
            )
        )

        if handler is None:
            raise CapabilityExecutionError(
                normalized_id,
                reason=(
                    "Nenhum handler foi registrado "
                    "para esta capacidade."
                ),
            )

        return handler

    def has_handler(
        self,
        capability_id: str,
    ) -> bool:
        normalized_id = (
            _normalize_capability_id(
                capability_id,
            )
        )

        return (
            normalized_id
            in self._handlers
        )

    def dispatch(
        self,
        capability_id: str,
        *,
        payload: dict[str, Any] | None = None,
        role: str | None = None,
        context: (
            dict[str, Any]
            | list[str]
            | tuple[str, ...]
            | set[str]
            | frozenset[str]
            | None
        ) = None,
        confirmation_provided: bool = False,
        allow_experimental: bool = False,
        allow_beta: bool = True,
        allow_deprecated: bool = False,
        require_stable: bool = False,
        metadata: dict[str, Any] | None = None,
    ) -> CapabilityDispatchResult:
        """
        Resolve e executa uma capacidade registrada.

        Erros controlados do domínio são preservados.

        Falhas inesperadas do handler são convertidas em
        CapabilityExecutionError sem expor stack trace.
        """

        normalized_id = (
            _normalize_capability_id(
                capability_id,
            )
        )

        normalized_payload = (
            _normalize_payload(
                payload,
            )
        )

        normalized_metadata = (
            _normalize_metadata(
                metadata,
            )
        )

        resolution = (
            self._resolver
            .resolve(
                normalized_id,
                role=role,
                context=context,
                confirmation_provided=(
                    confirmation_provided
                ),
                allow_experimental=(
                    allow_experimental
                ),
                allow_beta=(
                    allow_beta
                ),
                allow_deprecated=(
                    allow_deprecated
                ),
                require_stable=(
                    require_stable
                ),
            )
        )

        handler = self.get_handler(
            normalized_id,
        )

        started_counter = (
            perf_counter()
        )

        try:
            result = handler(
                resolution,
                normalized_payload,
            )

        except CapabilityError:
            raise

        except Exception as error:
            duration_ms = max(
                round(
                    (
                        perf_counter()
                        - started_counter
                    )
                    * 1000,
                ),
                0,
            )

            print(
                "[ECP_CAPABILITY_EXECUTION_ERROR]",
                {
                    "capability_id": (
                        normalized_id
                    ),
                    "identity": (
                        resolution
                        .capability
                        .identity()
                    ),
                    "duration_ms": (
                        duration_ms
                    ),
                    "error_type": (
                        type(
                            error,
                        ).__name__
                    ),
                },
            )

            raise CapabilityExecutionError(
                normalized_id,
                reason=(
                    "O handler apresentou uma falha inesperada."
                ),
            ) from error

        duration_ms = max(
            round(
                (
                    perf_counter()
                    - started_counter
                )
                * 1000,
            ),
            0,
        )

        dispatch_metadata = {
            "module": (
                resolution
                .capability
                .module
            ),
            "execution_mode": (
                resolution
                .capability
                .execution_mode
                .value
            ),
            "risk_level": (
                resolution
                .capability
                .risk_level
                .value
            ),
            "audit_required": (
                resolution
                .capability
                .audit_required
            ),
            **normalized_metadata,
        }

        print(
            "[ECP_CAPABILITY_EXECUTED]",
            {
                "capability_id": (
                    normalized_id
                ),
                "identity": (
                    resolution
                    .capability
                    .identity()
                ),
                "duration_ms": (
                    duration_ms
                ),
                "module": (
                    resolution
                    .capability
                    .module
                ),
                "execution_mode": (
                    resolution
                    .capability
                    .execution_mode
                    .value
                ),
                "risk_level": (
                    resolution
                    .capability
                    .risk_level
                    .value
                ),
                "audit_required": (
                    resolution
                    .capability
                    .audit_required
                ),
            },
        )

        return CapabilityDispatchResult(
            capability=(
                resolution
                .capability
            ),
            resolution=(
                resolution
            ),
            success=True,
            result=(
                result
            ),
            duration_ms=(
                duration_ms
            ),
            metadata=(
                dispatch_metadata
            ),
        )

    def execute(
        self,
        capability_id: str,
        **kwargs: Any,
    ) -> dict[str, Any]:
        """
        Atalho para execução com resultado serializado.
        """

        return (
            self.dispatch(
                capability_id,
                **kwargs,
            )
            .to_dict()
        )

    def list_handlers(
        self,
    ) -> tuple[str, ...]:
        return tuple(
            sorted(
                self._handlers
                .keys(),
            ),
        )

    def clear_handlers(
        self,
    ) -> None:
        self._handlers.clear()

    def summary(
        self,
    ) -> dict[str, Any]:
        registered_capabilities = (
            self._resolver
            .registry
            .count()
        )

        handlers = (
            self.list_handlers()
        )

        capabilities_without_handler = [
            capability
            .capability_id
            for capability
            in self._resolver
            .registry
            .list()
            if capability.capability_id
            not in self._handlers
        ]

        handlers_without_capability = [
            capability_id
            for capability_id
            in handlers
            if not self._resolver
            .registry
            .contains(
                capability_id,
            )
        ]

        return {
            "registered_capabilities": (
                registered_capabilities
            ),
            "registered_handlers": (
                len(
                    handlers,
                )
            ),
            "capabilities_without_handler": (
                capabilities_without_handler
            ),
            "handlers_without_capability": (
                handlers_without_capability
            ),
        }

    def to_dict(
        self,
    ) -> dict[str, Any]:
        return {
            "summary": (
                self.summary()
            ),
            "handlers": [
                *self.list_handlers(),
            ],
        }


capability_dispatcher = (
    CapabilityDispatcher()
)