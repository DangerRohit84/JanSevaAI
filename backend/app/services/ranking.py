from datetime import datetime, timedelta


def calculate_priority_score(
    submission_count: int,
    recent_count_7d: int,
    recent_count_30d: int,
    urgency_weight: float = 0.5,
    category_weight: float = 1.0,
) -> float:
    recency_score = 0.0
    if submission_count > 0:
        recency_score = (recent_count_7d * 1.0 + recent_count_30d * 0.5) / submission_count

    volume_score = min(submission_count / 50.0, 1.0)

    priority = (
        volume_score * 0.35
        + recency_score * 0.25
        + urgency_weight * 0.25
        + category_weight * 0.15
    )

    return round(priority * 100, 2)


def get_urgency_weight(urgency: str) -> float:
    weights = {
        "critical": 1.0,
        "high": 0.8,
        "medium": 0.5,
        "low": 0.2,
    }
    return weights.get(urgency, 0.5)


def get_category_weight(category: str) -> float:
    weights = {
        "health": 1.0,
        "water": 0.95,
        "infrastructure": 0.9,
        "education": 0.85,
        "sanitation": 0.8,
        "transport": 0.75,
        "electricity": 0.7,
        "agriculture": 0.65,
        "other": 0.5,
    }
    return weights.get(category, 0.5)
