import base64
import os
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.exceptions import BadRequestError, NotFoundError
from app.models.client_communication import ClientCommunication
from app.models.presentation import Presentation
from app.models.project import Project
from app.models.report import Report
from app.models.user import User
from app.schemas.communication_schema import ClientCommunicationOut, EmailDraftResponse
from app.utils.helpers import utcnow


def serialize_communication(item: ClientCommunication, db: Session) -> ClientCommunicationOut:
    manager = db.get(User, item.manager_id) if item.manager_id else None
    return ClientCommunicationOut(
        id=item.id,
        project_id=item.project_id,
        manager_id=item.manager_id,
        manager_name=manager.name if manager else None,
        client_name=item.client_name,
        client_email=item.client_email,
        subject=item.subject,
        body_text=item.body_text,
        communication_type=item.communication_type,
        report_id=item.report_id,
        presentation_id=item.presentation_id,
        status=item.status,
        gmail_message_id=item.gmail_message_id,
        error_message=item.error_message,
        sent_at=item.sent_at,
        created_at=item.created_at,
    )


def generate_email_draft(
    db: Session,
    project: Project,
    manager: User,
    communication_type: str = "progress_update",
    report_id: int | None = None,
    presentation_id: int | None = None,
) -> EmailDraftResponse:
    client_name = project.client_name or "Client Stakeholder"
    client_email = project.client_email or ""
    project_name = project.name
    obj = project.business_objective or "Data Quality & Strategic Intelligence"

    report_record = db.get(Report, report_id) if report_id else None
    presentation_record = db.get(Presentation, presentation_id) if presentation_id else None

    report_name = f"Deliverable Report (#{report_record.id} - {report_record.report_type.upper()})" if report_record else None
    presentation_name = f"Deliverable Presentation (#{presentation_record.id} - {presentation_record.title})" if presentation_record else None

    if communication_type == "final_delivery":
        subject = f"[Final Deliverables] {project_name} — Data Quality & Analytics Report"
        body = f"""Dear {client_name},

I am pleased to deliver the final analytics and data intelligence deliverables for project "{project_name}".

Executive Mandate: {obj}

Key Milestones Achieved:
• Dataset ingestion, schema validation, and health verification completed.
• Comprehensive anomaly detection and deterministic data cleaning executed.
• Exploratory data analysis (EDA), correlation discovery, and automated insights finalized.
• Executive review and manager governance approval passed.

Deliverable Attachments Included:
{f"- Report: {report_name}" if report_name else "- Comprehensive Quality & Analytics Report"}
{f"- Presentation: {presentation_name}" if presentation_name else "- Executive Strategic Pitch Deck (12 slides)"}

We welcome the opportunity to review these findings with your team at your earliest convenience.

Warm regards,

{manager.name}
Lead Project Manager, Vellora Intelligence
Email: {manager.email}
"""
    else:  # progress_update or custom
        subject = f"[Progress Update] {project_name} — Milestone Analysis & Insights"
        body = f"""Dear {client_name},

I am writing to share a progress update regarding our data intelligence engagement for "{project_name}".

Current Project Status:
Our team has completed data ingestion and quality validation. The dataset has undergone multi-dimensional health profiling, anomaly resolution, and exploratory statistical analysis.

Highlights of Recent Work:
• Data quality score has been verified and elevated through our automated pipeline.
• Preliminary correlation mapping and business insights have been generated.
• Key operational indicators have been structured into presentation-ready deliverables.

{f"Attached Document: {report_name}" if report_name else ""}
{f"Attached Presentation: {presentation_name}" if presentation_name else ""}

Please let us know if you have any questions or specific focus areas you would like emphasized in our next phase.

Best regards,

{manager.name}
Lead Project Manager, Vellora Intelligence
Email: {manager.email}
"""

    return EmailDraftResponse(
        subject=subject,
        body_text=body,
        recipient_email=client_email,
        recipient_name=client_name,
        report_name=report_name,
        presentation_name=presentation_name,
    )


