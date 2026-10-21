from datetime import datetime
from typing import Any
from pydantic import BaseModel


class SummaryGenerateRequest(BaseModel):
    dataset_id: int
    project_id: int | None = None
    summary_type: str = "executive"  # "executive" | "technical" | "business" | "presentation"


class SummaryUpdateRequest(BaseModel):
    content: str
    title: str | None = None


class SummaryOut(BaseModel):
    id: int
    project_id: int | None = None
    dataset_id: int
    summary_type: str
    title: str
    content: str
    metadata_json: dict[str, Any] | None = None
    created_by: int
    creator_name: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
