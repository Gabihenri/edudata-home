"""Request-scoped user directory repository tests."""
import json
import unittest
from unittest.mock import MagicMock, patch
from urllib.parse import parse_qs, urlparse

from fastapi import HTTPException

from app.repositories import user_access_repository as repository


class UserAccessRepositoryTests(unittest.TestCase):
    def setUp(self):
        self.membership = {
            "status": "active",
            "can_manage_users": True,
            "organization_id": "org-1",
            "school_id": "school-1",
        }
        self.token = "user-specific-jwt"

    def _response(self, payload):
        response = MagicMock()
        response.__enter__ = MagicMock(return_value=response)
        response.__exit__ = MagicMock(return_value=False)
        response.read.return_value = json.dumps(payload).encode("utf-8")
        return response

    @patch.object(repository, "urlopen")
    @patch.object(repository, "SUPABASE_ANON_KEY", "anon-key")
    @patch.object(repository, "SUPABASE_URL", "https://example.supabase.co")
    def test_list_uses_user_jwt_and_membership_scope(self, mocked_urlopen):
        mocked_urlopen.return_value = self._response([{"id": "user-1"}])

        result = repository.list_users_for_membership(
            self.token, self.membership, limit=25
        )

        request = mocked_urlopen.call_args.args[0]
        parsed = urlparse(request.full_url)
        query = parse_qs(parsed.query)
        self.assertEqual(parsed.path, "/rest/v1/users")
        self.assertEqual(query["organization_id"], ["eq.org-1"])
        self.assertEqual(query["school_id"], ["eq.school-1"])
        self.assertEqual(query["limit"], ["25"])
        self.assertEqual(request.get_header("Authorization"), f"Bearer {self.token}")
        self.assertEqual(request.get_header("Apikey"), "anon-key")
        self.assertNotIn("*", query["select"][0])
        self.assertEqual(result, [{"id": "user-1"}])

    @patch.object(repository, "urlopen")
    @patch.object(repository, "SUPABASE_ANON_KEY", "anon-key")
    @patch.object(repository, "SUPABASE_URL", "https://example.supabase.co")
    def test_get_user_is_scoped_to_organization_and_school(self, mocked_urlopen):
        mocked_urlopen.return_value = self._response([{"id": "target-user"}])

        result = repository.get_user_for_membership(
            self.token, self.membership, "target-user"
        )

        query = parse_qs(urlparse(mocked_urlopen.call_args.args[0].full_url).query)
        self.assertEqual(query["id"], ["eq.target-user"])
        self.assertEqual(query["organization_id"], ["eq.org-1"])
        self.assertEqual(query["school_id"], ["eq.school-1"])
        self.assertEqual(result["id"], "target-user")

    @patch.object(repository, "urlopen")
    def test_denies_without_explicit_membership_capability(self, mocked_urlopen):
        membership = {**self.membership, "can_manage_users": False}
        with self.assertRaises(HTTPException) as caught:
            repository.list_users_for_membership(self.token, membership)
        self.assertEqual(caught.exception.status_code, 403)
        mocked_urlopen.assert_not_called()

    @patch.object(repository, "urlopen")
    def test_role_name_does_not_replace_membership_capability(self, mocked_urlopen):
        membership = {
            **self.membership,
            "can_manage_users": False,
            "role": "super_admin",
        }
        with self.assertRaises(HTTPException) as caught:
            repository.list_users_for_membership(self.token, membership)
        self.assertEqual(caught.exception.status_code, 403)
        mocked_urlopen.assert_not_called()

    @patch.object(repository, "urlopen", side_effect=OSError("offline"))
    @patch.object(repository, "SUPABASE_ANON_KEY", "anon-key")
    @patch.object(repository, "SUPABASE_URL", "https://example.supabase.co")
    def test_provider_failure_is_503(self, mocked_urlopen):
        with self.assertRaises(HTTPException) as caught:
            repository.list_users_for_membership(self.token, self.membership)
        self.assertEqual(caught.exception.status_code, 503)

    def test_invalid_limit_is_rejected(self):
        with self.assertRaises(HTTPException) as caught:
            repository.list_users_for_membership(
                self.token, self.membership, limit=0
            )
        self.assertEqual(caught.exception.status_code, 422)


if __name__ == "__main__":
    unittest.main()
