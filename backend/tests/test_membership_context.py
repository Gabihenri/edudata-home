"""Unit tests for fail-closed membership context selection."""
import unittest
from datetime import datetime, timezone

from app.core.security.membership_context import (
    MembershipContextError,
    select_membership_context,
)


NOW = datetime(2026, 10, 14, 12, 0, tzinfo=timezone.utc)


def membership(**overrides):
    row = {
        "id": "membership-1",
        "user_id": "user-1",
        "organization_id": "org-1",
        "school_id": "school-1",
        "role": "teacher",
        "status": "active",
        "access_starts_at": None,
        "access_ends_at": None,
        "scope_type": "self",
    }
    row.update(overrides)
    return row


class MembershipContextSelectionTests(unittest.TestCase):
    def select(self, rows, **kwargs):
        return select_membership_context(
            rows,
            user_id=kwargs.pop("user_id", "user-1"),
            organization_id=kwargs.pop("organization_id", "org-1"),
            now=NOW,
            **kwargs,
        )

    def assert_code(self, code, rows, **kwargs):
        with self.assertRaises(MembershipContextError) as raised:
            self.select(rows, **kwargs)
        self.assertEqual(raised.exception.code, code)

    def test_selects_one_active_exact_context(self):
        row = membership()
        result = self.select([row], school_id="school-1")
        self.assertEqual(result["id"], "membership-1")

    def test_does_not_accept_another_users_membership(self):
        self.assert_code("MEMBERSHIP_NOT_FOUND", [membership(user_id="user-2")])

    def test_does_not_accept_another_organization(self):
        self.assert_code(
            "MEMBERSHIP_NOT_FOUND",
            [membership(organization_id="org-2")],
        )

    def test_rejects_wrong_school_scope(self):
        self.assert_code(
            "SCOPE_MISMATCH",
            [membership(school_id="school-2")],
            school_id="school-1",
        )

    def test_rejects_inactive_membership(self):
        self.assert_code(
            "MEMBERSHIP_INACTIVE",
            [membership(status="revoked")],
            school_id="school-1",
        )

    def test_rejects_future_membership(self):
        self.assert_code(
            "MEMBERSHIP_INACTIVE",
            [membership(access_starts_at="2026-10-15T00:00:00Z")],
            school_id="school-1",
        )

    def test_rejects_expired_membership(self):
        self.assert_code(
            "MEMBERSHIP_INACTIVE",
            [membership(access_ends_at="2026-10-14T12:00:00Z")],
            school_id="school-1",
        )

    def test_rejects_naive_or_invalid_access_timestamp(self):
        for value in ("2026-10-14T11:00:00", "not-a-date"):
            with self.subTest(value=value):
                self.assert_code(
                    "MEMBERSHIP_INACTIVE",
                    [membership(access_starts_at=value)],
                    school_id="school-1",
                )

    def test_requires_explicit_school_when_memberships_are_ambiguous(self):
        rows = [
            membership(id="membership-1", school_id="school-1"),
            membership(id="membership-2", school_id="school-2"),
        ]
        self.assert_code("AMBIGUOUS_MEMBERSHIP", rows)

    def test_never_picks_highest_role_or_hierarchy_implicitly(self):
        rows = [
            membership(id="teacher", role="teacher", hierarchy_level=10),
            membership(id="director", role="director", hierarchy_level=1),
        ]
        self.assert_code("AMBIGUOUS_MEMBERSHIP", rows, school_id="school-1")

    def test_requires_canonical_user_and_organization_context(self):
        self.assert_code("IDENTITY_NOT_HOMOLOGATED", [membership()], user_id="")
        self.assert_code("SCOPE_MISMATCH", [membership()], organization_id="")

    def test_does_not_treat_role_as_permission(self):
        row = membership(role="director", can_view_network=True)
        result = self.select([row], school_id="school-1")
        self.assertEqual(result["role"], "director")
        # Selection returns context only; it makes no allow/deny decision for
        # any resource operation based on role or permission flags.


if __name__ == "__main__":
    unittest.main()
