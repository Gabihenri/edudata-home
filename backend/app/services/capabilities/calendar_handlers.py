from __future__ import annotations

from collections import defaultdict
from datetime import date, datetime, time, timedelta, timezone
from typing import Any

from app.services.capabilities.agenda_capabilities import (
    CALENDAR_WORKLOAD_BALANCE_ID,
    PLANNING_WEEKLY_ANALYSIS_ID,
    TASKS_SMART_PRIORITIZATION_ID,
)
from app.services.capabilities.dispatcher import (
    CapabilityDispatcher,
    capability_dispatcher,
)
from app.services.capabilities.exceptions import (
    CapabilityValidationError,
)
from app.services.capabilities.resolver import (
    CapabilityResolution,
)


DEFAULT_EVENT_DURATION_MINUTES = 60
DEFAULT_LESSON_DURATION_MINUTES = 50
DEFAULT_TASK_DURATION_MINUTES = 30

SHORT_INTERVAL_MINUTES = 15
HIGH_LOAD_MINUTES = 360
CRITICAL_LOAD_MINUTES = 480

MAXIMUM_DAYS = 31
MAXIMUM_RECOMMENDATIONS = 12
MAXIMUM_OVERLAPS = 30
MAXIMUM_SHORT_INTERVALS = 30


def _as_record(
    value: Any,
) -> dict[str, Any]:
    if not isinstance(
        value,
        dict,
    ):
        return {}

    return {
        **value,
    }


def _as_record_list(
    value: Any,
) -> list[dict[str, Any]]:
    if not isinstance(
        value,
        list,
    ):
        return []

    return [
        {
            **item,
        }
        for item in value
        if isinstance(
            item,
            dict,
        )
    ]


def _optional_text(
    value: Any,
) -> str | None:
    if (
        isinstance(
            value,
            str,
        )
        and value.strip()
    ):
        return value.strip()

    return None


def _non_negative_integer(
    value: Any,
    *,
    default: int = 0,
) -> int:
    if isinstance(
        value,
        bool,
    ):
        return default

    if isinstance(
        value,
        int,
    ):
        return max(
            value,
            0,
        )

    if isinstance(
        value,
        float,
    ):
        return max(
            int(
                value,
            ),
            0,
        )

    if isinstance(
        value,
        str,
    ):
        try:
            return max(
                int(
                    float(
                        value.strip(),
                    ),
                ),
                0,
            )

        except ValueError:
            return default

    return default


def _parse_datetime(
    value: Any,
) -> datetime | None:
    normalized_value = _optional_text(
        value,
    )

    if normalized_value is None:
        return None

    try:
        parsed_value = datetime.fromisoformat(
            normalized_value.replace(
                "Z",
                "+00:00",
            ),
        )

    except ValueError:
        return None

    if parsed_value.tzinfo is None:
        return parsed_value.replace(
            tzinfo=timezone.utc,
        )

    return parsed_value.astimezone(
        timezone.utc,
    )


def _parse_date(
    value: Any,
) -> date | None:
    parsed_datetime = _parse_datetime(
        value,
    )

    if parsed_datetime is not None:
        return parsed_datetime.date()

    normalized_value = _optional_text(
        value,
    )

    if normalized_value is None:
        return None

    try:
        return date.fromisoformat(
            normalized_value[
                :10
            ],
        )

    except ValueError:
        return None


def _normalize_reference_datetime(
    value: Any,
) -> datetime:
    parsed_value = _parse_datetime(
        value,
    )

    if parsed_value is not None:
        return parsed_value

    return datetime.now(
        timezone.utc,
    )


