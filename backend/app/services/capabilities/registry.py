from __future__ import annotations

from collections.abc import Iterable
from typing import Any

from app.services.capabilities.capability import (
    Capability,
)
from app.services.capabilities.capability_types import (
    CapabilityStatus,
)
from app.services.capabilities.exceptions import (
    CapabilityAlreadyRegisteredError,
    CapabilityDependencyError,
    CapabilityNotFoundError,
    CapabilityValidationError,
)


def _normalize_required_text(
    value: Any,
    field_name: str,
) -> str:
    if not isinstance(
        value,
        str,
    ):
        raise CapabilityValidationError(
            (
                f"O campo '{field_name}' "
                "deve ser uma string."
            ),
        )

    normalized_value = (
        value
        .strip()
        .lower()
    )

    if not normalized_value:
        raise CapabilityValidationError(
            (
                f"O campo '{field_name}' "
                "é obrigatório."
            ),
        )

    return normalized_value


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
            (
                "O filtro informado deve ser "
                "uma string ou None."
            ),
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


def _normalize_status(
    value: CapabilityStatus | str | None,
) -> CapabilityStatus | None:
    if value is None:
        return None

    if isinstance(
        value,
        CapabilityStatus,
    ):
        return value

    if not isinstance(
        value,
        str,
    ):
        raise CapabilityValidationError(
            (
                "O status deve ser uma string "
                "ou CapabilityStatus."
            ),
        )

    try:
        return CapabilityStatus(
            value
            .strip()
            .lower(),
        )
    except ValueError as error:
        raise CapabilityValidationError(
            "O status informado é inválido.",
        ) from error


