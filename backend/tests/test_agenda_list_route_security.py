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




    @patch("app.routers.agenda.list_events_for_school_for_user")
    def test_upcoming_school_events_use_user_jwt_and_future_filter(self, read_events):
        read_events.return_value = [{"id": "future-event", "school_id": "school-12"}]
        response = self.client.get("/api/v1/agenda/school/school-12/upcoming?limit=8")
        self.assertEqual(response.status_code, 200)
        kwargs = read_events.call_args.kwargs
        self.assertEqual(kwargs["access_token"], "verified-request-token")
        self.assertEqual(kwargs["school_id"], "school-12")
        self.assertEqual(kwargs["limit"], 8)
        self.assertTrue(kwargs["start_at_gte"])

    @patch("app.routers.agenda.list_events_for_school_for_user")
    def test_school_events_between_uses_user_jwt_and_date_bounds(self, read_events):
        read_events.return_value = []
        response = self.client.get(
            "/api/v1/agenda/school/school-12/between"
            "?start=2026-10-01T00:00:00Z&end=2026-10-31T23:59:59Z"
        )
        self.assertEqual(response.status_code, 200)
        kwargs = read_events.call_args.kwargs
        self.assertEqual(kwargs["access_token"], "verified-request-token")
        self.assertEqual(kwargs["school_id"], "school-12")
        self.assertEqual(kwargs["start_at_gte"], "2026-10-01T00:00:00+00:00")
        self.assertEqual(kwargs["end_at_lte"], "2026-10-31T23:59:59+00:00")

    def test_school_events_between_rejects_inverted_dates(self):
        response = self.client.get(
            "/api/v1/agenda/school/school-12/between"
            "?start=2026-10-31T00:00:00Z&end=2026-10-01T00:00:00Z"
        )
        self.assertEqual(response.status_code, 422)

    @patch("app.routers.agenda.list_events_for_school_for_user")
    def test_school_events_route_uses_verified_jwt_and_rls_query(self, read_events):
        read_events.return_value = [{"id": "event-11", "school_id": "school-11"}]
        response = self.client.get("/api/v1/agenda/school/school-11?limit=22")
        self.assertEqual(response.status_code, 200)
        read_events.assert_called_once_with(
            access_token="verified-request-token",
            school_id="school-11",
            limit=22,
        )

    def test_school_events_route_rejects_missing_membership(self):
        self.app.dependency_overrides[get_current_membership] = lambda: (
            self._raise_forbidden()
        )
        response = self.client.get("/api/v1/agenda/school/school-11")
        self.assertEqual(response.status_code, 403)

    @patch("app.routers.agenda.list_events_for_teacher_for_user")
    def test_teacher_events_route_uses_verified_jwt_and_rls_query(self, read_events):
        read_events.return_value = [{"id": "event-9", "user_id": "teacher-9"}]
        response = self.client.get("/api/v1/agenda/teacher/teacher-9?limit=15")
        self.assertEqual(response.status_code, 200)
        read_events.assert_called_once_with(
            access_token="verified-request-token",
            teacher_id="teacher-9",
            limit=15,
        )

    def test_teacher_events_route_rejects_missing_membership(self):
        self.app.dependency_overrides[get_current_membership] = lambda: (
            self._raise_forbidden()
        )
        response = self.client.get("/api/v1/agenda/teacher/teacher-9")
        self.assertEqual(response.status_code, 403)


    @patch("app.routers.agenda.PipelineEngine.execute")
    @patch("app.routers.agenda.create_event_for_user")
    def test_create_event_uses_verified_membership_and_request_jwt(
        self, create_event, execute_pipeline
    ):
        create_event.return_value = {"id": "new-event", "title": "Aula"}
        execute_pipeline.return_value = {"score": 0}
        response = self.client.post(
            "/api/v1/agenda/",
            json={
                "title": "Aula",
                "event_type": "pedagogico",
                "start_at": "2026-10-30T14:00:00-03:00",
            },
        )
        self.assertEqual(response.status_code, 200)
        create_event.assert_called_once_with(
            access_token="verified-request-token",
            membership={
                "user_id": "verified-user",
                "organization_id": "org-from-database",
                "school_id": "school-from-database",
                "role": "teacher",
                "status": "active",
            },
            payload={
                "title": "Aula",
                "event_type": "pedagogico",
                "start_at": "2026-10-30T14:00:00-03:00",
            },
        )
        pipeline_context = execute_pipeline.call_args.kwargs["context"]
        self.assertEqual(pipeline_context.user_id, "verified-user")
        self.assertEqual(pipeline_context.organization_id, "org-from-database")
        self.assertEqual(pipeline_context.school_id, "school-from-database")

    def test_create_event_rejects_missing_membership(self):
        self.app.dependency_overrides[get_current_membership] = lambda: (
            self._raise_forbidden()
        )
        response = self.client.post(
            "/api/v1/agenda/",
            json={
                "title": "Aula",
                "event_type": "pedagogico",
                "start_at": "2026-10-30T14:00:00-03:00",
            },
        )
        self.assertEqual(response.status_code, 403)

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
