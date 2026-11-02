"""Route-level security regression tests for the Users API."""
import os
import unittest
from unittest.mock import patch

os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-only-key")

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.routers import users as users_router


def make_app(authenticated=True):
    app = FastAPI()
    app.include_router(users_router.router)
    if authenticated:
        app.dependency_overrides[users_router.get_supabase_user] = lambda: {
            "id": "auth-user-1",
            "email": "person@example.com",
            "auth_provider": "supabase",
        }
    return app


class UsersRouterSecurityTests(unittest.TestCase):
    def test_profile_route_requires_authentication(self):
        client = TestClient(make_app(authenticated=False))
        with patch.object(users_router.UserService, "find_by_id") as lookup:
            response = client.get("/api/v1/users/profile-1")
        self.assertEqual(response.status_code, 401)
        lookup.assert_not_called()

    def test_profile_route_allows_only_linked_identity(self):
        client = TestClient(make_app())
        profile = {
            "id": "profile-1",
            "auth_provider_id": "auth-user-1",
            "email": "person@example.com",
            "full_name": "Pessoa",
        }
        with patch.object(users_router.UserService, "find_by_id", return_value=profile):
            response = client.get("/api/v1/users/profile-1")
        self.assertEqual(response.status_code, 200)

    def test_profile_route_denies_other_identity(self):
        client = TestClient(make_app())
        profile = {
            "id": "profile-2",
            "auth_provider_id": "auth-user-2",
            "email": "other@example.com",
            "full_name": "Outra Pessoa",
        }
        with patch.object(users_router.UserService, "find_by_id", return_value=profile):
            response = client.get("/api/v1/users/profile-2")
        self.assertEqual(response.status_code, 403)

    def test_email_route_requires_matching_authenticated_email_and_identity(self):
        client = TestClient(make_app())
        with patch.object(users_router.UserService, "find_by_email") as lookup:
            response = client.get("/api/v1/users/email/other%40example.com")
        self.assertEqual(response.status_code, 403)
        lookup.assert_not_called()

    def test_unscoped_management_routes_fail_closed(self):
        client = TestClient(make_app())
        checks = [
            ("get", "/api/v1/users/"),
            ("get", "/api/v1/users/school/school-2"),
            ("post", "/api/v1/users/", {"organization_id": "org-1", "school_id": "school-1", "full_name": "Pessoa", "email": "person@example.com"}),
            ("put", "/api/v1/users/profile-2", {"organization_id": "org-1", "school_id": "school-1", "full_name": "Pessoa", "email": "person@example.com"}),
            ("patch", "/api/v1/users/profile-2/activate"),
            ("patch", "/api/v1/users/profile-2/deactivate"),
        ]
        for method, path, *payload in checks:
            with self.subTest(method=method, path=path):
                response = getattr(client, method)(path, json=payload[0]) if payload else getattr(client, method)(path)
                self.assertEqual(response.status_code, 403)


if __name__ == "__main__":
    unittest.main()
