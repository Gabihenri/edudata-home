from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security.jwt import JWTService

security = HTTPBearer()


class CurrentUser:
    """
    Recupera o usuário autenticado a partir do JWT.
    """

    @staticmethod
    def get(
        credentials: HTTPAuthorizationCredentials = Depends(security),
    ) -> dict:

        if credentials is None:
            raise HTTPException(
                status_code=401,
                detail="Token não informado.",
            )

        token = credentials.credentials

        payload = JWTService.decode_token(token)

        return {
            "id": payload.get("sub"),
            "organization_id": payload.get("organization_id"),
            "school_id": payload.get("school_id"),
            "role": payload.get("role"),
            "email": payload.get("email"),
            "payload": payload,
        }
