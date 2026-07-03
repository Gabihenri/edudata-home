from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import jwt

from app.core.exceptions.exceptions import UnauthorizedException
from app.core.config import SECRET_KEY, ALGORITHM


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
            SECRET_KEY,
            algorithm=ALGORITHM,
        )

    @staticmethod
    def decode_token(token: str) -> dict[str, Any]:
        try:
            return jwt.decode(
                token,
                SECRET_KEY,
                algorithms=[ALGORITHM],
            )

        except jwt.ExpiredSignatureError:
            raise UnauthorizedException("Token expirado.")

        except jwt.InvalidTokenError:
            raise UnauthorizedException("Token inválido.")
