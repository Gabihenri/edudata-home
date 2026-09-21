from datetime import datetime, timedelta, timezone

from app.engine.learning.recommendation_relevance import RecommendationRelevancePolicy


def test_new_recommendation_surfaces():
    decision = RecommendationRelevancePolicy.decide(
        {"recommendation_type": "planning_review"},
        [],
        now=datetime(2026, 8, 23, tzinfo=timezone.utc),
    )
    assert decision.should_surface is True


def test_recent_recommendation_is_delayed():
    now = datetime(2026, 8, 23, 12, tzinfo=timezone.utc)
    decision = RecommendationRelevancePolicy.decide(
        {"recommendation_type": "planning_review"},
        [{"recommendation_type": "planning_review", "outcome": "accepted", "created_at": now.isoformat()}],
        now=now + timedelta(hours=2),
    )
    assert decision.should_surface is False


def test_negative_feedback_silences_repetition():
    now = datetime(2026, 8, 23, 12, tzinfo=timezone.utc)
    decision = RecommendationRelevancePolicy.decide(
        {"recommendation_type": "planning_review"},
        [{"recommendation_type": "planning_review", "outcome": "rejected", "created_at": now.isoformat()}],
        now=now + timedelta(hours=30),
    )
    assert decision.should_surface is False
