import logging
import smtplib
from email.message import EmailMessage

from sqlalchemy.orm import Session

from app.config import settings
from app.models.notification import Notification
from app.models.user import User

logger = logging.getLogger("vellora.email")


def notify(db: Session, user_id: int, title: str, message: str, ntype: str) -> Notification:
    item = Notification(user_id=user_id, title=title, message=message, type=ntype)
    db.add(item)
    db.flush()
    user = db.get(User, user_id)
    if user:
        send_email(user.email, title, message)
    return item


def send_email(to_address: str, subject: str, body: str) -> dict:
    if not settings.SMTP_HOST:
        logger.info("SMTP not configured. Dev email skipped. to=%s subject=%s", to_address, subject)
        return {"delivered": False, "mode": "development_log"}
    try:
        message = EmailMessage()
        message["From"] = settings.SMTP_FROM or "vellora@localhost"
        message["To"] = to_address
        message["Subject"] = subject
        message.set_content(body)
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.starttls()
            if settings.SMTP_USERNAME:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(message)
        return {"delivered": True, "mode": "smtp"}
    except Exception:
        logger.warning("Email delivery failed for %s", to_address)
        return {"delivered": False, "mode": "failed"}
