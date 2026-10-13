from datetime import datetime
from typing import Any, Optional

from app.core.exceptions.exceptions import ValidationException
from app.core.services.base_service import BaseService
from app.core.validators.validator import Validator
from app.repositories.agenda_repository import AgendaRepository


class AgendaService(BaseService):
    """
    Serviço da Agenda Inteligente EDI.

    Mantém compatibilidade com os nomes temporais legados da API
    (start_datetime/end_datetime), persistindo no contrato do banco
    (start_at/end_at).
    """

    repository = AgendaRepository

    @staticmethod
    def _normalize_temporal_fields(data: dict[str, Any]) -> dict[str, Any]:
        normalized = dict(data)

        # Os nomes reais das colunas de agenda_events são start_at/end_at.
        # Os aliases legados são aceitos na entrada para não quebrar clientes
        # existentes, mas nunca devem ser enviados ao banco.
        aliases = (
            ("start_datetime", "start_at"),
            ("end_datetime", "end_at"),
        )

        for legacy_name, database_name in aliases:
            if legacy_name in normalized:
                legacy_value = normalized.pop(legacy_name)
                if database_name not in normalized:
                    normalized[database_name] = legacy_value

        return normalized

    @classmethod
    def create(cls, data: dict[str, Any]) -> dict[str, Any]:
        normalized = cls._normalize_temporal_fields(data)
        return super().create(normalized)

    @classmethod
    def update(
        cls,
        record_id: str,
        data: dict[str, Any],
    ) -> Optional[dict[str, Any]]:
        normalized = cls._normalize_temporal_fields(data)
        return super().update(record_id, normalized)

    @classmethod
    def validate_create(cls, data: dict[str, Any]) -> None:
        Validator.required(data.get("school_id"), "school_id")
        Validator.required(data.get("organization_id"), "organization_id")
        Validator.required(data.get("user_id"), "user_id")
        Validator.required(data.get("title"), "title")
        Validator.required(data.get("event_type"), "event_type")
        Validator.required(data.get("start_at"), "start_at")
        Validator.required(data.get("end_at"), "end_at")

        start_at = data.get("start_at")
        end_at = data.get("end_at")

        if start_at and end_at and str(end_at) <= str(start_at):
            raise ValidationException(
                "A data/hora final deve ser maior que a data/hora inicial."
            )

    @classmethod
    def validate_update(cls, data: dict[str, Any]) -> None:
        start_at = data.get("start_at")
        end_at = data.get("end_at")

        if start_at and end_at and str(end_at) <= str(start_at):
            raise ValidationException(
                "A data/hora final deve ser maior que a data/hora inicial."
            )

    @classmethod
    def list_by_school(
        cls,
        school_id: str,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        Validator.required(school_id, "school_id")

        return cls.repository.list_by_school(
            school_id=school_id,
            limit=limit,
        )

    @classmethod
    def list_by_teacher(
        cls,
        teacher_id: str,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        Validator.required(teacher_id, "teacher_id")

        return cls.repository.list_by_teacher(
            teacher_id=teacher_id,
            limit=limit,
        )

    @classmethod
    def change_status(
        cls,
        event_id: str,
        status: str,
    ) -> Optional[dict[str, Any]]:
        Validator.required(event_id, "event_id")
        Validator.required(status, "status")

        Validator.one_of(
            status,
            ["planned", "completed", "cancelled"],
            "status",
        )

        return cls.repository.update(
            event_id,
            {"status": status},
        )

    @classmethod
    def events_between(
        cls,
        school_id: str,
        start: datetime,
        end: datetime,
    ) -> list[dict[str, Any]]:
        Validator.required(school_id, "school_id")

        if end <= start:
            raise ValidationException(
                "A data final deve ser maior que a data inicial."
            )

        return cls.repository.events_between(
            school_id=school_id,
            start=start,
            end=end,
        )

    @classmethod
    def upcoming_events(
        cls,
        school_id: str,
        limit: int = 10,
    ) -> list[dict[str, Any]]:
        Validator.required(school_id, "school_id")

        return cls.repository.upcoming_events(
            school_id=school_id,
            limit=limit,
        )

    @classmethod
    def dashboard_summary(cls) -> dict[str, Any]:
        events = cls.repository.list(limit=500)
        now = datetime.now().astimezone()

        def is_upcoming(event: dict[str, Any]) -> bool:
            value = event.get("start_at")
            if not value:
                return False

            try:
                start_at = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
            except ValueError:
                return False

            if start_at.tzinfo is None:
                start_at = start_at.replace(tzinfo=now.tzinfo)

            return start_at >= now

        return {
            "total_events": len(events),
            "planned": len([e for e in events if e.get("status") == "planned"]),
            "completed": len([e for e in events if e.get("status") == "completed"]),
            "cancelled": len([e for e in events if e.get("status") == "cancelled"]),
            "upcoming": len([e for e in events if is_upcoming(e)]),
        }
