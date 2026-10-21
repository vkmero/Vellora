from datetime import datetime

from pydantic import BaseModel


class CleanRequest(BaseModel):
    action_type: str
    column_name: str | None = None
    value: str | None = None
    preview: bool = False


class CleaningActionOut(BaseModel):
    id: int
    dataset_id: int
    column_name: str | None
    action_type: str
    before_count: int | None
    after_count: int | None
    affected_rows: int
    description: str
    performed_by: int
    created_at: datetime

    model_config = {"from_attributes": True}


class CleaningPreviewOut(BaseModel):
    action_type: str
    column_name: str | None
    before_count: int
    after_count: int
    affected_rows: int
    description: str
    destructive: bool
