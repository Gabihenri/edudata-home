from datetime import datetime
from typing import Any, Optional

from app.core.exceptions.exceptions import ValidationException
from app.core.services.base_service import BaseService
from app.core.validators.validator import Validator
from app.repositories.agenda_repository import AgendaRepository


class AgendaService(BaseService):
    """
    Serviço da Agenda Inteligente EDI.

    Usa o Core Compartilhado:
    - BaseService
    - AgendaRepository
    - Validator
    - Exceptions
    """

    repository = AgendaRepository

    @classmethod
    def validate_create(cls, data: dict[str, Any]) -> None:
        Validator.required(data.get("school_id"), "school_id")
        Validator.required(data.get("organization_id"), "organization_id")
        Validator.required(data.get("user_id"), "user_id")
        Validator.required(data.get("title"), "title")
        Validator.required(data.get("event_type"), "event_type")
        Validator.required(data.get("start_datetime"), "start_datetime")
        Validator.required(data.get("end_datetime"), "end_datetime")

        start_datetime = data.get("start_datetime")
        end_datetime = data.get("end_datetime")

        if start_datetime and end_datetime:
            if str(end_datetime) <= str(start_datetime):
                raise ValidationException(
                    "A data/hora final deve ser maior que a data/hora inicial."
                )

    @classmethod
    def validate_update(cls, data: dict[str, Any]) -> None:
        start_datetime = data.get("start_datetime")
        end_datetime = data.get("end_datetime")

        if start_datetime and end_datetime:
            if str(end_datetime) <= str(start_datetime):
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

        return {
            "total_events": len(events),
            "planned": len([e for e in events if e.get("status") == "planned"]),
            "completed": len([e for e in events if e.get("status") == "completed"]),
            "cancelled": len([e for e in events if e.get("status") == "cancelled"]),
            "upcoming": len(
                [
                    e for e in events
                    if e.get("start_datetime")
                    and e.get("start_datetime") >= datetime.now().isoformat()
                ]
            ),
        }