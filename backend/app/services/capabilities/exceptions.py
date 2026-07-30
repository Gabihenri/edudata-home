from __future__ import annotations

from typing import Any


class CapabilityError(
    Exception,
):
    """
    Exceção base do domínio de capacidades da EduData IA.

    Todas as exceções específicas do ECP devem herdar desta classe.
    """

    error_code = (
        "capability_error"
    )

    status_code = 400

    def __init__(
        self,
        message: str,
        *,
        capability_id: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        normalized_message = (
            message.strip()
            if isinstance(
                message,
                str,
            )
            else ""
        )

        if not normalized_message:
            normalized_message = (
                "Ocorreu um erro no domínio de capacidades."
            )

        self.message = (
            normalized_message
        )

        self.capability_id = (
            capability_id.strip()
            if isinstance(
                capability_id,
                str,
            )
            and capability_id.strip()
            else None
        )

        self.details = (
            {
                **details,
            }
            if isinstance(
                details,
                dict,
            )
            else {}
        )

        super().__init__(
            self.message,
        )

    def to_dict(
        self,
    ) -> dict[str, Any]:
        return {
            "success": False,
            "error": {
                "code": (
                    self.error_code
                ),
                "message": (
                    self.message
                ),
                "capability_id": (
                    self.capability_id
                ),
                "details": {
                    **self.details,
                },
            },
        }


class CapabilityValidationError(
    CapabilityError,
):
    """
    Falha de validação no contrato de uma capacidade.
    """

    error_code = (
        "capability_validation_error"
    )

    status_code = 422


class CapabilityAlreadyRegisteredError(
    CapabilityError,
):
    """
    A capacidade já existe no Registry.
    """

    error_code = (
        "capability_already_registered"
    )

    status_code = 409

    def __init__(
        self,
        capability_id: str,
    ) -> None:
        super().__init__(
            (
                "A capacidade informada já está registrada."
            ),
            capability_id=(
                capability_id
            ),
        )


class CapabilityNotFoundError(
    CapabilityError,
):
    """
    A capacidade não foi localizada.
    """

    error_code = (
        "capability_not_found"
    )

    status_code = 404

    def __init__(
        self,
        capability_id: str,
    ) -> None:
        super().__init__(
            (
                "A capacidade informada não foi encontrada."
            ),
            capability_id=(
                capability_id
            ),
        )


class CapabilityUnavailableError(
    CapabilityError,
):
    """
    A capacidade existe, mas não está disponível para execução.
    """

    error_code = (
        "capability_unavailable"
    )

    status_code = 409

    def __init__(
        self,
        capability_id: str,
        *,
        reason: str | None = None,
    ) -> None:
        details: dict[str, Any] = {}

        if (
            isinstance(
                reason,
                str,
            )
            and reason.strip()
        ):
            details[
                "reason"
            ] = reason.strip()

        super().__init__(
            (
                "A capacidade informada não está disponível."
            ),
            capability_id=(
                capability_id
            ),
            details=(
                details
            ),
        )


class CapabilityPermissionDeniedError(
    CapabilityError,
):
    """
    O perfil atual não possui permissão para utilizar a capacidade.
    """

    error_code = (
        "capability_permission_denied"
    )

    status_code = 403

    def __init__(
        self,
        capability_id: str,
        *,
        role: str | None = None,
    ) -> None:
        details: dict[str, Any] = {}

        if (
            isinstance(
                role,
                str,
            )
            and role.strip()
        ):
            details[
                "role"
            ] = role.strip()

        super().__init__(
            (
                "O perfil atual não possui permissão para utilizar "
                "esta capacidade."
            ),
            capability_id=(
                capability_id
            ),
            details=(
                details
            ),
        )


class CapabilityDependencyError(
    CapabilityError,
):
    """
    Uma ou mais dependências obrigatórias da capacidade
    não estão disponíveis.
    """

    error_code = (
        "capability_dependency_error"
    )

    status_code = 409

    def __init__(
        self,
        capability_id: str,
        *,
        missing_dependencies: list[str] | tuple[str, ...] | None = None,
    ) -> None:
        normalized_dependencies = [
            dependency.strip()
            for dependency in (
                missing_dependencies
                or []
            )
            if isinstance(
                dependency,
                str,
            )
            and dependency.strip()
        ]

        super().__init__(
            (
                "Uma ou mais dependências da capacidade "
                "não estão disponíveis."
            ),
            capability_id=(
                capability_id
            ),
            details={
                "missing_dependencies": (
                    normalized_dependencies
                ),
            },
        )


class CapabilityContextMissingError(
    CapabilityError,
):
    """
    O contexto necessário para executar a capacidade
    não foi fornecido.
    """

    error_code = (
        "capability_context_missing"
    )

    status_code = 422

    def __init__(
        self,
        capability_id: str,
        *,
        missing_context: list[str] | tuple[str, ...] | None = None,
    ) -> None:
        normalized_context = [
            context_item.strip()
            for context_item in (
                missing_context
                or []
            )
            if isinstance(
                context_item,
                str,
            )
            and context_item.strip()
        ]

        super().__init__(
            (
                "O contexto necessário para executar a capacidade "
                "não foi fornecido."
            ),
            capability_id=(
                capability_id
            ),
            details={
                "missing_context": (
                    normalized_context
                ),
            },
        )


class CapabilityConfirmationRequiredError(
    CapabilityError,
):
    """
    A capacidade exige confirmação explícita antes da execução.
    """

    error_code = (
        "capability_confirmation_required"
    )

    status_code = 409

    def __init__(
        self,
        capability_id: str,
    ) -> None:
        super().__init__(
            (
                "Esta capacidade exige confirmação explícita "
                "antes da execução."
            ),
            capability_id=(
                capability_id
            ),
        )


class CapabilityExecutionError(
    CapabilityError,
):
    """
    Falha controlada durante a execução de uma capacidade.
    """

    error_code = (
        "capability_execution_error"
    )

    status_code = 500

    def __init__(
        self,
        capability_id: str,
        *,
        reason: str | None = None,
    ) -> None:
        details: dict[str, Any] = {}

        if (
            isinstance(
                reason,
                str,
            )
            and reason.strip()
        ):
            details[
                "reason"
            ] = reason.strip()

        super().__init__(
            (
                "Não foi possível executar a capacidade informada."
            ),
            capability_id=(
                capability_id
            ),
            details=(
                details
            ),
        )