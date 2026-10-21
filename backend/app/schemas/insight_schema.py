from datetime import datetime

from pydantic import BaseModel


class InsightOut(BaseModel):
    id: int
    dataset_id: int
    category: str
    title: str
    description: str
    evidence: dict | None
    severity: str
    recommendation: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
