"""Tests for JWT-scoped Agenda event reads."""
import json
import unittest
from unittest.mock import MagicMock, patch
from urllib.parse import parse_qs, urlparse

from fastapi import HTTPException

from app.repositories import agenda_read_repository


class AgendaReadRepositoryTests(unittest.TestCase):
    def _response(self, payload):
        response = MagicMock()
        response.__enter__ = MagicMock(return_value=response)
        response.__exit__ = MagicMock(return_value=False)
        response.read.return_value = json.dumps(payload).encode("utf-8")
        return response

    @patch.object(agenda_read_repository, "urlopen")
    @patch.object(agenda_read_repository, "SUPABASE_ANON_KEY", "public-anon-key")
    @patch.object(agenda_read_repository, "SUPABASE_URL", "https://example.supabase.co")
    def test_reads_events_with_request_token_and_rls(self, mocked_urlopen):
        events = [{"id": "event-1", "title": "Aula de Física"}]
        mocked_urlopen.return_value = self._response(events)

        result = agenda_read_repository.list_events_for_user(
            "user-specific-jwt",
            limit=25,
        )

        request = mocked_urlopen.call_args.args[0]
        parsed = urlparse(request.full_url)
        query = parse_qs(parsed.query)
        self.assertEqual(parsed.path, "/rest/v1/agenda_events")
        self.assertEqual(query["select"], ["*"])
        self.assertEqual(query["deleted_at"], ["is.null"])
        self.assertEqual(query["order"], ["start_at.asc"])
        self.assertEqual(query["limit"], ["25"])
        self.assertEqual(
            request.get_header("Authorization"),
            "Bearer user-specific-jwt",
        )
        self.assertEqual(request.get_header("Apikey"), "public-anon-key")
        self.assertEqual(result, events)

    @patch.object(agenda_read_repository, "urlopen")
    @patch.object(agenda_read_repository, "SUPABASE_ANON_KEY", "public-anon-key")
    @patch.object(agenda_read_repository, "SUPABASE_URL", "https://example.supabase.co")
    def test_provider_authorization_denial_is_not_returned_as_empty_data(
        self, mocked_urlopen
    ):
        from urllib.error import HTTPError

        mocked_urlopen.side_effect = HTTPError(
            "https://example.supabase.co/rest/v1/agenda_events",
            403,
            "Forbidden",
            {},
            None,
        )
        with self.assertRaises(HTTPException) as caught:
            agenda_read_repository.list_events_for_user("user-jwt")
        self.assertEqual(caught.exception.status_code, 403)

    @patch.object(agenda_read_repository, "urlopen")
    @patch.object(agenda_read_repository, "SUPABASE_ANON_KEY", "public-anon-key")
    @patch.object(agenda_read_repository, "SUPABASE_URL", "https://example.supabase.co")
    def test_reads_single_event_by_id_with_user_jwt(self, mocked_urlopen):
        event = {"id": "event-123", "title": "Aula de Física"}
        mocked_urlopen.return_value = self._response([event])

        result = agenda_read_repository.get_event_for_user(
            "individual-user-jwt",
            "event-123",
        )

        request = mocked_urlopen.call_args.args[0]
        query = parse_qs(urlparse(request.full_url).query)
        self.assertEqual(query["id"], ["eq.event-123"])
        self.assertEqual(query["deleted_at"], ["is.null"])
        self.assertEqual(query["limit"], ["1"])
        self.assertEqual(
            request.get_header("Authorization"),
            "Bearer individual-user-jwt",
        )
        self.assertEqual(result, event)

    @patch.object(agenda_read_repository, "urlopen")
    @patch.object(agenda_read_repository, "SUPABASE_ANON_KEY", "public-anon-key")
    @patch.object(agenda_read_repository, "SUPABASE_URL", "https://example.supabase.co")
    def test_invisible_or_missing_event_returns_none(self, mocked_urlopen):
        mocked_urlopen.return_value = self._response([])
        self.assertIsNone(
            agenda_read_repository.get_event_for_user("user-jwt", "event-other-user")
        )

    @patch.object(agenda_read_repository, "list_events_for_user")
    def test_dashboard_summary_aggregates_only_user_visible_events(self, list_events):
        list_events.return_value = [
            {"id": "1", "status": "planejado", "start_at": "2099-01-01T10:00:00Z"},
            {"id": "2", "status": "completed", "start_at": "2020-01-01T10:00:00Z"},
            {"id": "3", "status": "cancelled", "start_at": "invalid"},
            {"id": "4", "status": "in_progress", "start_at": "2099-01-02T10:00:00Z"},
        ]

        summary = agenda_read_repository.dashboard_summary_for_user("user-jwt")

        list_events.assert_called_once_with(access_token="user-jwt", limit=500)
        self.assertEqual(
            summary,
            {
                "total_events": 4,
                "planned": 1,
                "completed": 1,
                "cancelled": 1,
                "upcoming": 2,
            },
        )


    @patch.object(agenda_read_repository, "urlopen")
    @patch.object(agenda_read_repository, "SUPABASE_ANON_KEY", "public-anon-key")
    @patch.object(agenda_read_repository, "SUPABASE_URL", "https://example.supabase.co")
    def test_teacher_query_uses_user_jwt_and_teacher_filter(self, mocked_urlopen):
        events = [{"id": "event-1", "user_id": "teacher-1"}]
        mocked_urlopen.return_value = self._response(events)
        result = agenda_read_repository.list_events_for_teacher_for_user(
            "caller-jwt", "teacher-1", limit=30
        )
        request = mocked_urlopen.call_args.args[0]
        query = parse_qs(urlparse(request.full_url).query)
        self.assertEqual(query["user_id"], ["eq.teacher-1"])
        self.assertEqual(query["deleted_at"], ["is.null"])
        self.assertEqual(query["limit"], ["30"])
        self.assertEqual(request.get_header("Authorization"), "Bearer caller-jwt")
        self.assertEqual(result, events)


    @patch.object(agenda_read_repository, "urlopen")
    @patch.object(agenda_read_repository, "SUPABASE_ANON_KEY", "public-anon-key")
    @patch.object(agenda_read_repository, "SUPABASE_URL", "https://example.supabase.co")
    def test_school_query_uses_user_jwt_and_school_filter(self, mocked_urlopen):
        events = [{"id": "event-2", "school_id": "school-2"}]
        mocked_urlopen.return_value = self._response(events)
        result = agenda_read_repository.list_events_for_school_for_user(
            "caller-jwt", "school-2", limit=40
        )
        request = mocked_urlopen.call_args.args[0]
        query = parse_qs(urlparse(request.full_url).query)
        self.assertEqual(query["school_id"], ["eq.school-2"])
        self.assertEqual(query["deleted_at"], ["is.null"])
        self.assertEqual(query["limit"], ["40"])
        self.assertEqual(request.get_header("Authorization"), "Bearer caller-jwt")
        self.assertEqual(result, events)


    @patch.object(agenda_read_repository, "urlopen")
    @patch.object(agenda_read_repository, "SUPABASE_ANON_KEY", "public-anon-key")
    @patch.object(agenda_read_repository, "SUPABASE_URL", "https://example.supabase.co")
    def test_school_query_supports_start_and_end_date_filters(self, mocked_urlopen):
        mocked_urlopen.return_value = self._response([])
        agenda_read_repository.list_events_for_school_for_user(
            "caller-jwt",
            "school-3",
            start_at_gte="2026-10-01T00:00:00+00:00",
            end_at_lte="2026-10-31T23:59:59+00:00",
        )
        query = parse_qs(urlparse(mocked_urlopen.call_args.args[0].full_url).query)
        self.assertEqual(query["start_at"], ["gte.2026-10-01T00:00:00+00:00"])
        self.assertEqual(query["end_at"], ["lte.2026-10-31T23:59:59+00:00"])


    @patch.object(agenda_read_repository, "urlopen")
    @patch.object(agenda_read_repository, "SUPABASE_ANON_KEY", "public-anon-key")
    @patch.object(agenda_read_repository, "SUPABASE_URL", "https://example.supabase.co")
    def test_create_event_uses_verified_membership_scope(self, mocked_urlopen):
        response = self._response([{
            "id": "created-event",
            "user_id": "verified-user",
            "organization_id": "verified-org",
            "school_id": "verified-school",
        }])
        mocked_urlopen.return_value = response
        result = agenda_read_repository.create_event_for_user(
            "caller-jwt",
            {
                "user_id": "verified-user",
                "organization_id": "verified-org",
                "school_id": "verified-school",
                "role": "teacher",
            },
            {
                "title": "Aula de Física",
                "event_type": "pedagogico",
                "start_at": "2026-10-30T14:00:00-03:00",
            },
        )
        request = mocked_urlopen.call_args.args[0]
        body = json.loads(request.data.decode("utf-8"))
        self.assertEqual(request.get_method(), "POST")
        self.assertEqual(request.get_header("Authorization"), "Bearer caller-jwt")
        self.assertEqual(body["user_id"], "verified-user")
        self.assertEqual(body["organization_id"], "verified-org")
        self.assertEqual(body["school_id"], "verified-school")
        self.assertNotIn("role", body)
        self.assertEqual(result["id"], "created-event")

    def test_create_event_rejects_client_controlled_scope_fields(self):
        with self.assertRaises(HTTPException) as caught:
            agenda_read_repository.create_event_for_user(
                "caller-jwt",
                {
                    "user_id": "verified-user",
                    "organization_id": "verified-org",
                    "school_id": "verified-school",
                },
                {
                    "title": "Aula",
                    "event_type": "pedagogico",
                    "start_at": "2026-10-30T14:00:00-03:00",
                    "organization_id": "attacker-org",
                },
            )
        self.assertEqual(caught.exception.status_code, 422)


    @patch.object(agenda_read_repository, "urlopen")
    @patch.object(agenda_read_repository, "SUPABASE_ANON_KEY", "public-anon-key")
    @patch.object(agenda_read_repository, "SUPABASE_URL", "https://example.supabase.co")
    def test_update_event_uses_request_jwt_and_only_mutable_fields(self, mocked_urlopen):
        event = {"id": "event-1", "title": "Aula atualizada"}
        mocked_urlopen.return_value = self._response([event])
        result = agenda_read_repository.update_event_for_user(
            "caller-jwt",
            "event-1",
            {"title": "Aula atualizada", "priority": "alta"},
        )
        request = mocked_urlopen.call_args.args[0]
        query = parse_qs(urlparse(request.full_url).query)
        body = json.loads(request.data.decode("utf-8"))
        self.assertEqual(request.get_method(), "PATCH")
        self.assertEqual(query["id"], ["eq.event-1"])
        self.assertEqual(query["deleted_at"], ["is.null"])
        self.assertEqual(request.get_header("Authorization"), "Bearer caller-jwt")
        self.assertEqual(body, {"title": "Aula atualizada", "priority": "alta"})
        self.assertEqual(result, event)

    def test_update_event_rejects_attempt_to_change_owner_or_scope(self):
        with self.assertRaises(HTTPException) as caught:
            agenda_read_repository.update_event_for_user(
                "caller-jwt",
                "event-1",
                {"school_id": "other-school"},
            )
        self.assertEqual(caught.exception.status_code, 422)

    def test_update_event_rejects_inverted_timestamps(self):
        with self.assertRaises(HTTPException) as caught:
            agenda_read_repository.update_event_for_user(
                "caller-jwt",
                "event-1",
                {
                    "start_at": "2026-10-30T16:00:00Z",
                    "end_at": "2026-10-30T15:00:00Z",
                },
            )
        self.assertEqual(caught.exception.status_code, 422)

    @patch.object(agenda_read_repository, "urlopen")
    @patch.object(agenda_read_repository, "SUPABASE_ANON_KEY", "public-anon-key")
    @patch.object(agenda_read_repository, "SUPABASE_URL", "https://example.supabase.co")
    def test_update_event_returns_none_when_rls_hides_target(self, mocked_urlopen):
        mocked_urlopen.return_value = self._response([])
        self.assertIsNone(
            agenda_read_repository.update_event_for_user(
                "caller-jwt", "event-not-visible", {"title": "Alteração"}
            )
        )

    def test_invalid_limit_is_rejected(self):
        with self.assertRaises(HTTPException) as caught:
            agenda_read_repository.list_events_for_user("user-jwt", limit=0)
        self.assertEqual(caught.exception.status_code, 422)


    @patch.object(agenda_read_repository, "update_event_for_user")
    def test_change_status_uses_rls_scoped_update(self, update_event):
        event = {"id": "event-1", "status": "completed"}
        update_event.return_value = event

        result = agenda_read_repository.change_event_status_for_user(
            "caller-jwt", "event-1", "completed"
        )

        update_event.assert_called_once_with(
            access_token="caller-jwt",
            event_id="event-1",
            payload={"status": "completed"},
        )
        self.assertEqual(result, event)

    def test_change_status_rejects_unknown_status(self):
        with self.assertRaises(HTTPException) as caught:
            agenda_read_repository.change_event_status_for_user(
                "caller-jwt", "event-1", "in_progress"
            )
        self.assertEqual(caught.exception.status_code, 422)

    def test_change_status_rejects_empty_status(self):
        with self.assertRaises(HTTPException) as caught:
            agenda_read_repository.change_event_status_for_user(
                "caller-jwt", "event-1", ""
            )
        self.assertEqual(caught.exception.status_code, 422)


    @patch.object(agenda_read_repository, "urlopen")
    @patch.object(agenda_read_repository, "SUPABASE_ANON_KEY", "public-anon-key")
    @patch.object(agenda_read_repository, "SUPABASE_URL", "https://example.supabase.co")
    def test_soft_delete_uses_audited_rpc_and_request_jwt(self, mocked_urlopen):
        deleted = {"id": "event-1", "deleted_at": "2026-10-30T12:00:00Z"}
        mocked_urlopen.return_value = self._response(deleted)

        result = agenda_read_repository.soft_delete_event_for_user(
            "caller-jwt", "event-1", "Evento duplicado"
        )

        request = mocked_urlopen.call_args.args[0]
        body = json.loads(request.data.decode("utf-8"))
        self.assertEqual(
            request.full_url,
            "https://example.supabase.co/rest/v1/rpc/soft_delete_agenda_record",
        )
        self.assertEqual(request.get_method(), "POST")
        self.assertEqual(request.get_header("Authorization"), "Bearer caller-jwt")
        self.assertEqual(request.get_header("Apikey"), "public-anon-key")
        self.assertEqual(
            body,
            {
                "requested_resource_type": "agenda_events",
                "requested_resource_id": "event-1",
                "requested_reason": "Evento duplicado",
            },
        )
        self.assertEqual(result, deleted)

    def test_soft_delete_rejects_blank_reason(self):
        with self.assertRaises(HTTPException) as caught:
            agenda_read_repository.soft_delete_event_for_user(
                "caller-jwt", "event-1", "   "
            )
        self.assertEqual(caught.exception.status_code, 422)

    def test_soft_delete_rejects_reason_longer_than_limit(self):
        with self.assertRaises(HTTPException) as caught:
            agenda_read_repository.soft_delete_event_for_user(
                "caller-jwt", "event-1", "x" * 1001
            )
        self.assertEqual(caught.exception.status_code, 422)


if __name__ == "__main__":
    unittest.main()
