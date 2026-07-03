from typing import Any

from app.core.security.jwt import JWTService


class AuthService:
    """
    Serviço central de autenticação da EduData IA.
    """

    @staticmethod
    def create_token_for_user(user: dict[str, Any]) -> str:
        return JWTService.create_access_token(
            subject=str(user["id"]),
            data={
                "email": user.get("email"),
                "role": user.get("role"),
                "organization_id": user.get("organization_id"),
                "school_id": user.get("school_id"),
            },
        )

    @staticmethod
    def build_auth_response(user: dict[str, Any]) -> dict[str, Any]:
        token = AuthService.create_token_for_user(user)

        return {
            "access_token": token,
            "token_type": "bearer",
            "user": user,
        }
