from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

from app.services.capabilities.capability_types import (
    CapabilityDataRequirement,
    CapabilityExecutionMode,
    CapabilityOutputType,
    CapabilityRiskLevel,
    CapabilityScope,
    CapabilityStatus,
    enum_value,
)


CAPABILITY_ID_PATTERN = re.compile(
    r"^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$",
)

VERSION_PATTERN = re.compile(
    r"^\d+\.\d+(?:\.\d+)?(?:-[a-z0-9.-]+)?$",
)

ROLE_PATTERN = re.compile(
    r"^[a-z][a-z0-9_]*$",
)

TAG_PATTERN = re.compile(
    r"^[a-z][a-z0-9_-]*$",
)


def _normalize_required_text(
    value: Any,
    field_name: str,
) -> str:
    if not isinstance(
        value,
        str,
    ):
        raise TypeError(
            f"O campo '{field_name}' deve ser uma string.",
        )

    normalized_value = (
        value.strip()
    )

    if not normalized_value:
        raise ValueError(
            f"O campo '{field_name}' é obrigatório.",
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
        raise TypeError(
            "O valor opcional deve ser uma string ou None.",
        )

    normalized_value = (
        value.strip()
    )

    return (
        normalized_value
        or None
    )


def _normalize_capability_id(
    value: Any,
) -> str:
    capability_id = (
        _normalize_required_text(
            value,
            "capability_id",
        )
        .lower()
    )

    if not CAPABILITY_ID_PATTERN.fullmatch(
        capability_id,
    ):
        raise ValueError(
            "O capability_id deve utilizar o formato "
            "'dominio.acao', com letras minúsculas, números "
            "e sublinhados.",
        )

    return capability_id


def _normalize_version(
    value: Any,
) -> str:
    version = (
        _normalize_required_text(
            value,
            "version",
        )
        .lower()
    )

    if not VERSION_PATTERN.fullmatch(
        version,
    ):
        raise ValueError(
            "A versão deve seguir o formato semântico, "
            "como '1.0', '1.0.0' ou '1.0.0-beta'.",
        )

    return version


def _normalize_role(
    value: Any,
) -> str:
    role = (
        _normalize_required_text(
            value,
            "required_role",
        )
        .lower()
    )

    if not ROLE_PATTERN.fullmatch(
        role,
    ):
        raise ValueError(
            "Os perfis autorizados devem utilizar letras "
            "minúsculas, números e sublinhados.",
        )

    return role


def _normalize_tag(
    value: Any,
) -> str:
    tag = (
        _normalize_required_text(
            value,
            "tag",
        )
        .lower()
    )

    if not TAG_PATTERN.fullmatch(
        tag,
    ):
        raise ValueError(
            "As tags devem utilizar letras minúsculas, "
            "números, hífens ou sublinhados.",
        )

    return tag


def _normalize_unique_strings(
    values: Any,
    normalizer,
    field_name: str,
) -> tuple[str, ...]:
    if values is None:
        return ()

    if not isinstance(
        values,
        (
            list,
            tuple,
            set,
        ),
    ):
        raise TypeError(
            f"O campo '{field_name}' deve ser uma coleção.",
        )

    normalized_values: list[str] = []

    for value in values:
        normalized_value = (
            normalizer(
                value,
            )
        )

        if normalized_value not in (
            normalized_values
        ):
            normalized_values.append(
                normalized_value,
            )

    return tuple(
        normalized_values,
    )


def _normalize_enum_collection(
    values: Any,
    enum_type,
    field_name: str,
) -> tuple:
    if values is None:
        return ()

    if not isinstance(
        values,
        (
            list,
            tuple,
            set,
        ),
    ):
        raise TypeError(
            f"O campo '{field_name}' deve ser uma coleção.",
        )

    normalized_values = []

    for value in values:
        try:
            normalized_value = (
                value
                if isinstance(
                    value,
                    enum_type,
                )
                else enum_type(
                    enum_value(
                        value,
                    ),
                )
            )
        except (
            TypeError,
            ValueError,
        ) as error:
            raise ValueError(
                f"O campo '{field_name}' contém um valor inválido.",
            ) from error

        if normalized_value not in (
            normalized_values
        ):
            normalized_values.append(
                normalized_value,
            )

    return tuple(
        normalized_values,
    )


def _normalize_metadata(
    value: Any,
) -> dict[str, Any]:
    if value is None:
        return {}

    if not isinstance(
        value,
        dict,
    ):
        raise TypeError(
            "O campo 'metadata' deve ser um dicionário.",
        )

    normalized_metadata: dict[str, Any] = {}

    for key, metadata_value in (
        value.items()
    ):
        normalized_key = (
            _normalize_required_text(
                key,
                "metadata_key",
            )
        )

        normalized_metadata[
            normalized_key
        ] = metadata_value

    return normalized_metadata


@dataclass
class Capability:
    """
    Entidade central da Educational Capability Platform.

    Uma capacidade representa algo que a plataforma sabe
    executar por meio de um contrato explícito.

    Esta entidade:

    - não executa ações;
    - não acessa banco de dados;
    - não chama o EIOS;
    - não verifica permissões;
    - não resolve dependências;
    - apenas descreve, valida e serializa uma capacidade.
    """

    capability_id: str

    title: str

    description: str

    module: str

    owner: str

    version: str = "1.0.0"

    status: CapabilityStatus = (
        CapabilityStatus.DRAFT
    )

    execution_mode: CapabilityExecutionMode = (
        CapabilityExecutionMode.QUERY
    )

    risk_level: CapabilityRiskLevel = (
        CapabilityRiskLevel.LOW
    )

    scope: CapabilityScope = (
        CapabilityScope.USER
    )

    output_type: CapabilityOutputType = (
        CapabilityOutputType.STRUCTURED_RESPONSE
    )

    required_roles: tuple[str, ...] = (
        field(
            default_factory=tuple,
        )
    )

    required_context: tuple[
        CapabilityDataRequirement,
        ...,
    ] = field(
        default_factory=tuple,
    )

    dependencies: tuple[str, ...] = (
        field(
            default_factory=tuple,
        )
    )

    tags: tuple[str, ...] = field(
        default_factory=tuple,
    )

    estimated_execution_ms: int | None = None

    requires_confirmation: bool = False

    audit_required: bool = False

    enabled: bool = True

    metadata: dict[str, Any] = field(
        default_factory=dict,
    )

    def __post_init__(
        self,
    ) -> None:
        self.capability_id = (
            _normalize_capability_id(
                self.capability_id,
            )
        )

        self.title = (
            _normalize_required_text(
                self.title,
                "title",
            )
        )

        self.description = (
            _normalize_required_text(
                self.description,
                "description",
            )
        )

        self.module = (
            _normalize_required_text(
                self.module,
                "module",
            )
            .lower()
        )

        self.owner = (
            _normalize_required_text(
                self.owner,
                "owner",
            )
        )

        self.version = (
            _normalize_version(
                self.version,
            )
        )

        self.status = (
            self.status
            if isinstance(
                self.status,
                CapabilityStatus,
            )
            else CapabilityStatus(
                enum_value(
                    self.status,
                ),
            )
        )

        self.execution_mode = (
            self.execution_mode
            if isinstance(
                self.execution_mode,
                CapabilityExecutionMode,
            )
            else CapabilityExecutionMode(
                enum_value(
                    self.execution_mode,
                ),
            )
        )

        self.risk_level = (
            self.risk_level
            if isinstance(
                self.risk_level,
                CapabilityRiskLevel,
            )
            else CapabilityRiskLevel(
                enum_value(
                    self.risk_level,
                ),
            )
        )

        self.scope = (
            self.scope
            if isinstance(
                self.scope,
                CapabilityScope,
            )
            else CapabilityScope(
                enum_value(
                    self.scope,
                ),
            )
        )

        self.output_type = (
            self.output_type
            if isinstance(
                self.output_type,
                CapabilityOutputType,
            )
            else CapabilityOutputType(
                enum_value(
                    self.output_type,
                ),
            )
        )

        self.required_roles = (
            _normalize_unique_strings(
                self.required_roles,
                _normalize_role,
                "required_roles",
            )
        )

        self.required_context = (
            _normalize_enum_collection(
                self.required_context,
                CapabilityDataRequirement,
                "required_context",
            )
        )

        self.dependencies = (
            _normalize_unique_strings(
                self.dependencies,
                _normalize_capability_id,
                "dependencies",
            )
        )

        self.tags = (
            _normalize_unique_strings(
                self.tags,
                _normalize_tag,
                "tags",
            )
        )

        self.estimated_execution_ms = (
            self._normalize_estimated_execution_ms(
                self.estimated_execution_ms,
            )
        )

        if not isinstance(
            self.requires_confirmation,
            bool,
        ):
            raise TypeError(
                "O campo 'requires_confirmation' deve ser booleano.",
            )

        if not isinstance(
            self.audit_required,
            bool,
        ):
            raise TypeError(
                "O campo 'audit_required' deve ser booleano.",
            )

        if not isinstance(
            self.enabled,
            bool,
        ):
            raise TypeError(
                "O campo 'enabled' deve ser booleano.",
            )

        self.metadata = (
            _normalize_metadata(
                self.metadata,
            )
        )

        self._validate_business_rules()

    @staticmethod
    def _normalize_estimated_execution_ms(
        value: Any,
    ) -> int | None:
        if value is None:
            return None

        if isinstance(
            value,
            bool,
        ):
            raise TypeError(
                "O tempo estimado deve ser um número inteiro.",
            )

        if not isinstance(
            value,
            int,
        ):
            raise TypeError(
                "O tempo estimado deve ser um número inteiro.",
            )

        if value < 0:
            raise ValueError(
                "O tempo estimado não pode ser negativo.",
            )

        return value

    def _validate_business_rules(
        self,
    ) -> None:
        if (
            self.capability_id
            in self.dependencies
        ):
            raise ValueError(
                "Uma capacidade não pode depender de si mesma.",
            )

        if (
            self.status
            is CapabilityStatus.DISABLED
        ):
            self.enabled = False

        if (
            self.risk_level
            in {
                CapabilityRiskLevel.HIGH,
                CapabilityRiskLevel.RESTRICTED,
            }
            and not self.audit_required
        ):
            raise ValueError(
                "Capacidades de risco alto ou restrito "
                "devem exigir auditoria.",
            )

        if (
            self.execution_mode
            is CapabilityExecutionMode.COMMAND
            and self.risk_level
            in {
                CapabilityRiskLevel.HIGH,
                CapabilityRiskLevel.RESTRICTED,
            }
            and not self.requires_confirmation
        ):
            raise ValueError(
                "Comandos de risco alto ou restrito devem "
                "exigir confirmação explícita.",
            )

        if (
            self.scope
            is CapabilityScope.ORGANIZATION
            and CapabilityDataRequirement.ORGANIZATION_CONTEXT
            not in self.required_context
        ):
            raise ValueError(
                "Capacidades organizacionais devem exigir "
                "organization_context.",
            )

        if (
            self.scope
            is CapabilityScope.SCHOOL
            and CapabilityDataRequirement.SCHOOL_CONTEXT
            not in self.required_context
        ):
            raise ValueError(
                "Capacidades escolares devem exigir school_context.",
            )

        if (
            self.scope
            is CapabilityScope.USER
            and CapabilityDataRequirement.USER_CONTEXT
            not in self.required_context
        ):
            raise ValueError(
                "Capacidades de usuário devem exigir user_context.",
            )

    @property
    def domain(
        self,
    ) -> str:
        return self.capability_id.split(
            ".",
            maxsplit=1,
        )[0]

    @property
    def action(
        self,
    ) -> str:
        return self.capability_id.rsplit(
            ".",
            maxsplit=1,
        )[-1]

    @property
    def is_available(
        self,
    ) -> bool:
        return (
            self.enabled
            and self.status
            not in {
                CapabilityStatus.DRAFT,
                CapabilityStatus.DISABLED,
            }
        )

    @property
    def is_stable(
        self,
    ) -> bool:
        return (
            self.status
            is CapabilityStatus.STABLE
        )

    @property
    def is_deprecated(
        self,
    ) -> bool:
        return (
            self.status
            is CapabilityStatus.DEPRECATED
        )

    def supports_role(
        self,
        role: str | None,
    ) -> bool:
        if not self.required_roles:
            return True

        normalized_role = (
            _normalize_optional_text(
                role,
            )
        )

        if normalized_role is None:
            return False

        return (
            normalized_role.lower()
            in self.required_roles
        )

    def requires_context(
        self,
        requirement: CapabilityDataRequirement | str,
    ) -> bool:
        normalized_requirement = (
            requirement
            if isinstance(
                requirement,
                CapabilityDataRequirement,
            )
            else CapabilityDataRequirement(
                enum_value(
                    requirement,
                ),
            )
        )

        return (
            normalized_requirement
            in self.required_context
        )

    def depends_on(
        self,
        capability_id: str,
    ) -> bool:
        normalized_capability_id = (
            _normalize_capability_id(
                capability_id,
            )
        )

        return (
            normalized_capability_id
            in self.dependencies
        )

    def identity(
        self,
    ) -> str:
        return (
            f"{self.capability_id}@{self.version}"
        )

    def to_dict(
        self,
    ) -> dict[str, Any]:
        """
        Serializa o contrato público e seguro da capacidade.
        """

        return {
            "capability_id": (
                self.capability_id
            ),
            "identity": (
                self.identity()
            ),
            "domain": (
                self.domain
            ),
            "action": (
                self.action
            ),
            "title": (
                self.title
            ),
            "description": (
                self.description
            ),
            "module": (
                self.module
            ),
            "owner": (
                self.owner
            ),
            "version": (
                self.version
            ),
            "status": (
                self.status.value
            ),
            "execution_mode": (
                self.execution_mode.value
            ),
            "risk_level": (
                self.risk_level.value
            ),
            "scope": (
                self.scope.value
            ),
            "output_type": (
                self.output_type.value
            ),
            "required_roles": [
                *self.required_roles,
            ],
            "required_context": [
                requirement.value
                for requirement
                in self.required_context
            ],
            "dependencies": [
                *self.dependencies,
            ],
            "tags": [
                *self.tags,
            ],
            "estimated_execution_ms": (
                self.estimated_execution_ms
            ),
            "requires_confirmation": (
                self.requires_confirmation
            ),
            "audit_required": (
                self.audit_required
            ),
            "enabled": (
                self.enabled
            ),
            "available": (
                self.is_available
            ),
            "stable": (
                self.is_stable
            ),
            "deprecated": (
                self.is_deprecated
            ),
            "metadata": {
                **self.metadata,
            },
        }