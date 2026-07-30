from __future__ import annotations

import importlib
import inspect
import pkgutil
from dataclasses import dataclass
from types import ModuleType
from typing import Any, Callable

import app.services.capabilities as capabilities_package

from app.services.capabilities.capability import (
    Capability,
)
from app.services.capabilities.exceptions import (
    CapabilityError,
    CapabilityValidationError,
)
from app.services.capabilities.registry import (
    CapabilityRegistry,
    capability_registry,
)


CapabilityRegistrationFunction = Callable[
    [CapabilityRegistry | None],
    tuple[Capability, ...],
]


def _is_capability_module_name(
    module_name: str,
) -> bool:
    """
    Aceita somente módulos públicos no padrão:

    agenda_capabilities
    professor_digital_capabilities
    analytics_capabilities

    Ignora arquivos internos como:

    capability
    registry
    resolver
    dispatcher
    loader
    """
    return (
        module_name.endswith(
            "_capabilities",
        )
        and not module_name.startswith(
            "_",
        )
    )


def _is_registration_function_name(
    function_name: str,
) -> bool:
    """
    Aceita somente funções públicas no padrão:

    register_agenda_capabilities
    register_professor_digital_capabilities
    """
    return (
        function_name.startswith(
            "register_",
        )
        and function_name.endswith(
            "_capabilities",
        )
        and not function_name.startswith(
            "_",
        )
    )


@dataclass(frozen=True)
class CapabilityModuleLoadResult:
    """
    Resultado seguro do carregamento de um módulo de capacidades.
    """

    module_name: str

    registration_function: str

    registered_capabilities: tuple[
        Capability,
        ...,
    ]

    @property
    def total_registered(
        self,
    ) -> int:
        return len(
            self.registered_capabilities,
        )

    def to_dict(
        self,
    ) -> dict[str, Any]:
        return {
            "module_name": (
                self.module_name
            ),
            "registration_function": (
                self.registration_function
            ),
            "total_registered": (
                self.total_registered
            ),
            "capability_ids": [
                capability.capability_id
                for capability
                in self.registered_capabilities
            ],
        }


@dataclass(frozen=True)
class CapabilityLoadReport:
    """
    Relatório completo da inicialização automática do ECP.
    """

    discovered_modules: tuple[
        str,
        ...,
    ]

    loaded_modules: tuple[
        CapabilityModuleLoadResult,
        ...,
    ]

    skipped_modules: tuple[
        str,
        ...,
    ]

    @property
    def total_discovered_modules(
        self,
    ) -> int:
        return len(
            self.discovered_modules,
        )

    @property
    def total_loaded_modules(
        self,
    ) -> int:
        return len(
            self.loaded_modules,
        )

    @property
    def total_registered_capabilities(
        self,
    ) -> int:
        return sum(
            module_result.total_registered
            for module_result
            in self.loaded_modules
        )

    def to_dict(
        self,
    ) -> dict[str, Any]:
        return {
            "success": True,
            "summary": {
                "discovered_modules": (
                    self.total_discovered_modules
                ),
                "loaded_modules": (
                    self.total_loaded_modules
                ),
                "registered_capabilities": (
                    self.total_registered_capabilities
                ),
                "skipped_modules": (
                    len(
                        self.skipped_modules,
                    )
                ),
            },
            "modules": [
                module_result.to_dict()
                for module_result
                in self.loaded_modules
            ],
            "skipped": [
                *self.skipped_modules,
            ],
        }


