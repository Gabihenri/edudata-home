"""Unit tests for the fail-closed Agenda EDI access policy."""
import unittest

from app.core.security.agenda_access_policy import can_access_agenda_event


def membership(**overrides):
    row = {
        "user_id": "user-1",
        "organization_id": "org-1",
        "school_id": "school-1",
        "role": "teacher",
        "status": "active",
        "can_view_school": False,
        "can_view_team": False,
        "can_view_network": False,
    }
    row.update(overrides)
    return row


def event(**overrides):
    row = {
        "id": "event-1",
        "user_id": "user-1",
        "organization_id": "org-1",
        "school_id": "school-1",
    }
    row.update(overrides)
    return row


class AgendaAccessPolicyTests(unittest.TestCase):
    def allowed(self, *, user_id="user-1", member=None, record=None, action="read"):
        return can_access_agenda_event(
            user_id=user_id,
            membership=member or membership(),
            event=record or event(),
            action=action,
        )

    def test_owner_can_read_own_event_in_context(self):
        self.assertTrue(self.allowed())

    def test_teacher_cannot_read_peer_event_by_changing_event_id(self):
        self.assertFalse(self.allowed(record=event(user_id="user-2")))

    def test_explicit_school_read_permission_allows_same_school_peer_event(self):
        self.assertTrue(
            self.allowed(
                member=membership(can_view_school=True),
                record=event(user_id="user-2"),
            )
        )

    def test_school_read_permission_does_not_cross_school(self):
        self.assertFalse(
            self.allowed(
                member=membership(can_view_school=True),
                record=event(user_id="user-2", school_id="school-2"),
            )
        )

    def test_organization_mismatch_is_denied(self):
        self.assertFalse(self.allowed(record=event(organization_id="org-2")))

    def test_inactive_membership_is_denied(self):
        self.assertFalse(self.allowed(member=membership(status="revoked")))

    def test_role_name_alone_does_not_grant_school_read(self):
        self.assertFalse(
            self.allowed(
                member=membership(role="director"),
                record=event(user_id="user-2"),
            )
        )

    def test_team_and_network_flags_alone_do_not_grant_peer_read(self):
        self.assertFalse(
            self.allowed(
                member=membership(can_view_team=True, can_view_network=True),
                record=event(user_id="user-2"),
            )
        )

    def test_owner_can_update_own_event_in_exact_school(self):
        self.assertTrue(self.allowed(action="update"))

    def test_non_owner_cannot_update_peer_event_even_with_school_read(self):
        self.assertFalse(
            self.allowed(
                member=membership(can_view_school=True),
                record=event(user_id="user-2"),
                action="update",
            )
        )

    def test_network_membership_without_school_cannot_write_school_event(self):
        self.assertFalse(
            self.allowed(
                member=membership(school_id=None),
                action="create",
            )
        )

    def test_school_mismatch_is_denied_even_for_owner(self):
        self.assertFalse(
            self.allowed(record=event(school_id="school-2"), action="read")
        )

    def test_unknown_action_is_denied(self):
        self.assertFalse(self.allowed(action="export_all"))

    def test_missing_identity_or_scope_is_denied(self):
        self.assertFalse(self.allowed(user_id=""))
        self.assertFalse(
            self.allowed(member=membership(organization_id=""))
        )

    def test_unknown_or_incomplete_record_is_denied(self):
        self.assertFalse(self.allowed(record={"user_id": "user-1"}))


if __name__ == "__main__":
    unittest.main()