def _build_period(
    payload: dict[str, Any],
    *,
    reference_datetime: datetime,
) -> dict[str, str]:
    supplied_period = _as_record(
        payload.get(
            "period",
        ),
    )

    start_date = _parse_date(
        supplied_period.get(
            "start",
        )
        or supplied_period.get(
            "start_date",
        ),
    )

    end_date = _parse_date(
        supplied_period.get(
            "end",
        )
        or supplied_period.get(
            "end_date",
        ),
    )

    if start_date is None:
        start_date = (
            reference_datetime.date()
            - timedelta(
                days=(
                    reference_datetime.weekday()
                ),
            )
        )

    if end_date is None:
        end_date = (
            start_date
            + timedelta(
                days=6,
            )
        )

    if end_date < start_date:
        raise CapabilityValidationError(
            (
                "O período de análise do calendário "
                "possui data final anterior à data inicial."
            ),
            capability_id=(
                CALENDAR_WORKLOAD_BALANCE_ID
            ),
            details={
                "start_date": (
                    start_date.isoformat()
                ),
                "end_date": (
                    end_date.isoformat()
                ),
            },
        )

    if (
        end_date
        - start_date
    ).days + 1 > MAXIMUM_DAYS:
        raise CapabilityValidationError(
            (
                "O período de análise do calendário "
                f"não pode ultrapassar {MAXIMUM_DAYS} dias."
            ),
            capability_id=(
                CALENDAR_WORKLOAD_BALANCE_ID
            ),
            details={
                "maximum_days": (
                    MAXIMUM_DAYS
                ),
            },
        )

    return {
        "start": (
            start_date.isoformat()
        ),
        "end": (
            end_date.isoformat()
        ),
    }


def _duration_minutes(
    item: dict[str, Any],
    *,
    default: int,
) -> int:
    direct_duration = (
        item.get(
            "duration_minutes",
        )
        or item.get(
            "estimated_minutes",
        )
        or item.get(
            "minutes",
        )
    )

    parsed_duration = (
        _non_negative_integer(
            direct_duration,
        )
    )

    if parsed_duration > 0:
        return parsed_duration

    start_datetime = _parse_datetime(
        item.get(
            "start_at",
        )
        or item.get(
            "starts_at",
        )
        or item.get(
            "start",
        )
        or item.get(
            "scheduled_at",
        ),
    )

    end_datetime = _parse_datetime(
        item.get(
            "end_at",
        )
        or item.get(
            "ends_at",
        )
        or item.get(
            "end",
        ),
    )

    if (
        start_datetime is not None
        and end_datetime is not None
        and end_datetime
        > start_datetime
    ):
        return max(
            int(
                (
                    end_datetime
                    - start_datetime
                ).total_seconds()
                / 60
            ),
            1,
        )

    return default


def _build_activity(
    item: dict[str, Any],
    *,
    activity_type: str,
    default_duration: int,
) -> dict[str, Any] | None:
    identifier = (
        _optional_text(
            item.get(
                "id",
            ),
        )
        or _optional_text(
            item.get(
                f"{activity_type}_id",
            ),
        )
    )

    title = (
        _optional_text(
            item.get(
                "title",
            ),
        )
        or _optional_text(
            item.get(
                "name",
            ),
        )
        or activity_type
    )

    start_datetime = _parse_datetime(
        item.get(
            "start_at",
        )
        or item.get(
            "starts_at",
        )
        or item.get(
            "start",
        )
        or item.get(
            "scheduled_at",
        )
        or item.get(
            "due_date",
        )
        or item.get(
            "date",
        ),
    )

    if start_datetime is None:
        parsed_day = _parse_date(
            item.get(
                "date",
            )
            or item.get(
                "due_date",
            ),
        )

        if parsed_day is None:
            return None

        start_datetime = datetime.combine(
            parsed_day,
            time(
                hour=12,
            ),
            tzinfo=timezone.utc,
        )

    duration = _duration_minutes(
        item,
        default=(
            default_duration
        ),
    )

    end_datetime = _parse_datetime(
        item.get(
            "end_at",
        )
        or item.get(
            "ends_at",
        )
        or item.get(
            "end",
        ),
    )

    if (
        end_datetime is None
        or end_datetime
        <= start_datetime
    ):
        end_datetime = (
            start_datetime
            + timedelta(
                minutes=duration,
            )
        )

    return {
        "id": identifier,
        "type": activity_type,
        "title": title,
        "date": (
            start_datetime
            .date()
            .isoformat()
        ),
        "start_at": (
            start_datetime
            .isoformat()
        ),
        "end_at": (
            end_datetime
            .isoformat()
        ),
        "duration_minutes": (
            duration
        ),
        "source": {
            **item,
        },
    }