class CapabilityLoader:
    """
    Carregador automático da Educational Capability Platform.

    Responsabilidades:

    - descobrir módulos terminados em `_capabilities`;
    - importar somente módulos do pacote oficial;
    - localizar funções `register_*_capabilities`;
    - executar registros contra o Registry informado;
    - preservar idempotência dos módulos;
    - gerar relatório seguro da inicialização.

    O Loader não:

    - executa handlers;
    - resolve capacidades;
    - acessa banco de dados;
    - chama o EIOS;
    - autentica usuários;
    - altera permissões;
    - importa módulos fora do pacote oficial.
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

    def discover_module_names(
        self,
    ) -> tuple[str, ...]:
        """
        Descobre módulos de capacidades dentro do pacote oficial.
        """

        package_path = getattr(
            capabilities_package,
            "__path__",
            None,
        )

        if package_path is None:
            raise CapabilityValidationError(
                (
                    "O pacote de capacidades não possui "
                    "um caminho válido para descoberta."
                ),
            )

        discovered_modules: list[
            str
        ] = []

        for module_info in pkgutil.iter_modules(
            package_path,
        ):
            if not _is_capability_module_name(
                module_info.name,
            ):
                continue

            discovered_modules.append(
                (
                    f"{capabilities_package.__name__}."
                    f"{module_info.name}"
                ),
            )

        return tuple(
            sorted(
                discovered_modules,
            ),
        )

    @staticmethod
    def _import_module(
        module_name: str,
    ) -> ModuleType:
        expected_prefix = (
            f"{capabilities_package.__name__}."
        )

        if not module_name.startswith(
            expected_prefix,
        ):
            raise CapabilityValidationError(
                (
                    "O Loader somente pode importar módulos "
                    "do pacote oficial de capacidades."
                ),
            )

        try:
            return importlib.import_module(
                module_name,
            )

        except Exception as error:
            print(
                "[ECP_CAPABILITY_MODULE_IMPORT_ERROR]",
                {
                    "module_name": module_name,
                    "error_type": (
                        type(
                            error,
                        ).__name__
                    ),
                },
            )

            raise CapabilityValidationError(
                (
                    "Não foi possível importar um módulo "
                    "de capacidades."
                ),
                details={
                    "module_name": module_name,
                    "error_type": (
                        type(
                            error,
                        ).__name__
                    ),
                },
            ) from error

    @staticmethod
    def _find_registration_functions(
        module: ModuleType,
    ) -> tuple[
        tuple[
            str,
            CapabilityRegistrationFunction,
        ],
        ...,
    ]:
        registration_functions: list[
            tuple[
                str,
                CapabilityRegistrationFunction,
            ]
        ] = []

        for function_name, function in inspect.getmembers(
            module,
            inspect.isfunction,
        ):
            if not _is_registration_function_name(
                function_name,
            ):
                continue

            if function.__module__ != module.__name__:
                continue

            registration_functions.append(
                (
                    function_name,
                    function,
                ),
            )

        return tuple(
            sorted(
                registration_functions,
                key=lambda item: item[0],
            ),
        )

    def _execute_registration_function(
        self,
        module_name: str,
        function_name: str,
        function: CapabilityRegistrationFunction,
    ) -> CapabilityModuleLoadResult:
        try:
            registered_capabilities = function(
                self._registry,
            )

        except CapabilityError:
            raise

        except Exception as error:
            print(
                "[ECP_CAPABILITY_REGISTRATION_ERROR]",
                {
                    "module_name": module_name,
                    "registration_function": (
                        function_name
                    ),
                    "error_type": (
                        type(
                            error,
                        ).__name__
                    ),
                },
            )

            raise CapabilityValidationError(
                (
                    "Não foi possível registrar as capacidades "
                    "de um módulo."
                ),
                details={
                    "module_name": module_name,
                    "registration_function": (
                        function_name
                    ),
                    "error_type": (
                        type(
                            error,
                        ).__name__
                    ),
                },
            ) from error

        if not isinstance(
            registered_capabilities,
            tuple,
        ):
            raise CapabilityValidationError(
                (
                    "A função de registro deve retornar "
                    "uma tupla de capacidades."
                ),
                details={
                    "module_name": module_name,
                    "registration_function": (
                        function_name
                    ),
                },
            )

        for capability in registered_capabilities:
            if not isinstance(
                capability,
                Capability,
            ):
                raise CapabilityValidationError(
                    (
                        "A função de registro retornou "
                        "um item inválido."
                    ),
                    details={
                        "module_name": module_name,
                        "registration_function": (
                            function_name
                        ),
                    },
                )

        return CapabilityModuleLoadResult(
            module_name=module_name,
            registration_function=(
                function_name
            ),
            registered_capabilities=(
                registered_capabilities
            ),
        )

    def load_module(
        self,
        module_name: str,
    ) -> tuple[
        CapabilityModuleLoadResult,
        ...,
    ]:
        """
        Importa e inicializa um módulo específico.
        """

        module = self._import_module(
            module_name,
        )

        registration_functions = (
            self._find_registration_functions(
                module,
            )
        )

        if not registration_functions:
            return ()

        results: list[
            CapabilityModuleLoadResult
        ] = []

        for (
            function_name,
            function,
        ) in registration_functions:
            results.append(
                self._execute_registration_function(
                    module_name,
                    function_name,
                    function,
                ),
            )

        return tuple(
            results,
        )

    def load_all(
        self,
    ) -> CapabilityLoadReport:
        """
        Descobre e inicializa todos os módulos oficiais.

        O carregamento é idempotente desde que cada função
        `register_*_capabilities` também seja idempotente.
        """

        discovered_modules = (
            self.discover_module_names()
        )

        loaded_modules: list[
            CapabilityModuleLoadResult
        ] = []

        skipped_modules: list[
            str
        ] = []

        for module_name in discovered_modules:
            module_results = self.load_module(
                module_name,
            )

            if not module_results:
                skipped_modules.append(
                    module_name,
                )
                continue

            loaded_modules.extend(
                module_results,
            )

        report = CapabilityLoadReport(
            discovered_modules=(
                discovered_modules
            ),
            loaded_modules=tuple(
                loaded_modules,
            ),
            skipped_modules=tuple(
                skipped_modules,
            ),
        )

        print(
            "[ECP_CAPABILITIES_LOADED]",
            {
                "discovered_modules": (
                    report.total_discovered_modules
                ),
                "loaded_modules": (
                    report.total_loaded_modules
                ),
                "registered_capabilities": (
                    report.total_registered_capabilities
                ),
                "registry_total": (
                    self._registry.count()
                ),
            },
        )

        return report


capability_loader = (
    CapabilityLoader()
)