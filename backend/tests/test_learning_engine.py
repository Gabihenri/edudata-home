from app.engine.context import EngineContext
from app.engine.learning.learning_engine import LearningEngine


def test_learning_engine_builds_feedback_features() -> None:
    context = EngineContext(
        organization_id="org-1",
        school_id="school-1",
        user_id="user-1",
        module="agenda",
        role="teacher",
    )

    result = LearningEngine.learn(
        context,
        {
            "recommendations": [{"id": "r1"}, {"id": "r2"}],
            "accepted_recommendations": 1,
            "interactions": [
                {
                    "recommendation_id": "r1",
                    "outcome": "accepted",
                    "recommendation_type": "planning",
                    "executed": True,
                    "result": "positive",
                },
                {
                    "recommendation_id": "r2",
                    "outcome": "rejected",
                    "recommendation_type": "planning",
                    "executed": False,
                    "result": "negative",
                },
            ],
        },
    )

    learning = result["learning"]

    assert learning["version"] == "learning-v2"
    assert learning["feedback_events"] == 2
    assert learning["acceptance_rate"] == 50.0
    assert learning["ready_for_training"] is True
    assert learning["features"]["sample_count"] == 2
    assert learning["features"]["execution_rate"] == 50.0
    assert learning["features"]["positive_result_rate"] == 50.0
    assert learning["feedback_outcomes"] == {
        "accepted": 1,
        "rejected": 1,
    }


def test_learning_engine_ignores_unstructured_interactions() -> None:
    context = EngineContext(module="agenda")

    result = LearningEngine.learn(
        context,
        {
            "interactions": [{"foo": "bar"}],
            "recommendations": [],
        },
    )

    assert result["learning"]["feedback_events"] == 0
    assert result["learning"]["ready_for_training"] is False
