"""Request-scoped PostgREST membership lookup tests."""
import json
import unittest
from unittest.mock import MagicMock, patch
from urllib.parse import parse_qs, urlparse

from fastapi import HTTPException

from app.core.security import membership_repository


class MembershipRepositoryTests(unittest.TestCase):
    def setUp(self):
        self.user_id = "verified-user-123"
        self.token = "jwt-for-this-request"
        self.membership = {
            "user_id": self.user_id,
            "organization_id": "org-1",
            "school_id": "school-1",
            "role": "teacher",
            "status": "active",
            "access_starts_at": None,
            "access_ends_at": None,
        }

    def _response(self, payload):
        response = MagicMock()
        response.__enter__ = MagicMock(return_value=response)
        response.__exit__ = MagicMock(return_value=False)
        response.read.return_value = json.dumps(payload).encode("utf-8")
        return response

    @patch.object(membership_repository, "urlopen")
    @patch.object(membership_repository, "SUPABASE_ANON_KEY", "public-anon-key")
    @patch.object(membership_repository, "SUPABASE_URL", "https://example.supabase.co")
    def test_queries_only_verified_user_and_minimum_membership_columns(
        self, mocked_urlopen
    ):
        mocked_urlopen.return_value = self._response([self.membership])

        result = membership_repository.load_active_membership(
            access_token=self.token,
            verified_user_id=self.user_id,
        )

        request = mocked_urlopen.call_args.args[0]
        parsed = urlparse(request.full_url)
        query = parse_qs(parsed.query)
        self.assertEqual(parsed.path, "/rest/v1/organization_members")
        self.assertEqual(query["user_id"], [f"eq.{self.user_id}"])
        self.assertEqual(
            query["select"],
            ["user_id,organization_id,school_id,role,status,access_starts_at,access_ends_at,scope_type,scope_id,can_view_team,can_view_school,can_view_network,can_manage_users,can_manage_products,can_audit,can_access_private_content"],
        )
        self.assertEqual(request.get_header("Authorization"), f"Bearer {self.token}")
        self.assertEqual(request.get_header("Apikey"), "public-anon-key")
        self.assertEqual(result["organization_id"], "org-1")

    @patch.object(membership_repository, "urlopen")
    @patch.object(membership_repository, "SUPABASE_ANON_KEY", "public-anon-key")
    @patch.object(membership_repository, "SUPABASE_URL", "https://example.supabase.co")
    def test_each_request_uses_its_own_bearer_token(self, mocked_urlopen):
        mocked_urlopen.side_effect = [
            self._response([self.membership]),
            self._response([self.membership]),
        ]

        membership_repository.load_active_membership("first-token", self.user_id)
        membership_repository.load_active_membership("second-token", self.user_id)

        first = mocked_urlopen.call_args_list[0].args[0]
        second = mocked_urlopen.call_args_list[1].args[0]
        self.assertEqual(first.get_header("Authorization"), "Bearer first-token")
        self.assertEqual(second.get_header("Authorization"), "Bearer second-token")

    @patch.object(membership_repository, "urlopen")
    @patch.object(membership_repository, "SUPABASE_ANON_KEY", "public-anon-key")
    @patch.object(membership_repository, "SUPABASE_URL", "https://example.supabase.co")
    def test_missing_membership_is_forbidden(self, mocked_urlopen):
        mocked_urlopen.return_value = self._response([])
        with self.assertRaises(HTTPException) as caught:
            membership_repository.load_active_membership(self.token, self.user_id)
        self.assertEqual(caught.exception.status_code, 403)

    @patch.object(membership_repository, "urlopen")
    @patch.object(membership_repository, "SUPABASE_ANON_KEY", "public-anon-key")
    @patch.object(membership_repository, "SUPABASE_URL", "https://example.supabase.co")
    def test_multiple_active_memberships_are_conflict(self, mocked_urlopen):
        second = {**self.membership, "organization_id": "org-2"}
        mocked_urlopen.return_value = self._response([self.membership, second])
        with self.assertRaises(HTTPException) as caught:
            membership_repository.load_active_membership(self.token, self.user_id)
        self.assertEqual(caught.exception.status_code, 409)

    @patch.object(membership_repository, "urlopen", side_effect=OSError("offline"))
    @patch.object(membership_repository, "SUPABASE_ANON_KEY", "public-anon-key")
    @patch.object(membership_repository, "SUPABASE_URL", "https://example.supabase.co")
    def test_provider_failure_is_fail_closed_503(self, mocked_urlopen):
        with self.assertRaises(HTTPException) as caught:
            membership_repository.load_active_membership(self.token, self.user_id)
        self.assertEqual(caught.exception.status_code, 503)

    def test_api_does_not_accept_client_supplied_scope(self):
        import inspect

        parameters = inspect.signature(
            membership_repository.load_active_membership
        ).parameters
        self.assertEqual(set(parameters), {"access_token", "verified_user_id"})


if __name__ == "__main__":
    unittest.main()
