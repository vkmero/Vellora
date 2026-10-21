from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import ExpiredSignatureError, InvalidTokenError
from sqlalchemy.orm import Session

from app.database import get_db
from app.exceptions import ForbiddenError, NotFoundError, UnauthorizedError
from app.models.dataset import Dataset
from app.models.user import User
from app.security import decode_access_token

bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise UnauthorizedError()
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = int(payload.get("sub"))
    except ExpiredSignatureError:
        raise UnauthorizedError("Your session has expired. Please sign in again.")
    except (InvalidTokenError, ValueError, TypeError):
        raise UnauthorizedError("Invalid authentication token.")
    user = db.get(User, user_id)
    if not user:
        raise UnauthorizedError("User not found.")
    if not user.is_active:
        raise UnauthorizedError("This account is inactive.")
    return user


def require_roles(*roles: str):
    def _inner(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise ForbiddenError()
        return user

    return _inner


def require_analyst(user: User = Depends(get_current_user)) -> User:
    if user.role not in {"analyst", "manager", "admin"}:
        raise ForbiddenError()
    return user


def require_manager(user: User = Depends(get_current_user)) -> User:
    if user.role not in {"manager", "admin"}:
        raise ForbiddenError("Manager access is required.")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise ForbiddenError("Administrator access is required.")
    return user


def get_dataset_for_user(dataset_id: int, user: User, db: Session) -> Dataset:
    dataset = db.get(Dataset, dataset_id)
    if not dataset:
        raise NotFoundError("Dataset not found.")
    if user.role == "analyst" and dataset.owner_id != user.id:
        raise ForbiddenError("You can only access datasets you own.")
    return dataset


def client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None
