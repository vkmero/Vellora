import secrets
from datetime import timedelta

from sqlalchemy.orm import Session

from app.config import settings
from app.exceptions import BadRequestError, ConflictError, UnauthorizedError
from app.models.user import User
from app.security import create_access_token, hash_password, hash_token, verify_password
from app.services.audit_service import log_action
from app.services.notification_service import send_email
from app.utils.helpers import utcnow
from app.utils.validators import ensure_strong_password


def register_user(db: Session, name: str, email: str, password: str, confirm: str, ip: str | None) -> User:
    if password != confirm:
        raise BadRequestError("Passwords do not match.")
    ensure_strong_password(password)
    existing = db.query(User).filter(User.email == email.lower()).first()
    if existing:
        raise ConflictError("An account with this email already exists.")
    user = User(
        name=name.strip(),
        email=email.lower(),
        password_hash=hash_password(password),
        role="analyst",
        is_active=True,
    )
    db.add(user)
    db.flush()
    log_action(db, "REGISTER", f"User {user.email} registered.", user.id, "user", user.id, ip)
    db.commit()
    db.refresh(user)
    return user


def authenticate(db: Session, email: str, password: str, ip: str | None) -> tuple[User, str]:
    user = db.query(User).filter(User.email == email.lower()).first()
    if not user or not verify_password(password, user.password_hash):
        raise UnauthorizedError("Invalid email or password.")
    if not user.is_active:
        raise UnauthorizedError("This account is inactive. Contact an administrator.")
    user.last_login = utcnow()
    token = create_access_token(str(user.id), user.role)
    log_action(db, "LOGIN", f"User {user.email} signed in.", user.id, "user", user.id, ip)
    db.commit()
    return user, token


def request_password_reset(db: Session, email: str) -> dict:
    user = db.query(User).filter(User.email == email.lower()).first()
    message = "If an account exists for that email, a reset link has been prepared."
    if not user or not user.is_active:
        return {"message": message, "reset_url": None, "email_mode": "hidden"}
    raw = secrets.token_urlsafe(32)
    user.reset_token_hash = hash_token(raw)
    user.reset_token_expires = utcnow() + timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES)
    db.commit()
    reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={raw}"
    delivery = send_email(
        user.email,
        "Reset your Vellora password",
        f"Use this link to reset your password. It expires in {settings.RESET_TOKEN_EXPIRE_MINUTES} minutes.\n\n{reset_url}",
    )
    payload = {"message": message, "email_mode": delivery.get("mode")}
    if not delivery.get("delivered") and not settings.is_production:
        payload["reset_url"] = reset_url
    return payload


def reset_password(db: Session, token: str, password: str, confirm: str) -> None:
    if password != confirm:
        raise BadRequestError("Passwords do not match.")
    ensure_strong_password(password)
    hashed = hash_token(token)
    user = db.query(User).filter(User.reset_token_hash == hashed).first()
    if not user or not user.reset_token_expires or user.reset_token_expires < utcnow():
        raise BadRequestError("This reset link is invalid or has expired.")
    user.password_hash = hash_password(password)
    user.reset_token_hash = None
    user.reset_token_expires = None
    db.commit()


def oauth_authenticate_or_create(db: Session, email: str, name: str, provider: str, ip: str | None) -> tuple[User, str]:
    """Authenticates existing user by email or provisions a new standard Analyst account.
    Never assigns Admin role, preventing privilege escalation.
    """
    clean_email = email.strip().lower()
    user = db.query(User).filter(User.email == clean_email).first()
    if user:
        if not user.is_active:
            raise UnauthorizedError("This account is inactive. Contact an administrator.")
        user.last_login = utcnow()
        log_action(db, "OAUTH_LOGIN", f"User {user.email} signed in via {provider.capitalize()} OAuth.", user.id, "user", user.id, ip)
    else:
        user = User(
            name=name.strip() if name and name.strip() else f"{provider.capitalize()} User",
            email=clean_email,
            password_hash=hash_password(secrets.token_urlsafe(32)),
            role="analyst",
            is_active=True,
        )
        db.add(user)
        db.flush()
        log_action(db, "OAUTH_REGISTER", f"User {user.email} provisioned via {provider.capitalize()} OAuth.", user.id, "user", user.id, ip)

    db.commit()
    db.refresh(user)
    token = create_access_token(str(user.id), user.role)
    return user, token

