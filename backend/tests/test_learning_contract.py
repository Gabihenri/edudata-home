from app.engine.learning.learning_contract import to_persistable_event


def test_to_persistable_event_keeps_only_learning_fields() -> None:
    event = to_persistable_event(
        {
            "recommendation_id": "r1",
            "outcome": "accepted",
            "result": "positive",
            "module": "agenda",
            "secret": "must-not-persist",
        },
        organization_id="org-1",
        school_id="school-1",
        user_id="user-1",
    )

    assert event["recommendation_id"] == "r1"
    assert event["outcome"] == "accepted"
    assert event["result"] == "positive"
    assert event["organization_id"] == "org-1"
    assert event["school_id"] == "school-1"
    assert event["user_id"] == "user-1"
    assert "secret" not in event
