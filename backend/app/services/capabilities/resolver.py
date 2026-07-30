from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.services.capabilities.capability import (
    Capability,
)
from app.services.capabilities.capability_types import (
    CapabilityDataRequirement,
    CapabilityStatus,
)
from app.services.capabilities.exceptions import (
    CapabilityConfirmationRequiredError,
    CapabilityContextMissingError,
    CapabilityDependencyError,
    CapabilityPermissionDeniedError,
    CapabilityUnavailableError,
    CapabilityValidationError,
)
from app.services.capabilities.registry import (
    CapabilityRegistry,
    capability_registry,
)


def _normalize_optional_text(
    value: Any,
) -> str | None:
    if value is None:
        return None

    if not isinstance(
        value,
        str,
    ):
        raise CapabilityValidationError(
            "O valor informado deve ser uma string ou None.",
        )

    normalized_value = (
        value
        .strip()
        .lower()
    )

    return (
        normalized_value
        or None
    )


def _normalize_context_keys(
    context: Any,
) -> frozenset[str]:
    """
    Normaliza as chaves de contexto fornecidas.

    O Resolver verifica apenas se o contexto foi declarado.

    Ele não inspeciona conteúdo pedagógico, arquivos,
    tokens, credenciais ou valores sensíveis.
    """

    if context is None:
        return frozenset()

    if isinstance(
        context,
        dict,
    ):
        raw_keys = (
            context.keys()
        )

    elif isinstance(
        context,
        (
            list,
            tuple,
            set,
            frozenset,
        ),
    ):
        raw_keys = context

    else:
        raise CapabilityValidationError(
            (
                "O contexto deve ser um dicionário "
                "ou uma coleção de identificadores."
            ),
        )

    normalized_keys: set[str] = set()

    for key in raw_keys:
        if not isinstance(
            key,
            str,
        ):
            raise CapabilityValidationError(
                (
                    "Todos os identificadores de contexto "
                    "devem ser strings."
                ),
            )

        normalized_key = (
            key
            .strip()
            .lower()
        )

        if normalized_key:
            normalized_keys.add(
                normalized_key,
            )

    return frozenset(
        normalized_keys,
    )


@dataclass(frozen=True)
class CapabilityResolution:
    """
    Resultado seguro da resolução de uma capacidade.

    Este contrato pode ser utilizado pelo futuro Dispatcher
    e pelos agentes da plataforma.

    Ele não contém:

    - payload operacional;
    - conteúdo pedagógico;
    - tokens;
    - credenciais;
    - handlers de execução;
    - objetos de banco de dados.
    """

    capability: Capability

    role: str | None

    provided_context: tuple[str, ...]

    resolved_dependencies: tuple[
        Capability,
        ...,
    ]

    confirmation_provided: bool

    @property
    def capability_id(
        self,
    ) -> str:
        return (
            self.capability
            .capability_id
        )

    @property
    def ready(
        self,
    ) -> bool:
        return True

    def to_dict(
        self,
    ) -> dict[str, Any]:
        return {
            "ready": (
                self.ready
            ),
            "capability": (
                self.capability
                .to_dict()
            ),
            "resolution": {
                "role": (
                    self.role
                ),
                "provided_context": [
                    *self.provided_context,
                ],
                "resolved_dependencies": [
                    dependency
                    .capability_id
                    for dependency
                    in self.resolved_dependencies
                ],
                "confirmation_provided": (
                    self.confirmation_provided
                ),
            },
        }


