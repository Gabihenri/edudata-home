"""Unit tests for server-side Agenda membership and event authorization."""
import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from fastapi import HTTPException

from app.core.security.agenda_authorization import (
    authorize_event,
    authorize_school_scope,
)


def membership(**overrides):
    row = {
        "id": "membership-1",
        "user_id": "user-1",
        "organization_id": "org-1",
        "school_id": "school-1",
        "role": "teacher",
        "status": "active",
        "access_starts_at": None,
        "access_ends_at": None,
        "can_view_school": False,
    }
    row.update(overrides)
    return row


def event(**overrides):
    row = {
        "id": "event-1",
        "user_id": "user-1",
        "organization_id": "org-1",
        "school_id": "school-1",
    }
    row.update(overrides)
    return row


class AgendaAuthorizationTests(unittest.TestCase):
    def setUp(self):
        self.supabase_patcher = patch(
            "app.core.security.agenda_authorization.supabase"
        )
        self.supabase = self.supabase_patcher.start()
        self.addCleanup(self.supabase_patcher.stop)
        self.query = MagicMock()
        self.supabase.table.return_value = self.query
        self.query.select.return_value = self.query
        self.query.eq.return_value = self.query
        self.query.execute.return_value = SimpleNamespace(data=[membership()])

    def test_owner_read_requires_database_membership(self):
        result = authorize_event(
            authenticated_user={"id": "user-1"},
            event=event(),
            action="read",
        )
        self.assertEqual(result["id"], "membership-1")
        self.supabase.table.assert_called_once_with("organization_members")
        self.query.eq.assert_any_call("user_id", "user-1")
        self.query.eq.assert_any_call("organization_id", "org-1")
        self.query.eq.assert_any_call("school_id", "school-1")

    def test_peer_read_is_denied_without_explicit_school_permission(self):
        self.query.execute.return_value = SimpleNamespace(data=[membership()])
        with self.assertRaises(HTTPException) as raised:
            authorize_event(
                authenticated_user={"id": "user-1"},
                event=event(user_id="user-2"),
                action="read",
            )
        self.assertEqual(raised.exception.status_code, 403)

    def test_school_wide_access_requires_explicit_permission(self):
        with self.assertRaises(HTTPException) as raised:
            authorize_school_scope(
                authenticated_user={"id": "user-1"},
                organization_id="org-1",
                school_id="school-1",
            )
        self.assertEqual(raised.exception.status_code, 403)

    def test_school_wide_access_allowed_only_with_permission(self):
        self.query.execute.return_value = SimpleNamespace(
            data=[membership(can_view_school=True)]
        )
        result = authorize_school_scope(
            authenticated_user={"id": "user-1"},
            organization_id="org-1",
            school_id="school-1",
        )
        self.assertTrue(result["can_view_school"])

    def test_membership_query_failure_fails_closed(self):
        self.query.execute.side_effect = RuntimeError("database unavailable")
        with self.assertRaises(HTTPException) as raised:
            authorize_event(
                authenticated_user={"id": "user-1"},
                event=event(),
                action="read",
            )
        self.assertEqual(raised.exception.status_code, 503)
        self.assertNotIn("database unavailable", raised.exception.detail)

    def test_missing_authenticated_identity_is_rejected(self):
        with self.assertRaises(HTTPException) as raised:
            authorize_event(
                authenticated_user={},
                event=event(),
                action="read",
            )
        self.assertEqual(raised.exception.status_code, 401)
        self.supabase.table.assert_not_called()


if __name__ == "__main__":
    unittest.main()
