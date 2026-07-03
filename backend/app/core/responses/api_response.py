from typing import Any, Optional


class ApiResponse:
    """
    Classe responsável por padronizar todas as respostas
    da API da EduData IA.
    """

    @staticmethod
    def success(
        data: Any = None,
        message: str = "Operação realizada com sucesso.",
    ) -> dict[str, Any]:
        return {
            "success": True,
            "message": message,
            "data": data,
        }

    @staticmethod
    def created(
        data: Any = None,
        message: str = "Registro criado com sucesso.",
    ) -> dict[str, Any]:
        return {
            "success": True,
            "message": message,
            "data": data,
        }

    @staticmethod
    def updated(
        data: Any = None,
        message: str = "Registro atualizado com sucesso.",
    ) -> dict[str, Any]:
        return {
            "success": True,
            "message": message,
            "data": data,
        }

    @staticmethod
    def deleted(
        message: str = "Registro removido com sucesso.",
    ) -> dict[str, Any]:
        return {
            "success": True,
            "message": message,
        }

    @staticmethod
    def error(
        message: str = "Erro interno da plataforma.",
        details: Optional[Any] = None,
    ) -> dict[str, Any]:
        return {
            "success": False,
            "message": message,
            "details": details,
        }

    @staticmethod
    def validation_error(
        errors: Any,
        message: str = "Erro de validação.",
    ) -> dict[str, Any]:
        return {
            "success": False,
            "message": message,
            "errors": errors,
        }

    @staticmethod
    def paginated(
        items: list[Any],
        total: int,
        page: int,
        page_size: int,
    ) -> dict[str, Any]:
        return {
            "success": True,
            "total": total,
            "page": page,
            "page_size": page_size,
            "items": items,
        }