def _collect_activities(
    payload: dict[str, Any],
    *,
    period: dict[str, str],
) -> list[dict[str, Any]]:
    events = _as_record_list(
        payload.get(
            "events",
        ),
    )

    lessons = _as_record_list(
        payload.get(
            "lessons",
        ),
    )

    tasks = _as_record_list(
        payload.get(
            "tasks",
        ),
    )

    start_date = date.fromisoformat(
        period[
            "start"
        ],
    )

    end_date = date.fromisoformat(
        period[
            "end"
        ],
    )

    activities: list[
        dict[str, Any]
    ] = []

    collections = (
        (
            events,
            "event",
            DEFAULT_EVENT_DURATION_MINUTES,
        ),
        (
            lessons,
            "lesson",
            DEFAULT_LESSON_DURATION_MINUTES,
        ),
        (
            tasks,
            "task",
            DEFAULT_TASK_DURATION_MINUTES,
        ),
    )

    for (
        collection,
        activity_type,
        default_duration,
    ) in collections:
        for item in collection:
            activity = _build_activity(
                item,
                activity_type=(
                    activity_type
                ),
                default_duration=(
                    default_duration
                ),
            )

            if activity is None:
                continue

            activity_date = date.fromisoformat(
                activity[
                    "date"
                ],
            )

            if not (
                start_date
                <= activity_date
                <= end_date
            ):
                continue

            activities.append(
                activity,
            )

    return sorted(
        activities,
        key=lambda activity: (
            activity[
                "start_at"
            ],
            activity[
                "type"
            ],
            activity.get(
                "id",
            )
            or "",
        ),
    )


def _build_overlap(
    first: dict[str, Any],
    second: dict[str, Any],
) -> dict[str, Any] | None:
    first_start = _parse_datetime(
        first.get(
            "start_at",
        ),
    )

    first_end = _parse_datetime(
        first.get(
            "end_at",
        ),
    )

    second_start = _parse_datetime(
        second.get(
            "start_at",
        ),
    )

    second_end = _parse_datetime(
        second.get(
            "end_at",
        ),
    )

    if (
        first_start is None
        or first_end is None
        or second_start is None
        or second_end is None
    ):
        return None

    overlap_start = max(
        first_start,
        second_start,
    )

    overlap_end = min(
        first_end,
        second_end,
    )

    if overlap_end <= overlap_start:
        return None

    overlap_minutes = int(
        (
            overlap_end
            - overlap_start
        ).total_seconds()
        / 60
    )

    return {
        "date": (
            first_start
            .date()
            .isoformat()
        ),
        "first": {
            "id": (
                first.get(
                    "id",
                )
            ),
            "type": (
                first.get(
                    "type",
                )
            ),
            "title": (
                first.get(
                    "title",
                )
            ),
        },
        "second": {
            "id": (
                second.get(
                    "id",
                )
            ),
            "type": (
                second.get(
                    "type",
                )
            ),
            "title": (
                second.get(
                    "title",
                )
            ),
        },
        "overlap_minutes": (
            max(
                overlap_minutes,
                1,
            )
        ),
    }


