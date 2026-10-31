"""HTTP-level authorization tests for the user directory routes."""
import unittest
from unittest.mock import patch

from fastapi import FastAPI, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.testclient import TestClient

from app.core.security.current_membership import get_current_membership
from app.core.security.current_user import security
from app.routers import users


class UserRoutesSecurityTests(unittest.TestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(users.router)
        self.membership = {
            "user_id": "verified-user",
            "organization_id": "org-verified",
            "school_id": "school-verified",
            "role": "teacher",
            "status": "active",
            "can_manage_users": True,
        }
        self.app.dependency_overrides[security] = lambda: (
            HTTPAuthorizationCredentials(
                scheme="Bearer",
                credentials="verified-request-token",
            )
        )
        self.app.dependency_overrides[get_current_membership] = (
            lambda: self.membership
        )
        self.client = TestClient(self.app)

    def tearDown(self):
        self.app.dependency_overrides.clear()

    @patch("app.routers.users.list_users_for_membership")
    def test_list_requires_membership_and_passes_user_jwt(self, list_users):
        list_users.return_value = [{"id": "user-2"}]
        response = self.client.get("/api/v1/users/?limit=12")
        self.assertEqual(response.status_code, 200)
        list_users.assert_called_once_with(
            access_token="verified-request-token",
            membership=self.membership,
            limit=12,
        )
        self.assertEqual(response.json()["data"]["total"], 1)

    @patch("app.routers.users.get_user_for_membership")
    def test_detail_is_scoped_to_verified_membership(self, get_user):
        get_user.return_value = {"id": "user-3"}
        response = self.client.get("/api/v1/users/user-3")
        self.assertEqual(response.status_code, 200)
        get_user.assert_called_once_with(
            access_token="verified-request-token",
            membership=self.membership,
            user_id="user-3",
        )

    @patch("app.routers.users.list_users_for_membership")
    def test_school_route_rejects_school_outside_membership(self, list_users):
        response = self.client.get("/api/v1/users/school/other-school")
        self.assertEqual(response.status_code, 403)
        list_users.assert_not_called()

    @patch("app.routers.users.list_users_for_membership")
    def test_school_route_uses_only_membership_school(self, list_users):
        list_users.return_value = [{"id": "user-4"}]
        response = self.client.get("/api/v1/users/school/school-verified")
        self.assertEqual(response.status_code, 200)
        list_users.assert_called_once_with(
            access_token="verified-request-token",
            membership=self.membership,
            limit=100,
        )

    def test_directory_rejects_missing_membership(self):
        def deny():
            raise HTTPException(status_code=403, detail="Sem vínculo")
        self.app.dependency_overrides[get_current_membership] = deny
        response = self.client.get("/api/v1/users/")
        self.assertEqual(response.status_code, 403)

    def test_create_user_is_disabled_until_auth_lifecycle_is_safe(self):
        response = self.client.post(
            "/api/v1/users/",
            json={
                "organization_id": "org-client",
                "school_id": "school-client",
                "full_name": "Usuário Teste",
                "email": "teste@example.com",
            },
        )
        self.assertEqual(response.status_code, 501)

    def test_update_user_is_disabled(self):
        response = self.client.put(
            "/api/v1/users/user-1",
            json={"full_name": "Alterado"},
        )
        self.assertEqual(response.status_code, 501)

    def test_activation_endpoints_are_disabled(self):
        self.assertEqual(
            self.client.patch("/api/v1/users/user-1/activate").status_code,
            501,
        )
        self.assertEqual(
            self.client.patch("/api/v1/users/user-1/deactivate").status_code,
            501,
        )


if __name__ == "__main__":
    unittest.main()
