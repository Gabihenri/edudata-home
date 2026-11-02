"""Contract tests for resolving an active institutional membership.

The resolver must use the verified Auth user id, never caller-supplied scope
claims, and must fail closed for absent, inactive, future, expired or ambiguous
memberships.
"""
from datetime import datetime, timezone
import unittest

from fastapi import HTTPException

from app.core.security.membership_resolver import resolve_active_membership


class MembershipResolverTests(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026, 10, 30, 12, 0, tzinfo=timezone.utc)
        self.user_id = "verified-user-123"
        self.membership = {
            "id": "membership-1",
            "user_id": self.user_id,
            "organization_id": "org-1",
            "school_id": "school-1",
            "role": "teacher",
            "status": "active",
            "access_starts_at": None,
            "access_ends_at": None,
            "can_view_school": False,
            "can_manage_users": False,
        }

    def test_resolves_active_membership_for_verified_identity(self):
        result = resolve_active_membership(
            user_id=self.user_id,
            memberships=[self.membership],
            now=self.now,
        )
        self.assertEqual(result["organization_id"], "org-1")
        self.assertEqual(result["school_id"], "school-1")
        self.assertEqual(result["role"], "teacher")

    def test_rejects_membership_owned_by_another_user(self):
        row = {**self.membership, "user_id": "attacker-user"}
        with self.assertRaises(HTTPException) as caught:
            resolve_active_membership(self.user_id, [row], now=self.now)
        self.assertEqual(caught.exception.status_code, 403)

    def test_rejects_revoked_membership(self):
        row = {**self.membership, "status": "revoked"}
        with self.assertRaises(HTTPException) as caught:
            resolve_active_membership(self.user_id, [row], now=self.now)
        self.assertEqual(caught.exception.status_code, 403)

    def test_rejects_membership_that_starts_in_the_future(self):
        row = {
            **self.membership,
            "access_starts_at": "2026-10-30T12:00:01+00:00",
        }
        with self.assertRaises(HTTPException) as caught:
            resolve_active_membership(self.user_id, [row], now=self.now)
        self.assertEqual(caught.exception.status_code, 403)

    def test_expiry_is_exclusive(self):
        row = {
            **self.membership,
            "access_ends_at": "2026-10-30T12:00:00+00:00",
        }
        with self.assertRaises(HTTPException) as caught:
            resolve_active_membership(self.user_id, [row], now=self.now)
        self.assertEqual(caught.exception.status_code, 403)

    def test_rejects_ambiguous_multiple_active_memberships(self):
        second = {
            **self.membership,
            "id": "membership-2",
            "organization_id": "org-2",
            "school_id": "school-2",
        }
        with self.assertRaises(HTTPException) as caught:
            resolve_active_membership(
                self.user_id,
                [self.membership, second],
                now=self.now,
            )
        self.assertEqual(caught.exception.status_code, 409)

    def test_rejects_empty_membership_result(self):
        with self.assertRaises(HTTPException) as caught:
            resolve_active_membership(self.user_id, [], now=self.now)
        self.assertEqual(caught.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
