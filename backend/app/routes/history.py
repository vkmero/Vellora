from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, get_dataset_for_user
from app.models.audit_log import AuditLog
from app.models.user import User

router = APIRouter(tags=["history"])


@router.get("/datasets/{dataset_id}/history")
def dataset_history(dataset_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_dataset_for_user(dataset_id, user, db)
    logs = (
        db.query(AuditLog)
        .filter(AuditLog.entity_type == "dataset", AuditLog.entity_id == dataset_id)
        .order_by(AuditLog.timestamp.asc())
        .all()
    )
    extra = (
        db.query(AuditLog)
        .filter(AuditLog.entity_id.in_([dataset_id]))
        .order_by(AuditLog.timestamp.asc())
        .all()
    )
    seen = set()
    timeline = []
    for item in logs + extra:
        if item.id in seen:
            continue
        seen.add(item.id)
        actor = db.get(User, item.user_id) if item.user_id else None
        timeline.append(
            {
                "id": item.id,
                "action": item.action,
                "description": item.description,
                "timestamp": item.timestamp,
                "user": actor.name if actor else None,
            }
        )
    timeline.sort(key=lambda x: x["timestamp"])
    return timeline
