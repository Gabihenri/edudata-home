"""Regression tests for the Agenda temporal contract.

Persistence is mocked; these tests never connect to Supabase or mutate data.
Run from backend/: python -m unittest discover -s tests -v
"""
import os
import unittest
from datetime import datetime, timezone, timedelta
from types import SimpleNamespace
from unittest.mock import patch

# The service module constructs a Supabase client at import time. Supply
# syntactically valid test-only values; no network request is made by these tests.
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-only-key")

from app.core.exceptions.exceptions import ValidationException
from app.repositories.agenda_repository import AgendaRepository
from app.services.agenda_service import AgendaService


class AgendaTemporalContractTests(unittest.TestCase):
    def valid_payload(self, **overrides):
        payload = {
            "school_id": "school-a",
            "organization_id": "org-a",
            "user_id": "user-a",
            "title": "Planejamento",
            "event_type": "planning",
            "start_datetime": "2026-10-13T10:00:00-03:00",
            "end_datetime": "2026-10-13T11:00:00-03:00",
        }
        payload.update(overrides)
        return payload

    def test_legacy_temporal_aliases_are_normalized_without_mutating_input(self):
        payload = self.valid_payload()
        normalized = AgendaService._normalize_temporal_fields(payload)

        self.assertEqual(normalized["start_at"], payload["start_datetime"])
        self.assertEqual(normalized["end_at"], payload["end_datetime"])
        self.assertNotIn("start_datetime", normalized)
        self.assertNotIn("end_datetime", normalized)
        self.assertIn("start_datetime", payload)

    def test_database_field_wins_when_legacy_alias_is_also_present(self):
        normalized = AgendaService._normalize_temporal_fields({
            "start_datetime": "2026-10-13T10:00:00Z",
            "start_at": "2026-10-13T11:00:00Z",
        })
        self.assertEqual(normalized["start_at"], "2026-10-13T11:00:00Z")
        self.assertNotIn("start_datetime", normalized)

    def test_create_accepts_legacy_aliases_and_persists_database_contract(self):
        payload = self.valid_payload()
        with patch.object(AgendaService.repository, "create", return_value={"id": "event-1"}) as create:
            result = AgendaService.create(payload)

        self.assertEqual(result, {"id": "event-1"})
        stored = create.call_args.args[0]
        self.assertIn("start_at", stored)
        self.assertIn("end_at", stored)
        self.assertNotIn("start_datetime", stored)
        self.assertNotIn("end_datetime", stored)

    def test_update_accepts_legacy_aliases_and_persists_database_contract(self):
        with patch.object(AgendaService.repository, "update", return_value={"id": "event-1"}) as update:
            AgendaService.update("event-1", {
                "start_datetime": "2026-10-13T10:00:00Z",
                "end_datetime": "2026-10-13T11:00:00Z",
            })

        self.assertEqual(update.call_args.args[0], "event-1")
        self.assertEqual(update.call_args.args[1], {
            "start_at": "2026-10-13T10:00:00Z",
            "end_at": "2026-10-13T11:00:00Z",
        })

    def test_create_rejects_end_before_start_even_when_iso_strings_sort_later(self):
        payload = self.valid_payload(
            start_datetime="2026-10-13T10:00:00-03:00",  # 13:00 UTC
            end_datetime="2026-10-13T12:30:00+00:00",   # 12:30 UTC
        )
        with self.assertRaises(ValidationException):
            AgendaService.validate_create(payload)

    def test_create_accepts_z_suffix_and_offset_aware_values(self):
        payload = self.valid_payload(
            start_datetime="2026-10-13T13:00:00Z",
            end_datetime="2026-10-13T10:30:00-03:00",
        )
        AgendaService.validate_create(payload)

    def test_create_rejects_invalid_datetime(self):
        with self.assertRaises(ValidationException):
            AgendaService.validate_create(self.valid_payload(
                start_datetime="not-a-datetime",
            ))

    def test_update_validates_interval_when_both_bounds_are_supplied(self):
        with self.assertRaises(ValidationException):
            AgendaService.validate_update({
                "start_at": "2026-10-13T10:00:00Z",
                "end_at": "2026-10-13T09:00:00Z",
            })

    def test_update_allows_partial_temporal_payload(self):
        AgendaService.validate_update({"start_at": "2026-10-13T10:00:00Z"})

    def test_period_query_accepts_mixed_naive_and_aware_bounds(self):
        start = datetime(2026, 10, 13, 10, 0)
        end = datetime(2026, 10, 13, 14, 0, tzinfo=timezone.utc)
        with patch.object(AgendaService.repository, "events_between", return_value=[]) as query:
            self.assertEqual(AgendaService.events_between("school-a", start, end), [])

        self.assertEqual(query.call_args.kwargs["school_id"], "school-a")
        self.assertIsNotNone(query.call_args.kwargs["start"].tzinfo)
        self.assertIsNotNone(query.call_args.kwargs["end"].tzinfo)

    def test_period_query_rejects_reversed_instants_across_offsets(self):
        start = datetime.fromisoformat("2026-10-13T10:00:00-03:00")
        end = datetime.fromisoformat("2026-10-13T12:30:00+00:00")
        with self.assertRaises(ValidationException):
            AgendaService.events_between("school-a", start, end)

    def test_dashboard_summary_uses_start_at_and_ignores_invalid_dates(self):
        events = [
            {"status": "planned", "start_at": "2999-01-01T00:00:00Z"},
            {"status": "completed", "start_at": "2000-01-01T00:00:00Z"},
            {"status": "cancelled", "start_at": "not-a-date"},
            {"status": "planned", "start_datetime": "2999-01-01T00:00:00Z"},
            {"status": "planned"},
        ]
        with patch.object(AgendaService.repository, "list", return_value=events):
            summary = AgendaService.dashboard_summary()

        self.assertEqual(summary, {
            "total_events": 5,
            "planned": 3,
            "completed": 1,
            "cancelled": 1,
            "upcoming": 1,
        })

    def test_naive_datetime_is_interpreted_in_server_local_timezone(self):
        parsed = AgendaService._parse_datetime("2026-10-13T10:00:00", "start_at")
        self.assertIsNotNone(parsed.tzinfo)
        self.assertEqual(parsed.utcoffset(), datetime.now().astimezone().utcoffset())


