"""HTTP-level security tests for the Agenda event listing route."""
import unittest
from unittest.mock import patch

from fastapi import FastAPI, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.testclient import TestClient

from app.core.security.current_membership import get_current_membership
from app.core.security.current_user import security
from app.routers import agenda


class AgendaListRouteSecurityTests(unittest.TestCase):
    def setUp(self):
        self.app = FastAPI()
        self.app.include_router(agenda.router)
        self.app.dependency_overrides[security] = lambda: (
            HTTPAuthorizationCredentials(
                scheme="Bearer",
                credentials="verified-request-token",
            )
        )
        self.app.dependency_overrides[get_current_membership] = lambda: {
            "user_id": "verified-user",
            "organization_id": "org-from-database",
            "school_id": "school-from-database",
            "role": "teacher",
            "status": "active",
        }
        self.client = TestClient(self.app)

    def tearDown(self):
        self.app.dependency_overrides.clear()

    @patch("app.routers.agenda.list_events_for_user")
    def test_list_route_uses_user_scoped_repository_after_membership(self, read_events):
        read_events.return_value = [{"id": "event-1", "title": "Aula"}]

        response = self.client.get("/api/v1/agenda/?limit=20")

        self.assertEqual(response.status_code, 200)
        read_events.assert_called_once_with(
            access_token="verified-request-token",
            limit=20,
        )
        self.assertEqual(response.json()["data"]["total"], 1)

    def test_list_route_rejects_request_without_bearer_token(self):
        self.app.dependency_overrides[security] = lambda: None
        self.app.dependency_overrides[get_current_membership] = lambda: (
            self._raise_unauthorized()
        )

        response = self.client.get("/api/v1/agenda/")

        self.assertEqual(response.status_code, 401)

    def test_list_route_rejects_user_without_active_membership(self):
        self.app.dependency_overrides[get_current_membership] = lambda: (
            self._raise_forbidden()
        )

        response = self.client.get("/api/v1/agenda/")

        self.assertEqual(response.status_code, 403)

    @staticmethod
    def _raise_unauthorized():
        raise HTTPException(status_code=401, detail="Token não informado.")

    @staticmethod
    def _raise_forbidden():
        raise HTTPException(status_code=403, detail="Vínculo institucional ausente.")


if __name__ == "__main__":
    unittest.main()
