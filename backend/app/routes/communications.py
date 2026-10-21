from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import client_ip, get_current_user, require_manager
from app.exceptions import NotFoundError
from app.models.client_communication import ClientCommunication
from app.models.project import Project
from app.models.user import User
from app.schemas.communication_schema import (
    ClientCommunicationOut,
    EmailDraftRequest,
    EmailDraftResponse,
    SendEmailRequest,
)
from app.services.audit_service import log_action
from app.services.gmail_service import (
    generate_email_draft,
    send_client_email,
    serialize_communication,
)

router = APIRouter(prefix="/communications", tags=["communications"])


@router.post("/draft", response_model=EmailDraftResponse)
def get_communication_draft(
    data: EmailDraftRequest,
    user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    project = db.get(Project, data.project_id)
    if not project:
        raise NotFoundError("Project not found.")

    return generate_email_draft(
        db=db,
        project=project,
        manager=user,
        communication_type=data.communication_type,
        report_id=data.report_id,
        presentation_id=data.presentation_id,
    )


@router.post("/send", response_model=ClientCommunicationOut)
def send_communication(
    data: SendEmailRequest,
    request: Request,
    user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    project = db.get(Project, data.project_id)
    if not project:
        raise NotFoundError("Project not found.")

    comm = send_client_email(
        db=db,
        project=project,
        manager=user,
        to_email=str(data.to_email),
        client_name=data.client_name,
        subject=data.subject,
        body_text=data.body_text,
        communication_type=data.communication_type,
        report_id=data.report_id,
        presentation_id=data.presentation_id,
    )
    log_action(
        db,
        "CLIENT_COMMUNICATION",
        f"Manager dispatched {data.communication_type} email to {data.to_email} (Status: {comm.status}).",
        user.id,
        "communication",
        comm.id,
        client_ip(request),
    )
    db.commit()
    db.refresh(comm)
    return serialize_communication(comm, db)


@router.get("/project/{project_id}", response_model=list[ClientCommunicationOut])
def list_project_communications(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    comms = (
        db.query(ClientCommunication)
        .filter(ClientCommunication.project_id == project_id)
        .order_by(ClientCommunication.created_at.desc())
        .all()
    )
    return [serialize_communication(c, db) for c in comms]


@router.get("", response_model=list[ClientCommunicationOut])
def list_all_communications(
    user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    comms = (
        db.query(ClientCommunication)
        .filter(ClientCommunication.manager_id == user.id)
        .order_by(ClientCommunication.created_at.desc())
        .all()
    )
    return [serialize_communication(c, db) for c in comms]