class AgendaRepositoryTemporalContractTests(unittest.TestCase):
    def setUp(self):
        self.query = unittest.mock.Mock()
        self.query.select.return_value = self.query
        self.query.eq.return_value = self.query
        self.query.gte.return_value = self.query
        self.query.lte.return_value = self.query
        self.query.order.return_value = self.query
        self.query.limit.return_value = self.query
        self.query.execute.return_value = SimpleNamespace(data=[])

        self.table_patch = patch(
            "app.repositories.agenda_repository.supabase.table",
            return_value=self.query,
        )
        self.table_patch.start()
        self.addCleanup(self.table_patch.stop)

    def test_school_listing_orders_by_start_at(self):
        AgendaRepository.list_by_school("school-a")
        self.query.order.assert_called_once_with("start_at")

    def test_teacher_listing_orders_by_start_at(self):
        AgendaRepository.list_by_teacher("teacher-a")
        self.query.order.assert_called_once_with("start_at")

    def test_period_listing_filters_and_orders_by_database_temporal_fields(self):
        start = datetime(2026, 10, 13, 10, tzinfo=timezone.utc)
        end = datetime(2026, 10, 13, 11, tzinfo=timezone(timedelta(hours=-3)))
        AgendaRepository.events_between("school-a", start, end)

        self.query.gte.assert_called_once_with("start_at", start.isoformat())
        self.query.lte.assert_called_once_with("end_at", end.isoformat())
        self.query.order.assert_called_once_with("start_at")

    def test_upcoming_listing_filters_and_orders_by_start_at(self):
        AgendaRepository.upcoming_events("school-a")
        self.query.gte.assert_called_once()
        self.assertEqual(self.query.gte.call_args.args[0], "start_at")
        self.query.order.assert_called_once_with("start_at")


if __name__ == "__main__":
    unittest.main()