def send_client_email(
    db: Session,
    project: Project,
    manager: User,
    to_email: str,
    subject: str,
    body_text: str,
    communication_type: str = "progress_update",
    client_name: str | None = None,
    report_id: int | None = None,
    presentation_id: int | None = None,
) -> ClientCommunication:
    client_name_val = client_name or project.client_name or "Client Stakeholder"

    report_record = db.get(Report, report_id) if report_id else None
    presentation_record = db.get(Presentation, presentation_id) if presentation_id else None

    # Verify attachment files exist on disk if specified
    attachment_paths = []
    if report_record and report_record.file_path and Path(report_record.file_path).exists():
        attachment_paths.append(Path(report_record.file_path))
    if presentation_record and presentation_record.file_path and Path(presentation_record.file_path).exists():
        attachment_paths.append(Path(presentation_record.file_path))

    # Initialize log entry
    comm = ClientCommunication(
        project_id=project.id,
        manager_id=manager.id,
        client_name=client_name_val,
        client_email=to_email,
        subject=subject,
        body_text=body_text,
        communication_type=communication_type,
        report_id=report_id,
        presentation_id=presentation_id,
        status="draft",
    )
    db.add(comm)
    db.flush()

    # Attempt to send via Google Gmail API or configured credentials
    gmail_token_file = os.getenv("GMAIL_TOKEN_FILE", "token.json")
    gmail_credentials_file = os.getenv("GMAIL_CREDENTIALS_FILE", "credentials.json")

    gmail_service = None
    try:
        if Path(gmail_token_file).exists():
            from google.oauth2.credentials import Credentials
            from googleapiclient.discovery import build

            creds = Credentials.from_authorized_user_file(gmail_token_file, ["https://www.googleapis.com/auth/gmail.send"])
            gmail_service = build("gmail", "v1", credentials=creds)
    except Exception as e:
        gmail_service = None

    if gmail_service:
        try:
            # Construct MIME message
            msg = MIMEMultipart()
            msg["to"] = to_email
            msg["subject"] = subject
            msg["from"] = manager.email

            msg.attach(MIMEText(body_text, "plain"))

            for a_path in attachment_paths:
                with open(a_path, "rb") as f:
                    part = MIMEApplication(f.read(), Name=a_path.name)
                    part["Content-Disposition"] = f'attachment; filename="{a_path.name}"'
                    msg.attach(part)

            raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
            sent_resp = gmail_service.users().messages().send(userId="me", body={"raw": raw}).execute()

            comm.status = "sent"
            comm.gmail_message_id = sent_resp.get("id")
            comm.sent_at = utcnow()
            comm.error_message = None
        except Exception as err:
            comm.status = "failed"
            comm.error_message = f"Gmail API error: {str(err)}"
    else:
        # Check SMTP settings as secondary real mail option
        smtp_host = os.getenv("SMTP_HOST")
        smtp_user = os.getenv("SMTP_USER")
        smtp_pass = os.getenv("SMTP_PASSWORD")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))

        if smtp_host and smtp_user and smtp_pass:
            import smtplib
            try:
                msg = MIMEMultipart()
                msg["to"] = to_email
                msg["subject"] = subject
                msg["from"] = smtp_user
                msg.attach(MIMEText(body_text, "plain"))
                for a_path in attachment_paths:
                    with open(a_path, "rb") as f:
                        part = MIMEApplication(f.read(), Name=a_path.name)
                        part["Content-Disposition"] = f'attachment; filename="{a_path.name}"'
                        msg.attach(part)

                with smtplib.SMTP(smtp_host, smtp_port) as server:
                    server.starttls()
                    server.login(smtp_user, smtp_pass)
                    server.send_message(msg)

                comm.status = "sent"
                comm.gmail_message_id = f"smtp-{utcnow().timestamp()}"
                comm.sent_at = utcnow()
                comm.error_message = None
            except Exception as serr:
                comm.status = "failed"
                comm.error_message = f"SMTP transmission failed: {str(serr)}"
        else:
            # Neither Gmail API credentials nor SMTP configured
            # Record clearly as draft with explicit instructions so user can configure credentials
            comm.status = "draft"
            comm.error_message = (
                "Gmail API credentials (token.json/credentials.json) or SMTP credentials not configured in backend/.env. "
                "The email has been prepared and recorded as a draft."
            )

    db.flush()
    return comm
