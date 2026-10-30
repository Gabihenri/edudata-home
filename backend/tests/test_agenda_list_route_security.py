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

    @patch("app.routers.agenda.dashboard_summary_for_user")
    def test_dashboard_summary_requires_membership_and_uses_user_jwt(self, summary):
        summary.return_value = {
            "total_events": 2,
            "planned": 1,
            "completed": 1,
            "cancelled": 0,
            "upcoming": 1,
        }

        response = self.client.get("/api/v1/agenda/dashboard/summary")

        self.assertEqual(response.status_code, 200)
        summary.assert_called_once_with(access_token="verified-request-token")
        self.assertEqual(response.json()["data"]["total_events"], 2)

    def test_dashboard_summary_rejects_missing_membership(self):
        self.app.dependency_overrides[get_current_membership] = lambda: (
            self._raise_forbidden()
        )

        response = self.client.get("/api/v1/agenda/dashboard/summary")

        self.assertEqual(response.status_code, 403)

    @patch("app.routers.agenda.get_event_for_user")
    def test_single_event_route_uses_user_scoped_repository(self, read_event):
        read_event.return_value = {"id": "event-7", "title": "Termodinâmica"}

        response = self.client.get("/api/v1/agenda/event-7")

        self.assertEqual(response.status_code, 200)
        read_event.assert_called_once_with(
            access_token="verified-request-token",
            event_id="event-7",
        )
        self.assertEqual(response.json()["data"]["id"], "event-7")

    @patch("app.routers.agenda.get_event_for_user")
    def test_single_event_hidden_by_rls_is_returned_as_not_found(self, read_event):
        read_event.return_value = None

        response = self.client.get("/api/v1/agenda/event-from-another-user")

        self.assertEqual(response.status_code, 404)

    def test_single_event_route_rejects_missing_membership(self):
        self.app.dependency_overrides[get_current_membership] = lambda: (
            self._raise_forbidden()
        )

        response = self.client.get("/api/v1/agenda/event-7")

        self.assertEqual(response.status_code, 403)

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