def _analyze_day(
    day_value: date,
    activities: list[dict[str, Any]],
) -> dict[str, Any]:
    daily_activities = [
        activity
        for activity in activities
        if activity.get(
            "date",
        )
        == day_value.isoformat()
    ]

    total_minutes = sum(
        _non_negative_integer(
            activity.get(
                "duration_minutes",
            ),
        )
        for activity in daily_activities
    )

    event_count = sum(
        1
        for activity in daily_activities
        if activity.get(
            "type",
        )
        == "event"
    )

    lesson_count = sum(
        1
        for activity in daily_activities
        if activity.get(
            "type",
        )
        == "lesson"
    )

    task_count = sum(
        1
        for activity in daily_activities
        if activity.get(
            "type",
        )
        == "task"
    )

    overlaps: list[
        dict[str, Any]
    ] = []

    short_intervals: list[
        dict[str, Any]
    ] = []

    for index, first in enumerate(
        daily_activities,
    ):
        for second in daily_activities[
            index + 1:
        ]:
            overlap = _build_overlap(
                first,
                second,
            )

            if overlap is not None:
                overlaps.append(
                    overlap,
                )

    sorted_activities = sorted(
        daily_activities,
        key=lambda activity: (
            activity[
                "start_at"
            ]
        ),
    )

    for index in range(
        len(
            sorted_activities,
        )
        - 1
    ):
        current_activity = (
            sorted_activities[
                index
            ]
        )

        next_activity = (
            sorted_activities[
                index + 1
            ]
        )

        current_end = _parse_datetime(
            current_activity.get(
                "end_at",
            ),
        )

        next_start = _parse_datetime(
            next_activity.get(
                "start_at",
            ),
        )

        if (
            current_end is None
            or next_start is None
            or next_start
            <= current_end
        ):
            continue

        interval_minutes = int(
            (
                next_start
                - current_end
            ).total_seconds()
            / 60
        )

        if (
            interval_minutes
            >= SHORT_INTERVAL_MINUTES
        ):
            continue

        short_intervals.append(
            {
                "date": (
                    day_value.isoformat()
                ),
                "from": {
                    "id": (
                        current_activity.get(
                            "id",
                        )
                    ),
                    "type": (
                        current_activity.get(
                            "type",
                        )
                    ),
                    "title": (
                        current_activity.get(
                            "title",
                        )
                    ),
                },
                "to": {
                    "id": (
                        next_activity.get(
                            "id",
                        )
                    ),
                    "type": (
                        next_activity.get(
                            "type",
                        )
                    ),
                    "title": (
                        next_activity.get(
                            "title",
                        )
                    ),
                },
                "interval_minutes": (
                    interval_minutes
                ),
            },
        )

    if (
        total_minutes
        >= CRITICAL_LOAD_MINUTES
        or len(
            overlaps,
        )
        >= 2
    ):
        status = "critical"

    elif (
        total_minutes
        >= HIGH_LOAD_MINUTES
        or overlaps
        or len(
            daily_activities,
        )
        >= 8
    ):
        status = "high"

    elif daily_activities:
        status = "balanced"

    else:
        status = "empty"

    return {
        "date": (
            day_value.isoformat()
        ),
        "weekday": (
            day_value.weekday()
        ),
        "status": status,
        "total_items": (
            len(
                daily_activities,
            )
        ),
        "total_minutes": (
            total_minutes
        ),
        "events": (
            event_count
        ),
        "lessons": (
            lesson_count
        ),
        "tasks": (
            task_count
        ),
        "overlaps": (
            overlaps[
                :MAXIMUM_OVERLAPS
            ]
        ),
        "short_intervals": (
            short_intervals[
                :MAXIMUM_SHORT_INTERVALS
            ]
        ),
        "activities": (
            daily_activities
        ),
    }


