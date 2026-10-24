from collections.abc import Mapping
from typing import Any

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.services.supabase_service import supabase


security = HTTPBearer(auto_error=False)


class CurrentUser:
    """
    Valida o access token emitido pelo Supabase Auth.

    A identidade é obtida da resposta validada pelo serviço de autenticação.
    Claims de organização, escola e função não são usados como autorização:
    esses escopos devem ser resolvidos por membership ativo no banco.
    """

    @staticmethod
    def get(
        credentials: HTTPAuthorizationCredentials | None = Depends(security),
    ) -> dict[str, Any]:
        if credentials is None:
            raise HTTPException(
                status_code=401,
                detail="Token não informado.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        try:
            # get_user(token) validates the supplied session with Supabase Auth;
            # decoding a Supabase token with the application's legacy SECRET_KEY
            # would not validate the issuer's signature.
            response = supabase.auth.get_user(credentials.credentials)
        except Exception as exc:
            status_code = getattr(exc, "status", None) or getattr(
                exc, "status_code", None
            )

            if status_code in (400, 401, 403):
                raise HTTPException(
                    status_code=401,
                    detail="Token inválido ou expirado.",
                    headers={"WWW-Authenticate": "Bearer"},
                ) from exc

            # Fail closed, but distinguish an unavailable auth provider from a
            # token that the provider explicitly rejected.
            raise HTTPException(
                status_code=503,
                detail="Não foi possível validar a sessão no Supabase Auth.",
            ) from exc

        user = getattr(response, "user", None)
        if isinstance(user, Mapping):
            user_id = user.get("id")
            email = user.get("email")
            user_metadata = user.get("user_metadata")
        else:
            user_id = getattr(user, "id", None)
            email = getattr(user, "email", None)
            user_metadata = getattr(user, "user_metadata", None)

        if not isinstance(user_id, str) or not user_id.strip():
            raise HTTPException(
                status_code=401,
                detail="A sessão não contém uma identidade válida.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not isinstance(user_metadata, dict):
            user_metadata = {}

        # Do not infer authorization from user_metadata or unverified client
        # claims. Keep legacy scope keys empty until a route resolves an active
        # organization_members row for this verified identity.
        return {
            "id": user_id,
            "organization_id": None,
            "school_id": None,
            "role": None,
            "email": email,
            "user_metadata": user_metadata,
            "payload": {
                "sub": user_id,
                "email": email,
            },
        }
