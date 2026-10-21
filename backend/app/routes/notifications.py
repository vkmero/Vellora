from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.exceptions import NotFoundError
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification_schema import NotificationOut
from app.utils.helpers import paginate

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
def list_notifications(
    page: int = 1,
    page_size: int = 20,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Notification).filter(Notification.user_id == user.id).order_by(Notification.created_at.desc())
    result = paginate(query, page, page_size)
    unread = db.query(Notification).filter(Notification.user_id == user.id, Notification.is_read.is_(False)).count()
    result["unread"] = unread
    return result


@router.patch("/read-all")
def read_all(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.user_id == user.id, Notification.is_read.is_(False)).update(
        {Notification.is_read: True}
    )
    db.commit()
    return {"message": "All notifications marked as read."}


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def read_one(notification_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.get(Notification, notification_id)
    if not item or item.user_id != user.id:
        raise NotFoundError("Notification not found.")
    item.is_read = True
    db.commit()
    db.refresh(item)
    return item
