"""Tests for the verified-identity membership dependency."""
import unittest
from unittest.mock import patch

from fastapi.security import HTTPAuthorizationCredentials

from app.core.security import current_membership


class CurrentMembershipDependencyTests(unittest.TestCase):
    def test_uses_verified_user_id_and_request_bearer_token(self):
        credentials = HTTPAuthorizationCredentials(
            scheme="Bearer",
            credentials="request-scoped-jwt",
        )
        verified_user = {
            "id": "verified-user-id",
            "organization_id": None,
            "school_id": None,
            "role": None,
            "payload": {
                "sub": "verified-user-id",
                "organization_id": "untrusted-org",
                "role": "admin",
            },
        }
        expected = {
            "user_id": "verified-user-id",
            "organization_id": "database-org",
            "school_id": "database-school",
            "role": "teacher",
            "status": "active",
        }

        with patch.object(
            current_membership,
            "load_active_membership",
            return_value=expected,
        ) as load_membership:
            result = current_membership.get_current_membership(
                credentials=credentials,
                current_user=verified_user,
            )

        self.assertEqual(result, expected)
        load_membership.assert_called_once_with(
            access_token="request-scoped-jwt",
            verified_user_id="verified-user-id",
        )

    def test_dependency_has_no_client_supplied_scope_parameters(self):
        import inspect

        parameters = inspect.signature(
            current_membership.get_current_membership
        ).parameters
        self.assertEqual(set(parameters), {"credentials", "current_user"})


if __name__ == "__main__":
    unittest.main()
