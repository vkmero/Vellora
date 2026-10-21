from datetime import datetime
from pydantic import BaseModel, Field


class ManagerAccessRequestCreate(BaseModel):
    organization_or_team: str | None = Field(default=None, max_length=255)
    reason: str = Field(min_length=10, max_length=2000)


class ManagerAccessRequestReview(BaseModel):
    status: str = Field(description="Must be 'approved', 'rejected', or 'changes_requested'")
    admin_notes: str | None = Field(default=None, max_length=2000)


class ManagerAccessRequestOut(BaseModel):
    id: int
    user_id: int
    user_name: str | None = None
    user_email: str | None = None
    organization_or_team: str | None = None
    reason: str
    status: str
    reviewed_by: int | None = None
    reviewer_name: str | None = None
    admin_notes: str | None = None
    created_at: datetime
    reviewed_at: datetime | None = None

    class Config:
        from_attributes = True