class CapabilityResolver:
    """
    Resolve uma capacidade antes de sua execução.

    Responsabilidades:

    - localizar a capacidade no Registry;
    - validar disponibilidade;
    - validar perfil autorizado;
    - validar contextos obrigatórios;
    - validar dependências;
    - validar confirmação explícita;
    - devolver um contrato seguro de resolução.

    O Resolver não:

    - executa capacidades;
    - acessa banco de dados;
    - chama o EIOS;
    - altera registros;
    - classifica intenções;
    - implementa regras pedagógicas;
    - substitui a camada de autorização da plataforma.
    """

    def __init__(
        self,
        registry: CapabilityRegistry | None = None,
    ) -> None:
        self._registry = (
            registry
            or capability_registry
        )

    @property
    def registry(
        self,
    ) -> CapabilityRegistry:
        return self._registry

    def resolve(
        self,
        capability_id: str,
        *,
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
    ) -> CapabilityResolution:
        """
        Resolve uma capacidade e interrompe o processo
        quando qualquer requisito não é atendido.

        A confirmação é validada somente quando a entidade
        declara requires_confirmation=True.
        """

        if not isinstance(
            confirmation_provided,
            bool,
        ):
            raise CapabilityValidationError(
                (
                    "O campo 'confirmation_provided' "
                    "deve ser booleano."
                ),
                capability_id=(
                    capability_id
                    if isinstance(
                        capability_id,
                        str,
                    )
                    else None
                ),
            )

        if not isinstance(
            allow_experimental,
            bool,
        ):
            raise CapabilityValidationError(
                (
                    "O campo 'allow_experimental' "
                    "deve ser booleano."
                ),
            )

        if not isinstance(
            allow_beta,
            bool,
        ):
            raise CapabilityValidationError(
                (
                    "O campo 'allow_beta' "
                    "deve ser booleano."
                ),
            )

        if not isinstance(
            allow_deprecated,
            bool,
        ):
            raise CapabilityValidationError(
                (
                    "O campo 'allow_deprecated' "
                    "deve ser booleano."
                ),
            )

        if not isinstance(
            require_stable,
            bool,
        ):
            raise CapabilityValidationError(
                (
                    "O campo 'require_stable' "
                    "deve ser booleano."
                ),
            )

        capability = (
            self._registry
            .get(
                capability_id,
            )
        )

        normalized_role = (
            _normalize_optional_text(
                role,
            )
        )

        provided_context = (
            _normalize_context_keys(
                context,
            )
        )

        self._validate_availability(
            capability,
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

        self._validate_role(
            capability,
            normalized_role,
        )

        self._validate_context(
            capability,
            provided_context,
        )

        resolved_dependencies = (
            self._validate_dependencies(
                capability,
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

        self._validate_confirmation(
            capability,
            confirmation_provided,
        )

        return CapabilityResolution(
            capability=(
                capability
            ),
            role=(
                normalized_role
            ),
            provided_context=tuple(
                sorted(
                    provided_context,
                ),
            ),
            resolved_dependencies=(
                resolved_dependencies
            ),
            confirmation_provided=(
                confirmation_provided
            ),
        )

    def can_resolve(
        self,
        capability_id: str,
        *,
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
    ) -> bool:
        """
        Verifica se uma capacidade pode ser resolvida.

        Retorna False para erros controlados do domínio.
        """

        try:
            self.resolve(
                capability_id,
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

            return True

        except (
            CapabilityUnavailableError,
            CapabilityPermissionDeniedError,
            CapabilityContextMissingError,
            CapabilityDependencyError,
            CapabilityConfirmationRequiredError,
        ):
            return False

    def explain(
        self,
        capability_id: str,
        *,
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
    ) -> dict[str, Any]:
        """
        Produz um diagnóstico seguro da resolução.

        Útil para testes, BackOffice e observabilidade.
        """

        try:
            resolution = (
                self.resolve(
                    capability_id,
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

            return {
                "success": True,
                "resolution": (
                    resolution
                    .to_dict()
                ),
            }

        except (
            CapabilityUnavailableError,
            CapabilityPermissionDeniedError,
            CapabilityContextMissingError,
            CapabilityDependencyError,
            CapabilityConfirmationRequiredError,
        ) as error:
            return error.to_dict()

    @staticmethod
    def _validate_availability(
        capability: Capability,
        *,
        allow_experimental: bool,
        allow_beta: bool,
        allow_deprecated: bool,
        require_stable: bool,
    ) -> None:
        if not capability.enabled:
            raise CapabilityUnavailableError(
                capability.capability_id,
                reason=(
                    "A capacidade está desabilitada."
                ),
            )

        if (
            capability.status
            is CapabilityStatus.DISABLED
        ):
            raise CapabilityUnavailableError(
                capability.capability_id,
                reason=(
                    "A capacidade possui status disabled."
                ),
            )

        if (
            capability.status
            is CapabilityStatus.DRAFT
        ):
            raise CapabilityUnavailableError(
                capability.capability_id,
                reason=(
                    "Capacidades em rascunho "
                    "não podem ser resolvidas."
                ),
            )

        if (
            capability.status
            is CapabilityStatus.EXPERIMENTAL
            and not allow_experimental
        ):
            raise CapabilityUnavailableError(
                capability.capability_id,
                reason=(
                    "A capacidade é experimental."
                ),
            )

        if (
            capability.status
            is CapabilityStatus.BETA
            and not allow_beta
        ):
            raise CapabilityUnavailableError(
                capability.capability_id,
                reason=(
                    "Capacidades beta não estão "
                    "autorizadas neste fluxo."
                ),
            )

        if (
            capability.status
            is CapabilityStatus.DEPRECATED
            and not allow_deprecated
        ):
            raise CapabilityUnavailableError(
                capability.capability_id,
                reason=(
                    "A capacidade está obsoleta."
                ),
            )

        if (
            require_stable
            and capability.status
            is not CapabilityStatus.STABLE
        ):
            raise CapabilityUnavailableError(
                capability.capability_id,
                reason=(
                    "Este fluxo aceita apenas "
                    "capacidades estáveis."
                ),
            )

    @staticmethod
    def _validate_role(
        capability: Capability,
        role: str | None,
    ) -> None:
        if capability.supports_role(
            role,
        ):
            return

        raise CapabilityPermissionDeniedError(
            capability.capability_id,
            role=role,
        )

    @staticmethod
    def _validate_context(
        capability: Capability,
        provided_context: frozenset[str],
    ) -> None:
        required_context = {
            requirement.value
            for requirement
            in capability.required_context
        }

        missing_context = sorted(
            required_context
            - provided_context,
        )

        if missing_context:
            raise CapabilityContextMissingError(
                capability.capability_id,
                missing_context=(
                    missing_context
                ),
            )

    def _validate_dependencies(
        self,
        capability: Capability,
        *,
        allow_experimental: bool,
        allow_beta: bool,
        allow_deprecated: bool,
        require_stable: bool,
    ) -> tuple[
        Capability,
        ...,
    ]:
        dependencies = (
            self._registry
            .validate_dependencies(
                capability,
                require_available=False,
            )
        )

        unavailable_dependencies: list[
            str
        ] = []

        for dependency in dependencies:
            try:
                self._validate_availability(
                    dependency,
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

            except CapabilityUnavailableError:
                unavailable_dependencies.append(
                    dependency.capability_id,
                )

        if unavailable_dependencies:
            raise CapabilityDependencyError(
                capability.capability_id,
                missing_dependencies=(
                    unavailable_dependencies
                ),
            )

        return dependencies

    @staticmethod
    def _validate_confirmation(
        capability: Capability,
        confirmation_provided: bool,
    ) -> None:
        if (
            capability.requires_confirmation
            and not confirmation_provided
        ):
            raise CapabilityConfirmationRequiredError(
                capability.capability_id,
            )


capability_resolver = (
    CapabilityResolver()
)