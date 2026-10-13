from __future__ import annotations

import os
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-key")

from app.services.agenda_service import AgendaService  # noqa: E402


class AgendaServiceTimestampContractTests(unittest.TestCase):
    def test_create_translates_legacy_timestamp_keys_to_schema_keys(self) -> None:
        payload = {
            "school_id": "00000000-0000-0000-0000-000000000001",
            "organization_id": "00000000-0000-0000-0000-000000000002",
            "user_id": "00000000-0000-0000-0000-000000000003",
            "title": "Reunião pedagógica",
            "event_type": "pedagogico",
            "start_datetime": "2026-10-14T14:00:00-03:00",
            "end_datetime": "2026-10-14T15:00:00-03:00",
        }
        expected = {
            "school_id": payload["school_id"],
            "organization_id": payload["organization_id"],
            "user_id": payload["user_id"],
            "title": payload["title"],
            "event_type": payload["event_type"],
            "start_at": payload["start_datetime"],
            "end_at": payload["end_datetime"],
        }

        with patch.object(
            AgendaService.repository,
            "create",
            return_value={"id": "event-1", **expected},
        ) as create:
            result = AgendaService.create(payload)

        self.assertEqual(result["id"], "event-1")
        create.assert_called_once_with(expected)

    def test_update_translates_timestamp_keys_to_schema_keys(self) -> None:
        payload = {
            "start_datetime": "2026-10-14T14:00:00-03:00",
            "end_datetime": "2026-10-14T15:00:00-03:00",
        }
        expected = {
            "start_at": payload["start_datetime"],
            "end_at": payload["end_datetime"],
        }

        with patch.object(
            AgendaService.repository,
            "update",
            return_value={"id": "event-1", **expected},
        ) as update:
            result = AgendaService.update("event-1", payload)

        self.assertEqual(result["id"], "event-1")
        update.assert_called_once_with("event-1", expected)

    def test_update_rejects_end_not_after_start(self) -> None:
        start = datetime(2026, 10, 14, 17, 0, tzinfo=timezone.utc)
        end = start - timedelta(minutes=1)

        with self.assertRaises(Exception):
            AgendaService.validate_update({
                "start_datetime": start.isoformat(),
                "end_datetime": end.isoformat(),
            })

    def test_dashboard_summary_reads_remote_start_at_field(self) -> None:
        future = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
        records = [
            {"id": "event-1", "status": "planned", "start_at": future},
            {"id": "event-2", "status": "completed", "start_at": "2020-01-01T00:00:00+00:00"},
        ]

        with patch.object(
            AgendaService.repository,
            "list",
            return_value=records,
        ):
            summary = AgendaService.dashboard_summary()

        self.assertEqual(summary["total_events"], 2)
        self.assertEqual(summary["planned"], 1)
        self.assertEqual(summary["completed"], 1)
        self.assertEqual(summary["upcoming"], 1)


if __name__ == "__main__":
    unittest.main()
