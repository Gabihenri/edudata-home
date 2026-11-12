"""Tests for Supabase-backed API identity validation."""
from types import SimpleNamespace
import unittest
from unittest.mock import patch

from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.core.security.current_user import CurrentUser


class CurrentUserSupabaseAuthTests(unittest.TestCase):
    def credentials(self, token="test-access-token"):
        return HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials=token,
        )

    def test_missing_token_is_rejected_without_calling_supabase(self):
        with patch(
            "app.core.security.current_user.supabase.auth.get_user"
        ) as get_user:
            with self.assertRaises(HTTPException) as caught:
                CurrentUser.get(credentials=None)

        self.assertEqual(caught.exception.status_code, 401)
        get_user.assert_not_called()

    def test_supabase_rejection_becomes_401(self):
        error = RuntimeError("provider rejected token")
        error.status = 401

        with patch(
            "app.core.security.current_user.supabase.auth.get_user",
            side_effect=error,
        ):
            with self.assertRaises(HTTPException) as caught:
                CurrentUser.get(credentials=self.credentials("bad-token"))

        self.assertEqual(caught.exception.status_code, 401)
        self.assertEqual(caught.exception.detail, "Token inválido ou expirado.")

    def test_auth_provider_outage_fails_closed_as_503(self):
        with patch(
            "app.core.security.current_user.supabase.auth.get_user",
            side_effect=RuntimeError("network unavailable"),
        ):
            with self.assertRaises(HTTPException) as caught:
                CurrentUser.get(credentials=self.credentials())

        self.assertEqual(caught.exception.status_code, 503)

    def test_valid_supabase_user_returns_verified_identity_without_scope_claims(self):
        auth_user = SimpleNamespace(
            id="auth-user-123",
            email="teacher@example.test",
            user_metadata={"role": "admin", "organization_id": "untrusted-org"},
        )
        response = SimpleNamespace(user=auth_user)

        with patch(
            "app.core.security.current_user.supabase.auth.get_user",
            return_value=response,
        ) as get_user:
            identity = CurrentUser.get(
                credentials=self.credentials("valid-supabase-token")
            )

        get_user.assert_called_once_with("valid-supabase-token")
        self.assertEqual(identity["id"], "auth-user-123")
        self.assertEqual(identity["email"], "teacher@example.test")
        self.assertIsNone(identity["organization_id"])
        self.assertIsNone(identity["school_id"])
        self.assertIsNone(identity["role"])
        self.assertEqual(identity["payload"]["sub"], "auth-user-123")

    def test_response_without_user_identity_is_rejected(self):
        with patch(
            "app.core.security.current_user.supabase.auth.get_user",
            return_value=SimpleNamespace(user=None),
        ):
            with self.assertRaises(HTTPException) as caught:
                CurrentUser.get(credentials=self.credentials())

        self.assertEqual(caught.exception.status_code, 401)


if __name__ == "__main__":
    unittest.main()
