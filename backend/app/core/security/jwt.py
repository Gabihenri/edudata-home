from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import jwt

from app.core.exceptions.exceptions import UnauthorizedException
from app.core.config import SECRET_KEY, ALGORITHM


def _require_secret_key() -> str:
    """Fail closed when the application JWT secret is not configured."""
    if not isinstance(SECRET_KEY, str) or not SECRET_KEY.strip():
        raise RuntimeError(
            "Configuração obrigatória ausente: SECRET_KEY para JWT da API."
        )
    return SECRET_KEY


class JWTService:
    """
    Serviço central de JWT da EduData IA.
    """

    @staticmethod
    def create_access_token(
        subject: str,
        data: Optional[dict[str, Any]] = None,
        expires_minutes: int = 60,
    ) -> str:
        payload = data.copy() if data else {}
        expire = datetime.now(timezone.utc) + timedelta(minutes=expires_minutes)

        payload.update(
            {
                "sub": subject,
                "exp": expire,
                "iat": datetime.now(timezone.utc),
                "type": "access",
            }
        )

        return jwt.encode(
            payload,
            _require_secret_key(),
            algorithm=ALGORITHM,
        )

    @staticmethod
    def decode_token(token: str) -> dict[str, Any]:
        secret_key = _require_secret_key()
        try:
            return jwt.decode(
                token,
                secret_key,
                algorithms=[ALGORITHM],
            )

        except jwt.ExpiredSignatureError:
            raise UnauthorizedException("Token expirado.")

        except jwt.InvalidTokenError:
            raise UnauthorizedException("Token inválido.")
