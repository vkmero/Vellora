from datetime import datetime
from pydantic import BaseModel, EmailStr


class EmailDraftRequest(BaseModel):
    project_id: int
    report_id: int | None = None
    presentation_id: int | None = None
    communication_type: str = "progress_update"  # "progress_update" | "final_delivery" | "custom"


class EmailDraftResponse(BaseModel):
    subject: str
    body_text: str
    recipient_email: str | None = None
    recipient_name: str | None = None
    report_name: str | None = None
    presentation_name: str | None = None


class SendEmailRequest(BaseModel):
    project_id: int
    to_email: EmailStr | str
    client_name: str | None = None
    subject: str
    body_text: str
    communication_type: str = "progress_update"
    report_id: int | None = None
    presentation_id: int | None = None


class ClientCommunicationOut(BaseModel):
    id: int
    project_id: int
    manager_id: int
    manager_name: str | None = None
    client_name: str
    client_email: str
    subject: str
    body_text: str
    communication_type: str
    report_id: int | None = None
    presentation_id: int | None = None
    status: str
    gmail_message_id: str | None = None
    error_message: str | None = None
    sent_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
