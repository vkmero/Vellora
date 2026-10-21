from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ColumnProfile(BaseModel):
    name: str
    kind: str
    datatype: str
    unique_count: int
    missing_count: int
    missing_percentage: float
    min: float | int | None = None
    max: float | int | None = None
    mean: float | None = None
    median: float | None = None


class ProfileOut(BaseModel):
    id: int | None = None
    dataset_id: int
    row_count: int
    column_count: int
    memory_bytes: int = 0
    memory_mb: float = 0.0
    columns: list[ColumnProfile] = Field(default_factory=list)
    numeric_columns: list[str] = Field(default_factory=list)
    categorical_columns: list[str] = Field(default_factory=list)
    date_columns: list[str] = Field(default_factory=list)
    missing_count: int = 0
    duplicate_count: int = 0
    possible_primary_keys: list[str] = Field(default_factory=list)
    profile_data: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime | None = None

    model_config = {"from_attributes": True}
