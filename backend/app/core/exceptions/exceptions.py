class EduDataException(Exception):
    """
    Exceção base da plataforma EduData IA.
    """

    def __init__(
        self,
        message: str = "Erro interno da plataforma.",
        status_code: int = 500,
    ):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class ValidationException(EduDataException):
    """
    Erros de validação.
    """

    def __init__(self, message: str = "Dados inválidos."):
        super().__init__(message, 400)


class UnauthorizedException(EduDataException):
    """
    Usuário não autenticado.
    """

    def __init__(self, message: str = "Não autorizado."):
        super().__init__(message, 401)


class ForbiddenException(EduDataException):
    """
    Usuário sem permissão.
    """

    def __init__(self, message: str = "Acesso negado."):
        super().__init__(message, 403)


class NotFoundException(EduDataException):
    """
    Recurso não encontrado.
    """

    def __init__(self, message: str = "Recurso não encontrado."):
        super().__init__(message, 404)


class ConflictException(EduDataException):
    """
    Conflito de dados.
    """

    def __init__(self, message: str = "Conflito de informações."):
        super().__init__(message, 409)


class DatabaseException(EduDataException):
    """
    Erros relacionados ao banco de dados.
    """

    def __init__(self, message: str = "Erro de banco de dados."):
        super().__init__(message, 500)


class IntegrationException(EduDataException):
    """
    Erros de integração com serviços externos.
    """

    def __init__(self, message: str = "Erro de integração externa."):
        super().__init__(message, 502)


class EngineException(EduDataException):
    """
    Erros do EDI Intelligence Engine.
    """

    def __init__(self, message: str = "Erro no EDI Intelligence Engine."):
        super().__init__(message, 500)