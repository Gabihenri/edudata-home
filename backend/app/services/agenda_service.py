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

    @staticmethod
    def _parse_datetime(value: Any, field_name: str) -> datetime:
        if isinstance(value, datetime):
            parsed = value
        else:
            try:
                parsed = datetime.fromisoformat(
                    str(value).replace("Z", "+00:00")
                )
            except (TypeError, ValueError) as exc:
                raise ValidationException(
                    f"O campo {field_name} deve conter uma data/hora ISO válida."
                ) from exc

        # Datas sem fuso são interpretadas no fuso local do servidor. Datas
        # com fuso são comparadas como instantes, evitando erro lexical ISO.
        if parsed.tzinfo is None:
            parsed = parsed.astimezone()
        return parsed

    @classmethod
    def create(cls, data: dict[str, Any]) -> dict[str, Any]:
        return super().create(cls._normalize_temporal_fields(data))

    @classmethod
    def update(
        cls,
        record_id: str,
        data: dict[str, Any],
    ) -> Optional[dict[str, Any]]:
        return super().update(record_id, cls._normalize_temporal_fields(data))

    @classmethod
    def validate_create(cls, data: dict[str, Any]) -> None:
        normalized = cls._normalize_temporal_fields(data)
        Validator.required(normalized.get("school_id"), "school_id")
        Validator.required(normalized.get("organization_id"), "organization_id")
        Validator.required(normalized.get("user_id"), "user_id")
        Validator.required(normalized.get("title"), "title")
        Validator.required(normalized.get("event_type"), "event_type")
        Validator.required(normalized.get("start_at"), "start_at")
        Validator.required(normalized.get("end_at"), "end_at")

        start_at = cls._parse_datetime(normalized["start_at"], "start_at")
        end_at = cls._parse_datetime(normalized["end_at"], "end_at")
        if end_at <= start_at:
            raise ValidationException(
                "A data/hora final deve ser maior que a data/hora inicial."
            )

    @classmethod
    def validate_update(cls, data: dict[str, Any]) -> None:
        normalized = cls._normalize_temporal_fields(data)
        start_value = normalized.get("start_at")
        end_value = normalized.get("end_at")

        # Em atualizações parciais, só é possível validar a ordem quando
        # os dois extremos estão presentes no payload.
        if start_value is not None and end_value is not None:
            start_at = cls._parse_datetime(start_value, "start_at")
            end_at = cls._parse_datetime(end_value, "end_at")
            if end_at <= start_at:
                raise ValidationException(
                    "A data/hora final deve ser maior que a data/hora inicial."
                )

    @classmethod
    def list_by_school(
        cls,
        school_id: str,
        limit: int = 100,
        organization_id: str | None = None,
    ) -> list[dict[str, Any]]:
        Validator.required(school_id, "school_id")
        if organization_id is not None:
            Validator.required(organization_id, "organization_id")
        return cls.repository.list_by_school(
            school_id=school_id, limit=limit, organization_id=organization_id
        )

    @classmethod
    def list_by_teacher(
        cls,
        teacher_id: str,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        Validator.required(teacher_id, "teacher_id")
        return cls.repository.list_by_teacher(teacher_id=teacher_id, limit=limit)

    @classmethod
    def change_status(
        cls,
        event_id: str,
        status: str,
    ) -> Optional[dict[str, Any]]:
        Validator.required(event_id, "event_id")
        Validator.required(status, "status")
        Validator.one_of(status, ["planned", "completed", "cancelled"], "status")
        return cls.repository.update(event_id, {"status": status})

    @classmethod
    def events_between(
        cls,
        school_id: str,
        start: datetime,
        end: datetime,
        organization_id: str | None = None,
    ) -> list[dict[str, Any]]:
        Validator.required(school_id, "school_id")
        if organization_id is not None:
            Validator.required(organization_id, "organization_id")
        # Normalize both bounds before comparison: comparing a naive datetime
        # with an aware datetime raises TypeError. Naive inputs are interpreted
        # in the server's local timezone by _parse_datetime.
        start_at = cls._parse_datetime(start, "start")
        end_at = cls._parse_datetime(end, "end")
        if end_at <= start_at:
            raise ValidationException(
                "A data final deve ser maior que a data inicial."
            )
        return cls.repository.events_between(
            school_id=school_id,
            start=start_at,
            end=end_at,
            organization_id=organization_id,
        )

    @classmethod
    def upcoming_events(
        cls,
        school_id: str,
        limit: int = 10,
        organization_id: str | None = None,
    ) -> list[dict[str, Any]]:
        Validator.required(school_id, "school_id")
        if organization_id is not None:
            Validator.required(organization_id, "organization_id")
        return cls.repository.upcoming_events(
            school_id=school_id, limit=limit, organization_id=organization_id
        )

    @classmethod
    def dashboard_summary(
        cls,
        *,
        school_id: str,
        organization_id: str,
    ) -> dict[str, Any]:
        # Summary queries must always carry a server-authorized institutional
        # scope. Never fall back to an unfiltered repository.list() query.
        Validator.required(school_id, "school_id")
        Validator.required(organization_id, "organization_id")
        events = cls.repository.list_by_school(
            school_id=school_id,
            organization_id=organization_id,
            limit=500,
        )
        now = datetime.now().astimezone()

        def is_upcoming(event: dict[str, Any]) -> bool:
            value = event.get("start_at")
            if not value:
                return False
            try:
                start_at = cls._parse_datetime(value, "start_at")
            except ValidationException:
                return False
            return start_at >= now

        return {
            "total_events": len(events),
            "planned": len([e for e in events if e.get("status") == "planned"]),
            "completed": len([e for e in events if e.get("status") == "completed"]),
            "cancelled": len([e for e in events if e.get("status") == "cancelled"]),
            "upcoming": len([e for e in events if is_upcoming(e)]),
        }
