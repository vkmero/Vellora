from datetime import datetime

from pydantic import BaseModel


class PredictionRequest(BaseModel):
    target_column: str
    features: list[str] | None = None
    model_type: str
    problem_type: str


class PredictionOut(BaseModel):
    id: int
    dataset_id: int
    model_type: str
    target_column: str
    features: list | None
    metrics: dict | None
    predictions: dict | None
    created_by: int
    created_at: datetime

    model_config = {"from_attributes": True}
