"""Tests for validating official Supabase Auth bearer tokens."""
import os
import unittest
from types import SimpleNamespace
from unittest.mock import patch

os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-only-key")

from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.core.security.supabase_user import get_supabase_user


class SupabaseUserDependencyTests(unittest.TestCase):
    def credentials(self, token="supabase-test-token"):
        return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    def test_missing_credentials_returns_401(self):
        with self.assertRaises(HTTPException) as raised:
            get_supabase_user(credentials=None)

        self.assertEqual(raised.exception.status_code, 401)
        self.assertEqual(raised.exception.headers.get("WWW-Authenticate"), "Bearer")

    def test_missing_supabase_configuration_returns_503(self):
        with patch("app.core.config.SUPABASE_URL", None), patch(
            "app.core.config.SUPABASE_KEY", None
        ):
            with self.assertRaises(HTTPException) as raised:
                get_supabase_user(credentials=self.credentials())

        self.assertEqual(raised.exception.status_code, 503)

    def test_valid_supabase_user_returns_canonical_identity(self):
        user = SimpleNamespace(
            id="supabase-user-123",
            email="teacher@example.test",
            user_metadata={"display_name": "Teacher"},
            app_metadata={"provider": "email"},
        )
        client = SimpleNamespace(
            auth=SimpleNamespace(get_user=lambda token: SimpleNamespace(user=user))
        )
        with patch("supabase.create_client", return_value=client) as create_client:
            result = get_supabase_user(credentials=self.credentials())

        create_client.assert_called_once_with(
            "https://example.supabase.co", "test-only-key"
        )
        self.assertEqual(result["id"], "supabase-user-123")
        self.assertEqual(result["email"], "teacher@example.test")
        self.assertEqual(result["auth_provider"], "supabase")
        self.assertNotIn("organization_id", result)
        self.assertNotIn("school_id", result)
        self.assertNotIn("role", result)

    def test_rejected_token_returns_401(self):
        error = RuntimeError("invalid token")
        error.status = 401
        client = SimpleNamespace(
            auth=SimpleNamespace(
                get_user=unittest.mock.Mock(side_effect=error)
            )
        )
        with patch("supabase.create_client", return_value=client):
            with self.assertRaises(HTTPException) as raised:
                get_supabase_user(credentials=self.credentials())

        self.assertEqual(raised.exception.status_code, 401)
        self.assertEqual(raised.exception.headers.get("WWW-Authenticate"), "Bearer")

    def test_provider_failure_returns_503_without_exposing_error(self):
        client = SimpleNamespace(
            auth=SimpleNamespace(
                get_user=unittest.mock.Mock(
                    side_effect=RuntimeError("internal provider details")
                )
            )
        )
        with patch("supabase.create_client", return_value=client):
            with self.assertRaises(HTTPException) as raised:
                get_supabase_user(credentials=self.credentials())

        self.assertEqual(raised.exception.status_code, 503)
        self.assertNotIn("internal provider details", raised.exception.detail)


if __name__ == "__main__":
    unittest.main()
