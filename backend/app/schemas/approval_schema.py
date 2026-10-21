from datetime import datetime

from pydantic import BaseModel, Field


class ApprovalDecision(BaseModel):
    comments: str | None = None


class RejectDecision(BaseModel):
    comments: str = Field(min_length=3)


class ApprovalOut(BaseModel):
    id: int
    dataset_id: int
    dataset_name: str | None = None
    requested_by: int
    requester_name: str | None = None
    reviewed_by: int | None
    status: str
    comments: str | None
    requested_at: datetime
    reviewed_at: datetime | None
    quality_score: float | None = None

    model_config = {"from_attributes": True}
