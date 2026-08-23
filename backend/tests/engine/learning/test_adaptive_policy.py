from app.engine.learning.adaptive_policy import AdaptiveRecommendationPolicy


def test_prioritizes_recommendation_with_positive_history():
    recommendations = [
        {"id": "r1", "recommendation_type": "planning"},
        {"id": "r2", "recommendation_type": "routine"},
    ]
    feedback = [
        {"recommendation_type": "planning", "outcome": "accepted"},
        {"recommendation_type": "planning", "outcome": "executed"},
        {
            "recommendation_type": "planning",
            "outcome": "executed",
            "result": "positive",
        },
    ]

    ranked = AdaptiveRecommendationPolicy.rank(recommendations, feedback)

    assert ranked[0]["recommendation_type"] == "planning"
    assert ranked[0]["adaptive"]["priority"] == "prioritize"


def test_suppresses_recommendation_with_consistently_negative_history():
    recommendations = [{"id": "r1", "recommendation_type": "routine"}]
    feedback = [
        {"recommendation_type": "routine", "outcome": "rejected"},
        {"recommendation_type": "routine", "outcome": "ignored"},
        {
            "recommendation_type": "routine",
            "outcome": "rejected",
            "result": "negative",
        },
    ]

    ranked = AdaptiveRecommendationPolicy.rank(recommendations, feedback)

    assert ranked[0]["adaptive"]["priority"] == "suppress"
    assert AdaptiveRecommendationPolicy.should_surface(ranked[0]) is False


def test_keeps_standard_priority_with_insufficient_history():
    recommendations = [{"id": "r1", "recommendation_type": "planning"}]
    feedback = [
        {"recommendation_type": "planning", "outcome": "accepted"},
    ]

    ranked = AdaptiveRecommendationPolicy.rank(recommendations, feedback)

    assert ranked[0]["adaptive"]["priority"] == "standard"
    assert ranked[0]["adaptive"]["sample_count"] == 1