def _build_daily_distribution(
    period: dict[str, str],
    activities: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    start_date = date.fromisoformat(
        period[
            "start"
        ],
    )

    end_date = date.fromisoformat(
        period[
            "end"
        ],
    )

    distribution: list[
        dict[str, Any]
    ] = []

    current_date = start_date

    while current_date <= end_date:
        distribution.append(
            _analyze_day(
                current_date,
                activities,
            ),
        )

        current_date += timedelta(
            days=1,
        )

    return distribution


def _balance_score(
    *,
    daily_distribution: list[dict[str, Any]],
    total_overlaps: int,
    total_short_intervals: int,
) -> float:
    if not daily_distribution:
        return 100.0

    critical_days = sum(
        1
        for day_item in daily_distribution
        if day_item.get(
            "status",
        )
        == "critical"
    )

    high_days = sum(
        1
        for day_item in daily_distribution
        if day_item.get(
            "status",
        )
        == "high"
    )

    penalty = (
        critical_days
        * 20
        + high_days
        * 10
        + total_overlaps
        * 8
        + total_short_intervals
        * 3
    )

    return round(
        max(
            100
            - min(
                penalty,
                100,
            ),
            0,
        ),
        2,
    )


def _status_from_score(
    score: float,
) -> str:
    if score >= 85:
        return "balanced"

    if score >= 70:
        return "attention"

    if score >= 50:
        return "high"

    return "critical"


def _build_recommendations(
    *,
    daily_distribution: list[dict[str, Any]],
    total_overlaps: int,
    total_short_intervals: int,
    prioritized_tasks: dict[str, Any],
) -> list[dict[str, Any]]:
    recommendations: list[
        dict[str, Any]
    ] = []

    critical_days = [
        day_item
        for day_item in daily_distribution
        if day_item.get(
            "status",
        )
        == "critical"
    ]

    high_days = [
        day_item
        for day_item in daily_distribution
        if day_item.get(
            "status",
        )
        == "high"
    ]

    if critical_days:
        recommendations.append(
            {
                "code": (
                    "review_critical_days"
                ),
                "priority": "critical",
                "area": "calendar",
                "description": (
                    "Revisar os dias classificados como "
                    "críticos e avaliar redistribuição manual "
                    "das atividades."
                ),
                "dates": [
                    day_item[
                        "date"
                    ]
                    for day_item
                    in critical_days
                ],
                "automatic_action": False,
                "professional_decision_required": True,
            },
        )

    if high_days:
        recommendations.append(
            {
                "code": (
                    "review_high_load_days"
                ),
                "priority": "high",
                "area": "calendar",
                "description": (
                    "Avaliar os dias com carga elevada antes "
                    "de incluir novas atividades."
                ),
                "dates": [
                    day_item[
                        "date"
                    ]
                    for day_item
                    in high_days
                ],
                "automatic_action": False,
                "professional_decision_required": True,
            },
        )

    if total_overlaps > 0:
        recommendations.append(
            {
                "code": (
                    "resolve_time_overlaps"
                ),
                "priority": "high",
                "area": "calendar",
                "description": (
                    "Existem atividades com sobreposição de "
                    "horários que exigem revisão."
                ),
                "total": (
                    total_overlaps
                ),
                "automatic_action": False,
                "professional_decision_required": True,
            },
        )

    if total_short_intervals > 0:
        recommendations.append(
            {
                "code": (
                    "increase_activity_intervals"
                ),
                "priority": "medium",
                "area": "calendar",
                "description": (
                    "Existem intervalos reduzidos entre "
                    "atividades consecutivas."
                ),
                "total": (
                    total_short_intervals
                ),
                "automatic_action": False,
                "professional_decision_required": True,
            },
        )

    task_summary = _as_record(
        prioritized_tasks.get(
            "summary",
        ),
    )

    overdue_tasks = _non_negative_integer(
        task_summary.get(
            "overdue",
        ),
    )

    critical_tasks = _non_negative_integer(
        task_summary.get(
            "critical",
        ),
    )

    if (
        overdue_tasks > 0
        or critical_tasks > 0
    ):
        recommendations.append(
            {
                "code": (
                    "protect_time_for_priority_tasks"
                ),
                "priority": (
                    "high"
                    if critical_tasks > 0
                    else "medium"
                ),
                "area": "tasks",
                "description": (
                    "Reservar blocos de trabalho para tarefas "
                    "atrasadas ou classificadas como críticas."
                ),
                "overdue_tasks": (
                    overdue_tasks
                ),
                "critical_tasks": (
                    critical_tasks
                ),
                "automatic_action": False,
                "professional_decision_required": True,
            },
        )

    if not recommendations:
        recommendations.append(
            {
                "code": (
                    "maintain_calendar_balance"
                ),
                "priority": "low",
                "area": "calendar",
                "description": (
                    "Manter a distribuição atual e revisar "
                    "a carga antes de inserir novas atividades."
                ),
                "automatic_action": False,
                "professional_decision_required": True,
            },
        )

    return recommendations[
        :MAXIMUM_RECOMMENDATIONS
    ]


def execute_calendar_workload_balance(
    resolution: CapabilityResolution,
    payload: dict[str, Any],
) -> dict[str, Any]:
    """
    Handler oficial da capacidade calendar.workload_balance.

    Analisa eventos, aulas e tarefas previamente autorizados.
    Não altera registros e não acessa calendários externos.
    """

    if (
        resolution.capability_id
        != CALENDAR_WORKLOAD_BALANCE_ID
    ):
        raise CapabilityValidationError(
            (
                "O handler recebeu uma resolução "
                "de capacidade incompatível."
            ),
            capability_id=(
                resolution.capability_id
            ),
            details={
                "expected_capability_id": (
                    CALENDAR_WORKLOAD_BALANCE_ID
                ),
            },
        )

    weekly_analysis = _as_record(
        payload.get(
            "weekly_analysis",
        ),
    )

    prioritized_tasks = _as_record(
        payload.get(
            "prioritized_tasks",
        ),
    )

    if not weekly_analysis:
        raise CapabilityValidationError(
            (
                "A análise de carga exige o resultado de "
                "planning.weekly_planning_analysis."
            ),
            capability_id=(
                CALENDAR_WORKLOAD_BALANCE_ID
            ),
            details={
                "required_dependency": (
                    PLANNING_WEEKLY_ANALYSIS_ID
                ),
            },
        )

    if not prioritized_tasks:
        raise CapabilityValidationError(
            (
                "A análise de carga exige o resultado de "
                "tasks.smart_prioritization."
            ),
            capability_id=(
                CALENDAR_WORKLOAD_BALANCE_ID
            ),
            details={
                "required_dependency": (
                    TASKS_SMART_PRIORITIZATION_ID
                ),
            },
        )

    reference_datetime = (
        _normalize_reference_datetime(
            payload.get(
                "reference_datetime",
            ),
        )
    )

    period = _build_period(
        payload,
        reference_datetime=(
            reference_datetime
        ),
    )

    normalized_payload = {
        **payload,
        "tasks": (
            _as_record_list(
                payload.get(
                    "tasks",
                ),
            )
            or _as_record_list(
                prioritized_tasks.get(
                    "tasks",
                ),
            )
        ),
    }

    activities = _collect_activities(
        normalized_payload,
        period=period,
    )

    daily_distribution = (
        _build_daily_distribution(
            period,
            activities,
        )
    )

    overlaps = [
        overlap
        for day_item in daily_distribution
        for overlap in _as_record_list(
            day_item.get(
                "overlaps",
            ),
        )
    ]

    short_intervals = [
        interval
        for day_item in daily_distribution
        for interval in _as_record_list(
            day_item.get(
                "short_intervals",
            ),
        )
    ]

    total_minutes = sum(
        _non_negative_integer(
            day_item.get(
                "total_minutes",
            ),
        )
        for day_item in daily_distribution
    )

    total_events = sum(
        _non_negative_integer(
            day_item.get(
                "events",
            ),
        )
        for day_item in daily_distribution
    )

    total_lessons = sum(
        _non_negative_integer(
            day_item.get(
                "lessons",
            ),
        )
        for day_item in daily_distribution
    )

    total_tasks = sum(
        _non_negative_integer(
            day_item.get(
                "tasks",
            ),
        )
        for day_item in daily_distribution
    )

    critical_days = sum(
        1
        for day_item in daily_distribution
        if day_item.get(
            "status",
        )
        == "critical"
    )

    high_load_days = sum(
        1
        for day_item in daily_distribution
        if day_item.get(
            "status",
        )
        == "high"
    )

    balanced_days = sum(
        1
        for day_item in daily_distribution
        if day_item.get(
            "status",
        )
        == "balanced"
    )

    balance_score = _balance_score(
        daily_distribution=(
            daily_distribution
        ),
        total_overlaps=(
            len(
                overlaps,
            )
        ),
        total_short_intervals=(
            len(
                short_intervals,
            )
        ),
    )

    recommendations = _build_recommendations(
        daily_distribution=(
            daily_distribution
        ),
        total_overlaps=(
            len(
                overlaps,
            )
        ),
        total_short_intervals=(
            len(
                short_intervals,
            )
        ),
        prioritized_tasks=(
            prioritized_tasks
        ),
    )

    return {
        "capability_id": (
            CALENDAR_WORKLOAD_BALANCE_ID
        ),
        "contract_version": (
            "calendar-workload-balance-v1"
        ),
        "generated_at": (
            datetime.now(
                timezone.utc,
            ).isoformat()
        ),
        "source_capabilities": [
            PLANNING_WEEKLY_ANALYSIS_ID,
            TASKS_SMART_PRIORITIZATION_ID,
        ],
        "period": period,
        "summary": {
            "balance_score": (
                balance_score
            ),
            "status": (
                _status_from_score(
                    balance_score,
                )
            ),
            "total_items": (
                len(
                    activities,
                )
            ),
            "total_events": (
                total_events
            ),
            "total_lessons": (
                total_lessons
            ),
            "total_tasks": (
                total_tasks
            ),
            "total_minutes": (
                total_minutes
            ),
            "critical_days": (
                critical_days
            ),
            "high_load_days": (
                high_load_days
            ),
            "balanced_days": (
                balanced_days
            ),
            "overlaps": (
                len(
                    overlaps,
                )
            ),
            "short_intervals": (
                len(
                    short_intervals,
                )
            ),
        },
        "daily_distribution": (
            daily_distribution
        ),
        "overlaps": (
            overlaps[
                :MAXIMUM_OVERLAPS
            ]
        ),
        "short_intervals": (
            short_intervals[
                :MAXIMUM_SHORT_INTERVALS
            ]
        ),
        "recommendations": (
            recommendations
        ),
        "weekly_context": {
            **_as_record(
                weekly_analysis.get(
                    "summary",
                ),
            ),
        },
        "task_context": {
            **_as_record(
                prioritized_tasks.get(
                    "summary",
                ),
            ),
        },
        "metadata": {
            "deterministic": True,
            "generative_ai_used": False,
            "automatic_changes": False,
            "automatic_rescheduling": False,
            "external_calendar_access": False,
            "automatic_notification": False,
            "database_accessed": False,
            "professional_decision_required": True,
            "thresholds": {
                "short_interval_minutes": (
                    SHORT_INTERVAL_MINUTES
                ),
                "high_load_minutes": (
                    HIGH_LOAD_MINUTES
                ),
                "critical_load_minutes": (
                    CRITICAL_LOAD_MINUTES
                ),
            },
        },
    }


def register_calendar_handlers(
    dispatcher: CapabilityDispatcher | None = None,
) -> tuple[str, ...]:
    """
    Registra os handlers oficiais de inteligência do calendário.

    O processo é idempotente e seguro para o Bootstrap.
    """

    target_dispatcher = (
        dispatcher
        or capability_dispatcher
    )

    if not target_dispatcher.has_handler(
        CALENDAR_WORKLOAD_BALANCE_ID,
    ):
        target_dispatcher.register_handler(
            CALENDAR_WORKLOAD_BALANCE_ID,
            execute_calendar_workload_balance,
        )

    return (
        CALENDAR_WORKLOAD_BALANCE_ID,
    )