from datetime import datetime
from pydantic import BaseModel


class VisualizationRequest(BaseModel):
    chart_type: str
    x_column: str | None = None
    y_column: str | None = None
    category: str | None = None
    aggregation: str | None = "sum"
    title: str | None = None
    group_by: str | None = None
    sort_by: str | None = "val_desc"
    time_bucket: str | None = "month"
    filters: list[dict] | None = None


class VisualizationOut(BaseModel):
    id: int
    dataset_id: int
    chart_type: str
    x_column: str | None
    y_column: str | None
    configuration: dict | None
    created_by: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ChartRecommendation(BaseModel):
    id: str
    title: str
    category: str
    chart_type: str
    x_column: str | None
    y_column: str | None
    aggregation: str | None
    reason: str
    interpretation: str


class ColumnMeta(BaseModel):
    name: str
    kind: str
    is_identifier: bool
    cardinality: int
    null_count: int
    null_pct: float
    sample_values: list[str]
    min: float | str | None = None
    max: float | str | None = None


class DatasetColumnsMetaOut(BaseModel):
    columns: list[ColumnMeta]
    numeric_columns: list[str]
    categorical_columns: list[str]
    date_columns: list[str]
    boolean_columns: list[str]
    id_columns: list[str]
    row_count: int
    column_count: int
    memory_bytes: int
