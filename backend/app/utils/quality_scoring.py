def classify_score(score: float) -> str:
    if score >= 90:
        return "Excellent"
    if score >= 75:
        return "Good"
    if score >= 50:
        return "Needs Improvement"
    return "Critical"


def composite_quality_score(completeness: float, uniqueness: float, validity: float, consistency: float) -> float:
    score = (
        0.35 * completeness
        + 0.20 * uniqueness
        + 0.25 * validity
        + 0.20 * consistency
    )
    return round(max(0.0, min(100.0, score)), 2)
