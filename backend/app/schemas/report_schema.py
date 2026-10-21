from datetime import datetime
from pydantic import BaseModel


class ReportRequest(BaseModel):
    report_type: str
    format: str = "pdf"


class ReportReviewRequest(BaseModel):
    review_status: str  # "approved" | "feedback_requested"
    feedback: str


class ReportOut(BaseModel):
    id: int
    project_id: int | None = None
    dataset_id: int
    report_type: str
    format: str
    file_path: str
    generated_by: int
    delivered_to_manager_id: int | None = None
    delivery_status: str
    delivered_at: datetime | None = None
    delivery_error: str | None = None
    manager_review_status: str
    manager_feedback: str | None = None
    reviewed_at: datetime | None = None
    created_at: datetime

    dataset_name: str | None = None
    generator_name: str | None = None
    reviewer_name: str | None = None

    model_config = {"from_attributes": True}
