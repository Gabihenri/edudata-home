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

    def test_invalid_limit_is_rejected(self):
        with self.assertRaises(HTTPException) as caught:
            agenda_read_repository.list_events_for_user("user-jwt", limit=0)
        self.assertEqual(caught.exception.status_code, 422)


if __name__ == "__main__":
    unittest.main()
