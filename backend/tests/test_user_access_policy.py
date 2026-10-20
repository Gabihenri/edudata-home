import unittest
from datetime import datetime, timedelta, timezone

from app.core.security.user_access_policy import can_access_user


class UserAccessPolicyTests(unittest.TestCase):
    def setUp(self):
        self.target = {
            "auth_provider_id": "u2",
            "organization_id": "o1",
            "school_id": "s1",
        }
        self.member = {
            "user_id": "u1",
            "organization_id": "o1",
            "school_id": "s1",
            "status": "active",
            "can_manage_users": True,
        }

    def test_self_read_requires_auth_provider_link(self):
        self.assertTrue(can_access_user(
            authenticated_user_id="u2", membership=None,
            target_user=self.target, action="read"))
        self.assertFalse(can_access_user(
            authenticated_user_id="u1", membership=None,
            target_user=self.target, action="read"))

    def test_manager_requires_explicit_permission_and_exact_scope(self):
        self.assertTrue(can_access_user(
            authenticated_user_id="u1", membership=self.member,
            target_user=self.target, action="update"))
        self.assertFalse(can_access_user(
            authenticated_user_id="u1",
            membership={**self.member, "can_manage_users": False},
            target_user=self.target, action="update"))
        self.assertFalse(can_access_user(
            authenticated_user_id="u1",
            membership={**self.member, "school_id": "s2"},
            target_user=self.target, action="update"))

    def test_management_denied_when_target_school_is_missing(self):
        target = {**self.target, "school_id": None}
        self.assertFalse(can_access_user(
            authenticated_user_id="u1", membership=self.member,
            target_user=target, action="update"))

    def test_management_denied_when_membership_school_is_missing(self):
        member = {**self.member, "school_id": None}
        self.assertFalse(can_access_user(
            authenticated_user_id="u1", membership=member,
            target_user=self.target, action="update"))

    def test_expired_membership_denied(self):
        member = {
            **self.member,
            "access_ends_at": (
                datetime.now(timezone.utc) - timedelta(seconds=1)
            ).isoformat(),
        }
        self.assertFalse(can_access_user(
            authenticated_user_id="u1", membership=member,
            target_user=self.target, action="update"))

    def test_future_membership_denied(self):
        member = {
            **self.member,
            "access_starts_at": (
                datetime.now(timezone.utc) + timedelta(hours=1)
            ).isoformat(),
        }
        self.assertFalse(can_access_user(
            authenticated_user_id="u1", membership=member,
            target_user=self.target, action="update"))


if __name__ == "__main__":
    unittest.main()
