from app.core.exceptions.exceptions import ForbiddenException


class TenantContext:
    """
    Utilitário para validação multi-tenant da EduData IA.

    Garante que o usuário só acesse dados da própria organização
    e da própria escola quando aplicável.
    """

    @staticmethod
    def require_same_organization(
        current_user: dict,
        organization_id: str,
    ) -> None:
        if not current_user.get("organization_id"):
            raise ForbiddenException("Usuário sem organização vinculada.")

        if str(current_user.get("organization_id")) != str(organization_id):
            raise ForbiddenException(
                "Acesso negado para esta organização."
            )

    @staticmethod
    def require_same_school(
        current_user: dict,
        school_id: str,
    ) -> None:
        if not current_user.get("school_id"):
            raise ForbiddenException("Usuário sem escola vinculada.")

        if str(current_user.get("school_id")) != str(school_id):
            raise ForbiddenException(
                "Acesso negado para esta escola."
            )

    @staticmethod
    def is_same_organization(
        current_user: dict,
        organization_id: str,
    ) -> bool:
        return str(current_user.get("organization_id")) == str(organization_id)

    @staticmethod
    def is_same_school(
        current_user: dict,
        school_id: str,
    ) -> bool:
        return str(current_user.get("school_id")) == str(school_id)
