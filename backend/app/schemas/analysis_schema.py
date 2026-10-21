from datetime import datetime
from typing import Any

from pydantic import BaseModel


class AnalysisOut(BaseModel):
    id: int
    dataset_id: int
    analysis_type: str
    parameters: dict | None
    results: dict | None
    created_by: int
    created_at: datetime

    model_config = {"from_attributes": True}
