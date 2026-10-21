from datetime import datetime

from pydantic import BaseModel


class DatasetOut(BaseModel):
    id: int
    name: str
    original_filename: str
    file_type: str
    file_size: int
    owner_id: int
    owner_name: str | None = None
    status: str
    row_count: int | None
    column_count: int | None
    quality_score: float | None
    project_id: int | None = None
    project_name: str | None = None
    created_at: datetime
    updated_at: datetime
    has_cleaned_file: bool = False

    model_config = {"from_attributes": True}


class DatasetListResponse(BaseModel):
    items: list[DatasetOut]
    page: int
    page_size: int
    total: int
    pages: int
