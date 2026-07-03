from enum import Enum

from app.core.exceptions.exceptions import ForbiddenException


class Role(str, Enum):
    """
    Perfis oficiais da EduData IA.
    """

    SUPER_ADMIN = "super_admin"
    PLATFORM_ADMIN = "platform_admin"
    ORGANIZATION_ADMIN = "organization_admin"
    SCHOOL_ADMIN = "school_admin"

    COORDINATOR = "coordinator"
    PEDAGOGICAL_COORDINATOR = "pedagogical_coordinator"

    TEACHER = "teacher"

    STUDENT = "student"

    GUARDIAN = "guardian"

    ANALYST = "analyst"

    GUEST = "guest"


class Permission:
    """
    Classe responsável pelas regras de autorização
    da plataforma EduData IA.
    """

    @staticmethod
    def require_role(
        current_role: str,
        allowed_roles: list[str],
    ) -> None:

        if current_role not in allowed_roles:
            raise ForbiddenException(
                "Você não possui permissão para executar esta operação."
            )

    @staticmethod
    def is_admin(role: str) -> bool:
        return role in [
            Role.SUPER_ADMIN,
            Role.PLATFORM_ADMIN,
            Role.ORGANIZATION_ADMIN,
            Role.SCHOOL_ADMIN,
        ]

    @staticmethod
    def is_teacher(role: str) -> bool:
        return role == Role.TEACHER

    @staticmethod
    def is_student(role: str) -> bool:
        return role == Role.STUDENT

    @staticmethod
    def is_coordinator(role: str) -> bool:
        return role in [
            Role.COORDINATOR,
            Role.PEDAGOGICAL_COORDINATOR,
        ]

    @staticmethod
    def can_manage_school(role: str) -> bool:
        return role in [
            Role.SUPER_ADMIN,
            Role.PLATFORM_ADMIN,
            Role.ORGANIZATION_ADMIN,
            Role.SCHOOL_ADMIN,
        ]

    @staticmethod
    def can_manage_users(role: str) -> bool:
        return role in [
            Role.SUPER_ADMIN,
            Role.PLATFORM_ADMIN,
            Role.ORGANIZATION_ADMIN,
        ]

    @staticmethod
    def can_access_dashboard(role: str) -> bool:
        return role != Role.GUEST

    @staticmethod
    def can_use_engine(role: str) -> bool:
        """
        Todos os usuários autenticados poderão utilizar
        o EDI Intelligence Engine, respeitando suas permissões.
        """
        return role != Role.GUEST