import unittest
from datetime import datetime, timedelta, timezone
from app.core.security.user_access_policy import can_access_user

class UserAccessPolicyTests(unittest.TestCase):
    def test_self_read_requires_auth_provider_link(self):
        target = {"auth_provider_id": "u2", "organization_id": "o1", "school_id": "s1"}
        self.assertTrue(can_access_user(authenticated_user_id="u2", membership=None, target_user=target, action="read"))
        self.assertFalse(can_access_user(authenticated_user_id="u1", membership=None, target_user=target, action="read"))

    def test_manager_requires_explicit_permission_and_exact_scope(self):
        target = {"auth_provider_id": "u2", "organization_id": "o1", "school_id": "s1"}
        member = {"user_id": "u1", "organization_id": "o1", "school_id": "s1", "status": "active", "can_manage_users": True}
        self.assertTrue(can_access_user(authenticated_user_id="u1", membership=member, target_user=target, action="update"))
        self.assertFalse(can_access_user(authenticated_user_id="u1", membership={**member, "can_manage_users": False}, target_user=target, action="update"))
        self.assertFalse(can_access_user(authenticated_user_id="u1", membership={**member, "school_id": "s2"}, target_user=target, action="update"))

    def test_expired_membership_denied(self):
        target = {"auth_provider_id": "u2", "organization_id": "o1", "school_id": "s1"}
        member = {"user_id": "u1", "organization_id": "o1", "school_id": "s1", "status": "active", "can_manage_users": True, "access_ends_at": (datetime.now(timezone.utc) - timedelta(seconds=1)).isoformat()}
        self.assertFalse(can_access_user(authenticated_user_id="u1", membership=member, target_user=target, action="update"))

if __name__ == "__main__":
    unittest.main()
