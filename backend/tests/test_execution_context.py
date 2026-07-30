from __future__ import annotations

import re
import unittest
from datetime import datetime
from time import sleep
from uuid import UUID

from app.engine.context import EngineContext
from app.engine.execution.execution_context import (
    DEFAULT_CONTRACT_VERSION,
    ExecutionContext,
)


class ExecutionContextTestCase(
    unittest.TestCase,
):
    """
    Testes unitários do contrato central de execução do EIOS.

    Estes testes não acessam:

    - banco de dados;
    - Supabase;
    - APIs externas;
    - arquivos;
    - variáveis sensíveis.
    """

    def create_engine_context(
        self,
    ) -> EngineContext:
        return EngineContext(
            organization_id=(
                "organization-test"
            ),
            school_id=(
                "school-test"
            ),
            user_id=(
                "user-test"
            ),
            module="agenda",
            role="professor",
            metadata={
                "source": (
                    "execution-context-test"
                ),
            },
        )

    def test_start_creates_valid_execution(
        self,
    ) -> None:
        engine_context = (
            self.create_engine_context()
        )

        execution = (
            ExecutionContext.start(
                context=engine_context,
            )
        )

        UUID(
            execution.execution_id,
        )

        self.assertEqual(
            execution.module,
            "agenda",
        )

        self.assertEqual(
            execution.contract_version,
            DEFAULT_CONTRACT_VERSION,
        )

        self.assertEqual(
            execution.organization_id,
            "organization-test",
        )

        self.assertEqual(
            execution.school_id,
            "school-test",
        )

        self.assertEqual(
            execution.user_id,
            "user-test",
        )

        self.assertEqual(
            execution.role,
            "professor",
        )

        self.assertIsInstance(
            execution.started_at,
            datetime,
        )

        self.assertIsNone(
            execution.completed_at,
        )

        self.assertIsNone(
            execution.duration_ms,
        )

        self.assertEqual(
            execution.metadata.get(
                "source",
            ),
            "execution-context-test",
        )

    def test_cache_key_is_stable_for_same_scope(
        self,
    ) -> None:
        engine_context = (
            self.create_engine_context()
        )

        first_execution = (
            ExecutionContext.start(
                context=engine_context,
            )
        )

        second_execution = (
            ExecutionContext.start(
                context=engine_context,
            )
        )

        self.assertNotEqual(
            first_execution.execution_id,
            second_execution.execution_id,
        )

        self.assertEqual(
            first_execution.cache_key,
            second_execution.cache_key,
        )

    def test_cache_key_changes_when_scope_changes(
        self,
    ) -> None:
        first_context = (
            self.create_engine_context()
        )

        second_context = (
            EngineContext(
                organization_id=(
                    "organization-test"
                ),
                school_id=(
                    "school-test"
                ),
                user_id=(
                    "another-user"
                ),
                module="agenda",
                role="professor",
                metadata={},
            )
        )

        first_execution = (
            ExecutionContext.start(
                context=first_context,
            )
        )

        second_execution = (
            ExecutionContext.start(
                context=second_context,
            )
        )

        self.assertNotEqual(
            first_execution.cache_key,
            second_execution.cache_key,
        )

    def test_cache_key_does_not_expose_raw_ids(
        self,
    ) -> None:
        engine_context = (
            self.create_engine_context()
        )

        execution = (
            ExecutionContext.start(
                context=engine_context,
            )
        )

        self.assertNotIn(
            "organization-test",
            execution.cache_key,
        )

        self.assertNotIn(
            "school-test",
            execution.cache_key,
        )

        self.assertNotIn(
            "user-test",
            execution.cache_key,
        )

        self.assertTrue(
            execution.cache_key.startswith(
                "eios:agenda:",
            ),
        )

        self.assertRegex(
            execution.cache_key,
            re.compile(
                r"^eios:agenda:[a-f0-9]{64}$",
            ),
        )

    def test_mark_success_completes_execution(
        self,
    ) -> None:
        execution = (
            ExecutionContext.start(
                context=(
                    self.create_engine_context()
                ),
            )
        )

        sleep(
            0.002,
        )

        execution.mark_success()

        self.assertEqual(
            execution.metadata.get(
                "status",
            ),
            "completed",
        )

        self.assertIsNotNone(
            execution.completed_at,
        )

        self.assertIsNotNone(
            execution.duration_ms,
        )

        self.assertGreaterEqual(
            execution.duration_ms or 0,
            0,
        )

    def test_complete_is_idempotent(
        self,
    ) -> None:
        execution = (
            ExecutionContext.start(
                context=(
                    self.create_engine_context()
                ),
            )
        )

        execution.mark_success()

        first_completed_at = (
            execution.completed_at
        )

        first_duration_ms = (
            execution.duration_ms
        )

        execution.complete()

        self.assertEqual(
            execution.completed_at,
            first_completed_at,
        )

        self.assertEqual(
            execution.duration_ms,
            first_duration_ms,
        )

    def test_fail_records_safe_error_metadata(
        self,
    ) -> None:
        execution = (
            ExecutionContext.start(
                context=(
                    self.create_engine_context()
                ),
            )
        )

        execution.fail(
            ValueError(
                "Falha controlada de teste.",
            ),
        )

        self.assertEqual(
            execution.metadata.get(
                "status",
            ),
            "failed",
        )

        self.assertEqual(
            execution.metadata.get(
                "error_type",
            ),
            "ValueError",
        )

        self.assertEqual(
            execution.metadata.get(
                "error_message",
            ),
            "Falha controlada de teste.",
        )

        self.assertIsNotNone(
            execution.completed_at,
        )

        self.assertIsNotNone(
            execution.duration_ms,
        )

    def test_to_dict_returns_complete_contract(
        self,
    ) -> None:
        execution = (
            ExecutionContext.start(
                context=(
                    self.create_engine_context()
                ),
                metadata={
                    "component": (
                        "pipeline-engine"
                    ),
                },
            )
        )

        execution.mark_success()

        result = (
            execution.to_dict()
        )

        self.assertEqual(
            set(
                result.keys(),
            ),
            {
                "execution_id",
                "started_at",
                "completed_at",
                "duration_ms",
                "module",
                "contract_version",
                "scope",
                "cache_key",
                "metadata",
            },
        )

        self.assertEqual(
            result[
                "scope"
            ],
            {
                "organization_id": (
                    "organization-test"
                ),
                "school_id": (
                    "school-test"
                ),
                "user_id": (
                    "user-test"
                ),
                "role": (
                    "professor"
                ),
            },
        )

        self.assertEqual(
            result[
                "metadata"
            ].get(
                "status",
            ),
            "completed",
        )

        self.assertEqual(
            result[
                "metadata"
            ].get(
                "component",
            ),
            "pipeline-engine",
        )

    def test_defaults_are_applied_to_empty_context(
        self,
    ) -> None:
        engine_context = (
            EngineContext(
                organization_id=None,
                school_id=None,
                user_id=None,
                module="",
                role=None,
                metadata={},
            )
        )

        execution = (
            ExecutionContext.start(
                context=engine_context,
                contract_version="",
            )
        )

        self.assertEqual(
            execution.module,
            "platform",
        )

        self.assertEqual(
            execution.contract_version,
            DEFAULT_CONTRACT_VERSION,
        )

        self.assertEqual(
            execution.scope(),
            {
                "organization_id": None,
                "school_id": None,
                "user_id": None,
                "role": None,
            },
        )


if __name__ == "__main__":
    unittest.main()