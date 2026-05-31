"""Priority scoring — the heart of the app.

    priority_score = impact * w_impact + urgency * w_urgency - effort * w_effort

Effort is subtracted (prefer cheaper wins) and weighted less than impact/urgency
so a hard-but-critical task still outranks an easy-but-pointless one. Weights live
in ``core.config.settings`` so ranking behaviour is tunable without code changes.
"""
from app.core.config import settings


def compute_priority(impact: int, urgency: int, effort: int) -> float:
    """Pure function: given the 1–5 inputs, return the priority score."""
    return (
        impact * settings.w_impact
        + urgency * settings.w_urgency
        - effort * settings.w_effort
    )
