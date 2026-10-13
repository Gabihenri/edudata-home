from __future__ import annotations

import os
import unittest
from datetime import datetime, timezone
from unittest.mock import patch

# Keep repository tests independent from real credentials and network access.
os.environ.setdefault("SUPABASE_URL", "https://example.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-key")

from app.repositories.agenda_repository import AgendaRepository  # noqa: E402


class FakeQuery:
    def __init__(self, data: list[dict] | None = None) -> None:
        self.data = data or []
        self.calls: list[tuple] = []

    def select(self, value: str) -> "FakeQuery":
        self.calls.append(("select", value))
        return self

    def eq(self, column: str, value: str) -> "FakeQuery":
        self.calls.append(("eq", column, value))
        return self

    def gte(self, column: str, value: str) -> "FakeQuery":
        self.calls.append(("gte", column, value))
        return self

    def lte(self, column: str, value: str) -> "FakeQuery":
        self.calls.append(("lte", column, value))
        return self

    def order(self, column: str) -> "FakeQuery":
        self.calls.append(("order", column))
        return self

    def limit(self, value: int) -> "FakeQuery":
        self.calls.append(("limit", value))
        return self

    def execute(self):
        return type("Response", (), {"data": self.data})()


class FakeSupabase:
    def __init__(self, query: FakeQuery) -> None:
        self.query = query
        self.table_names: list[str] = []

    def table(self, name: str) -> FakeQuery:
        self.table_names.append(name)
        return self.query


class AgendaRepositoryTimestampContractTests(unittest.TestCase):
    def setUp(self) -> None:
        self.query = FakeQuery([{"id": "event-1"}])
        self.client = FakeSupabase(self.query)
        self.supabase_patch = patch(
            "app.repositories.agenda_repository.supabase",
            self.client,
        )
        self.supabase_patch.start()
        self.addCleanup(self.supabase_patch.stop)

    def assertUsesStartAtOrdering(self) -> None:
        self.assertIn(("order", "start_at"), self.query.calls)
        self.assertNotIn(("order", "start_datetime"), self.query.calls)

    def test_list_by_school_uses_remote_timestamp_column(self) -> None:
        result = AgendaRepository.list_by_school("school-1", limit=7)

        self.assertEqual(result, [{"id": "event-1"}])
        self.assertIn(("eq", "school_id", "school-1"), self.query.calls)
        self.assertIn(("limit", 7), self.query.calls)
        self.assertUsesStartAtOrdering()

    def test_list_by_teacher_filters_user_and_orders_by_start_at(self) -> None:
        result = AgendaRepository.list_by_teacher("user-1", limit=8)

        self.assertEqual(result, [{"id": "event-1"}])
        self.assertIn(("eq", "user_id", "user-1"), self.query.calls)
        self.assertIn(("limit", 8), self.query.calls)
        self.assertUsesStartAtOrdering()

    def test_events_between_uses_start_at_and_end_at(self) -> None:
        start = datetime(2026, 10, 1, tzinfo=timezone.utc)
        end = datetime(2026, 10, 31, tzinfo=timezone.utc)

        result = AgendaRepository.events_between("school-1", start, end)

        self.assertEqual(result, [{"id": "event-1"}])
        self.assertIn(("gte", "start_at", start.isoformat()), self.query.calls)
        self.assertIn(("lte", "end_at", end.isoformat()), self.query.calls)
        self.assertUsesStartAtOrdering()

    def test_upcoming_events_filters_and_orders_by_start_at(self) -> None:
        with patch(
            "app.repositories.agenda_repository.datetime"
        ) as mocked_datetime:
            mocked_datetime.now.return_value = datetime(
                2026, 10, 13, tzinfo=timezone.utc
            )
            result = AgendaRepository.upcoming_events("school-1", limit=5)

        self.assertEqual(result, [{"id": "event-1"}])
        self.assertIn(("eq", "school_id", "school-1"), self.query.calls)
        self.assertIn(
            ("gte", "start_at", datetime(2026, 10, 13, tzinfo=timezone.utc).isoformat()),
            self.query.calls,
        )
        self.assertIn(("limit", 5), self.query.calls)
        self.assertUsesStartAtOrdering()


if __name__ == "__main__":
    unittest.main()
