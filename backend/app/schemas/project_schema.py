from datetime import datetime
from pydantic import BaseModel, EmailStr


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None
    business_objective: str | None = None
    client_name: str | None = None
    client_email: EmailStr | str | None = None
    assigned_manager_id: int | None = None
    approval_policy: str = "optional"  # "mandatory" | "optional" | "none"


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    business_objective: str | None = None
    client_name: str | None = None
    client_email: EmailStr | str | None = None
    assigned_manager_id: int | None = None
    approval_policy: str | None = None
    status: str | None = None  # "draft" | "active" | "completed" | "archived"


class ProjectOut(BaseModel):
    id: int
    name: str
    description: str | None = None
    business_objective: str | None = None
    client_name: str | None = None
    client_email: str | None = None
    assigned_analyst_id: int | None = None
    assigned_manager_id: int | None = None
    status: str
    approval_policy: str
    created_at: datetime
    updated_at: datetime

    assigned_analyst_name: str | None = None
    assigned_manager_name: str | None = None
    dataset_count: int = 0

    model_config = {"from_attributes": True}
