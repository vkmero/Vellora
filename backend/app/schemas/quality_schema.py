from datetime import datetime

from pydantic import BaseModel


class QualityIssueOut(BaseModel):
    id: int
    dataset_id: int
    column_name: str | None
    issue_type: str
    severity: str
    description: str
    recommendation: str | None = None
    affected_rows: int
    percentage: float
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class QualityOut(BaseModel):
    dataset_id: int
    quality_score: float
    category: str
    dimensions: dict
    explanations: dict = {}
    issues: list[QualityIssueOut]
    possible_primary_keys: list[dict] = []