class CapabilityRegistry:
    """
    Registro central da Educational Capability Platform.

    Responsabilidades:

    - registrar capacidades;
    - impedir duplicidade;
    - localizar capacidades;
    - listar e filtrar contratos;
    - habilitar e desabilitar capacidades;
    - validar dependências registradas;
    - remover capacidades de forma controlada;
    - fornecer uma visão pública serializável.

    O Registry não:

    - executa capacidades;
    - verifica permissões do usuário;
    - valida contexto operacional;
    - acessa banco de dados;
    - chama diretamente o EIOS;
    - resolve intenções conversacionais.
    """

    def __init__(
        self,
        capabilities: Iterable[
            Capability
        ] | None = None,
    ) -> None:
        self._capabilities: dict[
            str,
            Capability,
        ] = {}

        if capabilities is not None:
            self.register_many(
                capabilities,
            )

    def register(
        self,
        capability: Capability,
        *,
        validate_dependencies: bool = False,
    ) -> Capability:
        """
        Registra uma capacidade.

        Por padrão, dependências podem ser registradas depois,
        permitindo inicialização modular do ecossistema.

        Quando validate_dependencies=True, todas as dependências
        precisam existir antes do registro.
        """

        if not isinstance(
            capability,
            Capability,
        ):
            raise CapabilityValidationError(
                (
                    "O Registry aceita apenas "
                    "instâncias de Capability."
                ),
            )

        capability_id = (
            capability.capability_id
        )

        if capability_id in (
            self._capabilities
        ):
            raise CapabilityAlreadyRegisteredError(
                capability_id,
            )

        if validate_dependencies:
            self.validate_dependencies(
                capability,
            )

        self._capabilities[
            capability_id
        ] = capability

        return capability

    def register_many(
        self,
        capabilities: Iterable[
            Capability
        ],
        *,
        validate_dependencies: bool = False,
    ) -> tuple[
        Capability,
        ...,
    ]:
        """
        Registra várias capacidades de forma atômica.

        Se qualquer item for inválido ou duplicado,
        nenhuma capacidade da coleção será registrada.
        """

        if isinstance(
            capabilities,
            (
                str,
                bytes,
                dict,
            ),
        ):
            raise CapabilityValidationError(
                (
                    "A coleção de capacidades "
                    "informada é inválida."
                ),
            )

        try:
            capability_list = list(
                capabilities,
            )
        except TypeError as error:
            raise CapabilityValidationError(
                (
                    "As capacidades devem ser "
                    "fornecidas em uma coleção."
                ),
            ) from error

        pending_ids: set[str] = set()

        for capability in (
            capability_list
        ):
            if not isinstance(
                capability,
                Capability,
            ):
                raise CapabilityValidationError(
                    (
                        "Todos os itens devem ser "
                        "instâncias de Capability."
                    ),
                )

            capability_id = (
                capability.capability_id
            )

            if (
                capability_id
                in self._capabilities
                or capability_id
                in pending_ids
            ):
                raise CapabilityAlreadyRegisteredError(
                    capability_id,
                )

            pending_ids.add(
                capability_id,
            )

        if validate_dependencies:
            available_ids = {
                *self._capabilities.keys(),
                *pending_ids,
            }

            for capability in (
                capability_list
            ):
                missing_dependencies = [
                    dependency
                    for dependency
                    in capability.dependencies
                    if dependency
                    not in available_ids
                ]

                if missing_dependencies:
                    raise CapabilityDependencyError(
                        capability.capability_id,
                        missing_dependencies=(
                            missing_dependencies
                        ),
                    )

        for capability in (
            capability_list
        ):
            self._capabilities[
                capability.capability_id
            ] = capability

        return tuple(
            capability_list,
        )

    def replace(
        self,
        capability: Capability,
        *,
        validate_dependencies: bool = True,
    ) -> Capability:
        """
        Substitui o contrato de uma capacidade já registrada.

        O capability_id deve permanecer o mesmo.
        """

        if not isinstance(
            capability,
            Capability,
        ):
            raise CapabilityValidationError(
                (
                    "A substituição exige uma "
                    "instância de Capability."
                ),
            )

        capability_id = (
            capability.capability_id
        )

        if capability_id not in (
            self._capabilities
        ):
            raise CapabilityNotFoundError(
                capability_id,
            )

        if validate_dependencies:
            self.validate_dependencies(
                capability,
            )

        self._capabilities[
            capability_id
        ] = capability

        return capability

    def get(
        self,
        capability_id: str,
    ) -> Capability:
        """
        Retorna uma capacidade registrada ou lança erro.
        """

        normalized_id = (
            _normalize_required_text(
                capability_id,
                "capability_id",
            )
        )

        capability = (
            self._capabilities
            .get(
                normalized_id,
            )
        )

        if capability is None:
            raise CapabilityNotFoundError(
                normalized_id,
            )

        return capability

    def find(
        self,
        capability_id: str,
    ) -> Capability | None:
        """
        Retorna uma capacidade ou None.
        """

        normalized_id = (
            _normalize_required_text(
                capability_id,
                "capability_id",
            )
        )

        return (
            self._capabilities
            .get(
                normalized_id,
            )
        )

    def contains(
        self,
        capability_id: str,
    ) -> bool:
        normalized_id = (
            _normalize_required_text(
                capability_id,
                "capability_id",
            )
        )

        return (
            normalized_id
            in self._capabilities
        )

    def remove(
        self,
        capability_id: str,
        *,
        force: bool = False,
    ) -> Capability:
        """
        Remove uma capacidade.

        Quando force=False, impede a remoção caso outra
        capacidade registrada dependa dela.
        """

        capability = self.get(
            capability_id,
        )

        if not force:
            dependents = (
                self.dependents_of(
                    capability.capability_id,
                )
            )

            if dependents:
                raise CapabilityDependencyError(
                    capability.capability_id,
                    missing_dependencies=[
                        dependent.capability_id
                        for dependent
                        in dependents
                    ],
                )

        return (
            self._capabilities
            .pop(
                capability.capability_id,
            )
        )

    def enable(
        self,
        capability_id: str,
    ) -> Capability:
        capability = self.get(
            capability_id,
        )

        if (
            capability.status
            is CapabilityStatus.DISABLED
        ):
            capability.status = (
                CapabilityStatus.DRAFT
            )

        capability.enabled = True

        return capability

    def disable(
        self,
        capability_id: str,
    ) -> Capability:
        capability = self.get(
            capability_id,
        )

        capability.enabled = False

        return capability

    def set_status(
        self,
        capability_id: str,
        status: CapabilityStatus | str,
    ) -> Capability:
        capability = self.get(
            capability_id,
        )

        normalized_status = (
            _normalize_status(
                status,
            )
        )

        if normalized_status is None:
            raise CapabilityValidationError(
                "O status é obrigatório.",
                capability_id=(
                    capability.capability_id
                ),
            )

        capability.status = (
            normalized_status
        )

        if (
            normalized_status
            is CapabilityStatus.DISABLED
        ):
            capability.enabled = False

        return capability

    def validate_dependencies(
        self,
        capability: Capability,
        *,
        require_available: bool = False,
    ) -> tuple[
        Capability,
        ...,
    ]:
        """
        Valida se as dependências estão registradas.

        Quando require_available=True, as dependências também
        precisam estar operacionalmente disponíveis.
        """

        if not isinstance(
            capability,
            Capability,
        ):
            raise CapabilityValidationError(
                (
                    "A validação exige uma "
                    "instância de Capability."
                ),
            )

        missing_dependencies: list[
            str
        ] = []

        resolved_dependencies: list[
            Capability
        ] = []

        for dependency_id in (
            capability.dependencies
        ):
            dependency = (
                self._capabilities
                .get(
                    dependency_id,
                )
            )

            if dependency is None:
                missing_dependencies.append(
                    dependency_id,
                )
                continue

            if (
                require_available
                and not dependency.is_available
            ):
                missing_dependencies.append(
                    dependency_id,
                )
                continue

            resolved_dependencies.append(
                dependency,
            )

        if missing_dependencies:
            raise CapabilityDependencyError(
                capability.capability_id,
                missing_dependencies=(
                    missing_dependencies
                ),
            )

        return tuple(
            resolved_dependencies,
        )

    def validate_all_dependencies(
        self,
        *,
        require_available: bool = False,
    ) -> None:
        """
        Valida as dependências de todo o Registry.
        """

        for capability in (
            self._capabilities
            .values()
        ):
            self.validate_dependencies(
                capability,
                require_available=(
                    require_available
                ),
            )

    def dependents_of(
        self,
        capability_id: str,
    ) -> tuple[
        Capability,
        ...,
    ]:
        normalized_id = (
            _normalize_required_text(
                capability_id,
                "capability_id",
            )
        )

        dependents = [
            capability
            for capability
            in self._capabilities
            .values()
            if normalized_id
            in capability.dependencies
        ]

        return self._sorted(
            dependents,
        )

    def dependencies_of(
        self,
        capability_id: str,
        *,
        require_available: bool = False,
    ) -> tuple[
        Capability,
        ...,
    ]:
        capability = self.get(
            capability_id,
        )

        return self.validate_dependencies(
            capability,
            require_available=(
                require_available
            ),
        )

    def list(
        self,
        *,
        module: str | None = None,
        domain: str | None = None,
        status: CapabilityStatus | str | None = None,
        tag: str | None = None,
        role: str | None = None,
        available_only: bool = False,
        enabled_only: bool = False,
        stable_only: bool = False,
        include_deprecated: bool = True,
    ) -> tuple[
        Capability,
        ...,
    ]:
        """
        Lista capacidades com filtros combináveis.
        """

        normalized_module = (
            _normalize_optional_text(
                module,
            )
        )

        normalized_domain = (
            _normalize_optional_text(
                domain,
            )
        )

        normalized_status = (
            _normalize_status(
                status,
            )
        )

        normalized_tag = (
            _normalize_optional_text(
                tag,
            )
        )

        normalized_role = (
            _normalize_optional_text(
                role,
            )
        )

        result: list[
            Capability
        ] = []

        for capability in (
            self._capabilities
            .values()
        ):
            if (
                normalized_module
                is not None
                and capability.module
                != normalized_module
            ):
                continue

            if (
                normalized_domain
                is not None
                and capability.domain
                != normalized_domain
            ):
                continue

            if (
                normalized_status
                is not None
                and capability.status
                is not normalized_status
            ):
                continue

            if (
                normalized_tag
                is not None
                and normalized_tag
                not in capability.tags
            ):
                continue

            if (
                normalized_role
                is not None
                and not capability.supports_role(
                    normalized_role,
                )
            ):
                continue

            if (
                available_only
                and not capability.is_available
            ):
                continue

            if (
                enabled_only
                and not capability.enabled
            ):
                continue

            if (
                stable_only
                and not capability.is_stable
            ):
                continue

            if (
                not include_deprecated
                and capability.is_deprecated
            ):
                continue

            result.append(
                capability,
            )

        return self._sorted(
            result,
        )

    def list_available(
        self,
        *,
        role: str | None = None,
    ) -> tuple[
        Capability,
        ...,
    ]:
        return self.list(
            role=role,
            available_only=True,
            include_deprecated=False,
        )

    def list_by_module(
        self,
        module: str,
    ) -> tuple[
        Capability,
        ...,
    ]:
        return self.list(
            module=module,
        )

    def list_by_domain(
        self,
        domain: str,
    ) -> tuple[
        Capability,
        ...,
    ]:
        return self.list(
            domain=domain,
        )

    def list_by_tag(
        self,
        tag: str,
    ) -> tuple[
        Capability,
        ...,
    ]:
        return self.list(
            tag=tag,
        )

    def clear(
        self,
    ) -> None:
        self._capabilities.clear()

    def count(
        self,
    ) -> int:
        return len(
            self._capabilities,
        )

    def summary(
        self,
    ) -> dict[str, Any]:
        """
        Produz um resumo seguro do Registry.
        """

        by_status = {
            status.value: 0
            for status
            in CapabilityStatus
        }

        by_module: dict[
            str,
            int,
        ] = {}

        available = 0
        enabled = 0
        deprecated = 0

        for capability in (
            self._capabilities
            .values()
        ):
            by_status[
                capability.status.value
            ] += 1

            by_module[
                capability.module
            ] = (
                by_module.get(
                    capability.module,
                    0,
                )
                + 1
            )

            if capability.is_available:
                available += 1

            if capability.enabled:
                enabled += 1

            if capability.is_deprecated:
                deprecated += 1

        return {
            "total": (
                self.count()
            ),
            "available": (
                available
            ),
            "enabled": (
                enabled
            ),
            "deprecated": (
                deprecated
            ),
            "by_status": (
                by_status
            ),
            "by_module": dict(
                sorted(
                    by_module.items(),
                ),
            ),
        }

    def to_dict(
        self,
    ) -> dict[str, Any]:
        """
        Serializa o Registry sem expor handlers ou estado interno.
        """

        capabilities = (
            self._sorted(
                self._capabilities
                .values(),
            )
        )

        return {
            "summary": (
                self.summary()
            ),
            "capabilities": [
                capability.to_dict()
                for capability
                in capabilities
            ],
        }

    @staticmethod
    def _sorted(
        capabilities: Iterable[
            Capability
        ],
    ) -> tuple[
        Capability,
        ...,
    ]:
        return tuple(
            sorted(
                capabilities,
                key=lambda item: (
                    item.module,
                    item.capability_id,
                    item.version,
                ),
            ),
        )


capability_registry = (
    CapabilityRegistry()
)