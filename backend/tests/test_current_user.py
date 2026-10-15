"""Unit tests for API CurrentUser token validation.

The JWT decoder is mocked so these tests never require a real token or network
access. Run from backend/: python -m unittest discover -s tests -v
"""
import os
import unittest
from unittest.mock import patch

# Some security imports transitively load the application configuration/client.
# These are test-only values; no network request is made by this test module.
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-only-key")

from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.core.security.current_user import CurrentUser


class CurrentUserTokenValidationTests(unittest.TestCase):
    def credentials(self, token="test-token"):
        return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    def assert_unauthorized(self, credentials, payload=None):
        with patch(
            "app.core.security.current_user.JWTService.decode_token",
            return_value=payload or {},
        ):
            with self.assertRaises(HTTPException) as raised:
                CurrentUser.get(credentials=credentials)

        self.assertEqual(raised.exception.status_code, 401)
        self.assertEqual(
            raised.exception.headers.get("WWW-Authenticate"),
            "Bearer",
        )

    def test_missing_credentials_returns_401(self):
        self.assert_unauthorized(None)

    def test_missing_subject_returns_401(self):
        self.assert_unauthorized(self.credentials(), {"type": "access"})

    def test_blank_subject_returns_401(self):
        self.assert_unauthorized(
            self.credentials(),
            {"sub": "   ", "type": "access"},
        )

    def test_non_string_subject_returns_401(self):
        self.assert_unauthorized(
            self.credentials(),
            {"sub": 123, "type": "access"},
        )

    def test_missing_or_invalid_token_type_returns_401(self):
        for token_type in (None, "refresh", "invalid"):
            with self.subTest(token_type=token_type):
                payload = {"sub": "user-1"}
                if token_type is not None:
                    payload["type"] = token_type
                self.assert_unauthorized(self.credentials(), payload)

    def test_valid_access_token_returns_identity_and_claims(self):
        payload = {
            "sub": "user-1",
            "type": "access",
            "organization_id": "org-1",
            "school_id": "school-1",
            "role": "teacher",
            "email": "teacher@example.test",
        }
        with patch(
            "app.core.security.current_user.JWTService.decode_token",
            return_value=payload,
        ) as decode:
            result = CurrentUser.get(credentials=self.credentials())

        decode.assert_called_once_with("test-token")
        self.assertEqual(result["id"], "user-1")
        self.assertEqual(result["organization_id"], "org-1")
        self.assertEqual(result["school_id"], "school-1")
        self.assertEqual(result["role"], "teacher")
        self.assertEqual(result["email"], "teacher@example.test")
        self.assertIs(result["payload"], payload)


if __name__ == "__main__":
    unittest.main()
