from fastapi import APIRouter, Depends, Request
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import client_ip, require_admin
from app.exceptions import BadRequestError, ForbiddenError, NotFoundError
from app.models.analysis import Analysis
from app.models.audit_log import AuditLog
from app.models.dataset import Dataset
from app.models.manager_request import ManagerAccessRequest
from app.models.notification import Notification
from app.models.user import User
from app.schemas.manager_request_schema import ManagerAccessRequestReview
from app.schemas.user_schema import AdminUserUpdate, UserOut
from app.services.audit_service import log_action
from app.utils.helpers import paginate, utcnow

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users")
def list_users(
    q: str | None = None,
    role: str | None = None,
    is_active: bool | None = None,
    page: int = 1,
    page_size: int = 12,
    user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if q:
        query = query.filter((User.name.ilike(f"%{q}%")) | (User.email.ilike(f"%{q}%")))
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active.is_(is_active))
    return paginate(query.order_by(User.created_at.desc()), page, page_size)


@router.get("/users/{user_id}", response_model=UserOut)
def user_details(user_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise NotFoundError("User not found.")
    return user


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    request: Request,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.get(User, user_id)
    if not user:
        raise NotFoundError("User not found.")
    if payload.role and payload.role not in {"analyst", "manager", "admin"}:
        raise BadRequestError("Invalid role.")
    if payload.name:
        user.name = payload.name
    if payload.role and payload.role != user.role:
        log_action(db, "CHANGE_ROLE", f"Changed {user.email} role to {payload.role}.", admin.id, "user", user.id, client_ip(request))
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active
    user.updated_at = utcnow()
    log_action(db, "UPDATE_USER", f"Updated user {user.email}.", admin.id, "user", user.id, client_ip(request))
    db.commit()
    db.refresh(user)
    return user


@router.get("/datasets")
def all_datasets(
    q: str | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 12,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(Dataset)
    if q:
        query = query.filter(Dataset.name.ilike(f"%{q}%"))
    if status:
        query = query.filter(Dataset.status == status)
    return paginate(query.order_by(Dataset.created_at.desc()), page, page_size)


@router.get("/audit-logs")
def audit_logs(
    q: str | None = None,
    action: str | None = None,
    user_id: int | None = None,
    entity_type: str | None = None,
    page: int = 1,
    page_size: int = 20,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(AuditLog)
    if q:
        query = query.filter(AuditLog.description.ilike(f"%{q}%"))
    if action:
        query = query.filter(AuditLog.action == action)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    return paginate(query.order_by(AuditLog.timestamp.desc()), page, page_size)


@router.get("/system-stats")
def system_stats(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    def role_count(role):
        return db.query(User).filter(User.role == role).count()

    avg = db.query(func.avg(Dataset.quality_score)).scalar()
    pending_mgr_reqs = (
        db.query(ManagerAccessRequest)
        .filter(ManagerAccessRequest.status == "pending")
        .count()
    )
    return {
        "total_users": db.query(User).count(),
        "analysts": role_count("analyst"),
        "managers": role_count("manager"),
        "admins": role_count("admin"),
        "total_datasets": db.query(Dataset).count(),
        "total_analyses": db.query(Analysis).count(),
        "average_quality": round(float(avg), 2) if avg is not None else None,
        "system_activity": db.query(AuditLog).count(),
        "pending_manager_requests": pending_mgr_reqs,
    }


@router.get("/manager-requests")
def list_manager_requests(
    status: str | None = None,
    page: int = 1,
    page_size: int = 15,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Lists submitted Manager access requests with filtering and requester metadata."""
    query = db.query(ManagerAccessRequest)
    if status:
        query = query.filter(ManagerAccessRequest.status == status)

    paginated = paginate(query.order_by(ManagerAccessRequest.created_at.desc()), page, page_size)
    items_out = []
    for req in paginated["items"]:
        requester = db.get(User, req.user_id)
        reviewer = db.get(User, req.reviewed_by) if req.reviewed_by else None
        items_out.append(
            {
                "id": req.id,
                "user_id": req.user_id,
                "user_name": requester.name if requester else "Unknown",
                "user_email": requester.email if requester else "Unknown",
                "organization_or_team": req.organization_or_team,
                "reason": req.reason,
                "status": req.status,
                "reviewed_by": req.reviewed_by,
                "reviewer_name": reviewer.name if reviewer else None,
                "admin_notes": req.admin_notes,
                "created_at": req.created_at.isoformat() if req.created_at else None,
                "reviewed_at": req.reviewed_at.isoformat() if req.reviewed_at else None,
            }
        )
    paginated["items"] = items_out
    return paginated


@router.post("/manager-requests/{request_id}/review")
def review_manager_request(
    request_id: int,
    payload: ManagerAccessRequestReview,
    request: Request,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Reviews a Manager access request. Requester cannot approve their own request."""
    req = db.get(ManagerAccessRequest, request_id)
    if not req:
        raise NotFoundError("Manager access request not found.")

    if payload.status not in {"approved", "rejected", "changes_requested"}:
        raise BadRequestError("Decision status must be 'approved', 'rejected', or 'changes_requested'.")

    # Anti-self-approval rule
    if req.user_id == admin.id:
        raise ForbiddenError("Administrators cannot review or approve their own access requests.")

    target_user = db.get(User, req.user_id)
    if not target_user:
        raise NotFoundError("The user associated with this request no longer exists.")

    req.status = payload.status
    req.reviewed_by = admin.id
    req.admin_notes = payload.admin_notes
    req.reviewed_at = utcnow()
    req.updated_at = utcnow()

    if payload.status == "approved":
        target_user.role = "manager"
        target_user.updated_at = utcnow()
        notification_msg = (
            "Congratulations! Your request for Manager governance access has been approved. "
            "You now have access to Manager project governance, approval gates, and client communication."
        )
        if payload.admin_notes:
            notification_msg += f" Note: {payload.admin_notes}"
        db.add(
            Notification(
                user_id=target_user.id,
                title="Manager Access Approved",
                message=notification_msg,
                type="role_upgrade",
            )
        )
        log_action(
            db,
            "APPROVE_MANAGER_ACCESS",
            f"Admin {admin.email} approved Manager access for {target_user.email}.",
            admin.id,
            "manager_access_request",
            req.id,
            client_ip(request),
        )
    elif payload.status == "rejected":
        notification_msg = (
            "Your request for Manager governance access was not approved at this time. "
            "You retain full Analyst capabilities."
        )
        if payload.admin_notes:
            notification_msg += f" Reason: {payload.admin_notes}"
        db.add(
            Notification(
                user_id=target_user.id,
                title="Manager Access Request Update",
                message=notification_msg,
                type="role_request_rejected",
            )
        )
        log_action(
            db,
            "REJECT_MANAGER_ACCESS",
            f"Admin {admin.email} rejected Manager access for {target_user.email}.",
            admin.id,
            "manager_access_request",
            req.id,
            client_ip(request),
        )
    else:  # changes_requested
        notification_msg = "Additional information was requested regarding your Manager access application."
        if payload.admin_notes:
            notification_msg += f" Note: {payload.admin_notes}"
        db.add(
            Notification(
                user_id=target_user.id,
                title="Manager Access — Clarification Requested",
                message=notification_msg,
                type="role_request_changes",
            )
        )
        log_action(
            db,
            "REQUEST_CHANGES_MANAGER_ACCESS",
            f"Admin {admin.email} requested changes for {target_user.email}'s Manager access application.",
            admin.id,
            "manager_access_request",
            req.id,
            client_ip(request),
        )

    db.commit()
    db.refresh(req)

    return {
        "id": req.id,
        "status": req.status,
        "reviewed_by": admin.id,
        "reviewed_at": req.reviewed_at.isoformat() if req.reviewed_at else None,
        "admin_notes": req.admin_notes,
        "message": f"Manager access request #{req.id} marked as '{req.status}'.",
    }

