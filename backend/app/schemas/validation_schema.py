from datetime import datetime
from typing import Any

from pydantic import BaseModel


class ValidationOut(BaseModel):
    id: int
    dataset_id: int
    previous_quality_score: float | None
    new_quality_score: float | None
    issues_before: int
    issues_after: int
    validation_status: str
    validation_summary: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}
