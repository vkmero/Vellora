from datetime import datetime
from pydantic import BaseModel


class PresentationGenerateRequest(BaseModel):
    dataset_id: int
    project_id: int | None = None
    slide_theme: str | None = "bright_glass"
    custom_title: str | None = None


class PresentationOut(BaseModel):
    id: int
    project_id: int | None = None
    dataset_id: int
    title: str
    slide_count: int
    file_path: str
    generated_by: int
    generator_name: str | None = None
    delivered_to_manager_id: int | None = None
    delivery_status: str
    created_at: datetime

    model_config = {"from_attributes": True}
