"""Membership capability authorization tests."""
import unittest

from app.core.permissions.permissions import Permission


class MembershipPermissionTests(unittest.TestCase):
    def test_active_membership_with_capability_can_manage_users(self):
        membership = {
            "status": "active",
            "can_manage_users": True,
            "role": "teacher",
        }
        self.assertTrue(Permission.membership_can_manage_users(membership))

    def test_role_name_alone_does_not_grant_user_management(self):
        membership = {
            "status": "active",
            "can_manage_users": False,
            "role": "super_admin",
        }
        self.assertFalse(Permission.membership_can_manage_users(membership))

    def test_inactive_membership_is_denied_even_with_capability(self):
        membership = {
            "status": "inactive",
            "can_manage_users": True,
            "role": "institution_admin",
        }
        self.assertFalse(Permission.membership_can_manage_users(membership))

    def test_missing_or_malformed_membership_is_denied(self):
        self.assertFalse(Permission.membership_can_manage_users(None))
        self.assertFalse(Permission.membership_can_manage_users({}))
        self.assertFalse(
            Permission.membership_can_manage_users(
                {"status": "active", "can_manage_users": 1}
            )
        )


if __name__ == "__main__":
    unittest.main()
