"""Route-level regression tests for Agenda authentication and write sanitization."""
import os
import unittest
from unittest.mock import patch

os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-only-key")

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient

from app.routers import agenda as agenda_router
from app.core.security import agenda_authorization


def make_app(authenticated=True):
    app = FastAPI()
    app.include_router(agenda_router.router)
    if authenticated:
        app.dependency_overrides[agenda_router.get_supabase_user] = lambda: {
            "id": "user-1",
            "auth_provider": "supabase",
        }
    return app


class AgendaRouterAuthorizationTests(unittest.TestCase):
    def test_list_requires_bearer_authentication(self):
        client = TestClient(make_app(authenticated=False))
        with patch.object(agenda_router.AgendaService, "list_by_teacher") as listing:
            response = client.get("/api/v1/agenda/")
        self.assertEqual(response.status_code, 401)
        listing.assert_not_called()

    def test_create_ignores_client_identity_and_internal_columns(self):
        client = TestClient(make_app())
        created = {
            "id": "server-event",
            "user_id": "user-1",
            "organization_id": "org-1",
            "school_id": "school-1",
            "title": "Planejamento",
        }
        membership = {
            "user_id": "user-1",
            "organization_id": "org-1",
            "school_id": "school-1",
            "role": "teacher",
        }
        payload = {
            "id": "forged-id",
            "user_id": "user-2",
            "organization_id": "org-1",
            "school_id": "school-1",
            "title": "Planejamento",
            "event_type": "pedagogico",
            "start_at": "2026-10-20T10:00:00Z",
            "end_at": "2026-10-20T11:00:00Z",
            "created_at": "2000-01-01T00:00:00Z",
            "role": "director",
            "metadata": {"is_admin": True},
            "unrecognized_column": "must-not-persist",
            "evidences": [{"id": "evidence-1"}],
        }
        with (
            patch.object(agenda_router, "authorize_event", return_value=membership),
            patch.object(agenda_router.AgendaService, "create", return_value=created) as create,
            patch.object(agenda_router.PipelineEngine, "execute", return_value={}),
        ):
            response = client.post("/api/v1/agenda/", json=payload)

        self.assertEqual(response.status_code, 200)
        persisted = create.call_args.args[0]
        self.assertEqual(persisted["user_id"], "user-1")
        self.assertEqual(persisted["organization_id"], "org-1")
        self.assertEqual(persisted["school_id"], "school-1")
        self.assertNotIn("id", persisted)
        self.assertNotIn("created_at", persisted)
        self.assertNotIn("role", persisted)
        self.assertNotIn("metadata", persisted)
        self.assertNotIn("unrecognized_column", persisted)
        self.assertNotIn("evidences", persisted)

    def test_update_denies_before_mutating_unauthorized_event(self):
        client = TestClient(make_app())
        existing = {
            "id": "event-1",
            "user_id": "user-2",
            "organization_id": "org-1",
            "school_id": "school-1",
            "title": "Private event",
        }
        with (
            patch.object(agenda_router.AgendaService, "find_by_id", return_value=existing),
            patch.object(
                agenda_router,
                "authorize_event",
                side_effect=HTTPException(status_code=403, detail="forbidden"),
            ),
            patch.object(agenda_router.AgendaService, "update") as update,
        ):
            response = client.put("/api/v1/agenda/event-1", json={"title": "tampered"})

        self.assertEqual(response.status_code, 403)
        update.assert_not_called()

    def test_status_change_denies_before_mutating_unauthorized_event(self):
        client = TestClient(make_app())
        existing = {
            "id": "event-1",
            "user_id": "user-2",
            "organization_id": "org-1",
            "school_id": "school-1",
            "title": "Private event",
            "status": "planned",
        }
        with (
            patch.object(agenda_router.AgendaService, "find_by_id", return_value=existing),
            patch.object(
                agenda_router,
                "authorize_event",
                side_effect=HTTPException(status_code=403, detail="forbidden"),
            ),
            patch.object(agenda_router.AgendaService, "change_status") as change_status,
        ):
            response = client.patch(
                "/api/v1/agenda/event-1/status",
                params={"status": "completed"},
            )

        self.assertEqual(response.status_code, 403)
        change_status.assert_not_called()


    def test_create_denies_when_no_active_membership_exists(self):
        client = TestClient(make_app())
        payload = {
            "organization_id": "org-1",
            "school_id": "school-1",
            "title": "Planejamento",
        }
        with (
            patch.object(agenda_authorization, "_load_memberships", return_value=[]),
            patch.object(agenda_router.AgendaService, "create") as create,
        ):
            response = client.post("/api/v1/agenda/", json=payload)

        self.assertEqual(response.status_code, 403)
        create.assert_not_called()

    def test_create_denies_membership_from_another_school(self):
        client = TestClient(make_app())
        payload = {
            "organization_id": "org-1",
            "school_id": "school-1",
            "title": "Planejamento",
        }
        other_school_membership = {
            "user_id": "user-1",
            "organization_id": "org-1",
            "school_id": "school-2",
            "status": "active",
            "role": "teacher",
            "can_view_school": True,
        }
        with (
            patch.object(
                agenda_authorization,
                "_load_memberships",
                return_value=[other_school_membership],
            ),
            patch.object(agenda_router.AgendaService, "create") as create,
        ):
            response = client.post("/api/v1/agenda/", json=payload)

        self.assertEqual(response.status_code, 403)
        create.assert_not_called()

    def test_create_fails_closed_when_membership_database_errors(self):
        client = TestClient(make_app())
        payload = {
            "organization_id": "org-1",
            "school_id": "school-1",
            "title": "Planejamento",
        }
        with (
            patch.object(
                agenda_authorization.supabase,
                "table",
                side_effect=RuntimeError("simulated database outage"),
            ),
            patch.object(agenda_router.AgendaService, "create") as create,
        ):
            response = client.post("/api/v1/agenda/", json=payload)

        self.assertEqual(response.status_code, 503)
        create.assert_not_called()

    def test_application_registers_only_one_agenda_handler_per_method_and_path(self):
        from main import app as application

        agenda_routes = [
            route
            for route in application.routes
            if getattr(route, "path", "").startswith("/api/v1/agenda")
            and hasattr(route, "methods")
        ]
        route_keys = [
            (route.path, method)
            for route in agenda_routes
            for method in route.methods
            if method not in {"HEAD", "OPTIONS"}
        ]
        self.assertEqual(
            len(route_keys),
            len(set(route_keys)),
            "Duplicate Agenda routes can shadow the authenticated router.",
        )


if __name__ == "__main__":
    unittest.main()
