from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.security.jwt import JWTService

security = HTTPBearer(auto_error=False)


class CurrentUser:
    """
    Valida o token de acesso da API.

    Os campos organization_id, school_id e role retornados abaixo são claims
    de compatibilidade, não uma decisão de autorização. Endpoints protegidos
    devem resolver o membership vigente e validar o escopo no servidor.
    """

    @staticmethod
    def get(
        credentials: HTTPAuthorizationCredentials | None = Depends(security),
    ) -> dict:
        if credentials is None:
            raise HTTPException(
                status_code=401,
                detail="Token não informado.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        payload = JWTService.decode_token(credentials.credentials)

        subject = payload.get("sub")
        if not isinstance(subject, str) or not subject.strip():
            raise HTTPException(
                status_code=401,
                detail="Token sem identificador de usuário válido.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if payload.get("type") != "access":
            raise HTTPException(
                status_code=401,
                detail="Tipo de token inválido.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return {
            "id": subject,
            "organization_id": payload.get("organization_id"),
            "school_id": payload.get("school_id"),
            "role": payload.get("role"),
            "email": payload.get("email"),
            "payload": payload,
        }
