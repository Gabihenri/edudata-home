from passlib.context import CryptContext


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


class PasswordService:
    """
    Serviço central para hash e verificação de senhas.
    """

    @staticmethod
    def hash(password: str) -> str:
        return pwd_context.hash(password)

    @staticmethod
    def verify(
        plain_password: str,
        hashed_password: str,
    ) -> bool:
        return pwd_context.verify(
            plain_password,
            hashed_password,
        )
