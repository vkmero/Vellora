from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import client_ip, get_current_user, get_dataset_for_user, require_manager
from app.exceptions import BadRequestError, ConflictError, ForbiddenError, NotFoundError
from app.models.approval import Approval
from app.models.dataset import Dataset
from app.models.user import User
from app.schemas.approval_schema import ApprovalDecision, ApprovalOut, RejectDecision
from app.services.audit_service import log_action
from app.services.notification_service import notify
from app.utils.helpers import paginate, utcnow

router = APIRouter(tags=["approvals"])


def serialize(item: Approval, db: Session) -> ApprovalOut:
    dataset = db.get(Dataset, item.dataset_id)
    requester = db.get(User, item.requested_by)
    return ApprovalOut.model_validate(item).model_copy(
        update={
            "dataset_name": dataset.name if dataset else None,
            "requester_name": requester.name if requester else None,
            "quality_score": dataset.quality_score if dataset else None,
        }
    )


@router.post("/datasets/{dataset_id}/submit-approval", response_model=ApprovalOut)
def submit_approval(
    dataset_id: int,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset = get_dataset_for_user(dataset_id, user, db)

    existing_pending = (
        db.query(Approval)
        .filter(Approval.dataset_id == dataset.id, Approval.status == "pending")
        .first()
    )
    if existing_pending:
        raise ConflictError("An approval request is already pending for this dataset.")

    if dataset.status not in {"cleaned", "changes_requested", "quality_checked", "validated"}:
        raise BadRequestError("Assess and clean/validate the dataset before submitting it for approval.")

    approval = Approval(dataset_id=dataset.id, requested_by=user.id, status="pending")
    dataset.status = "pending_approval"
    db.add(approval)
    db.flush()
    log_action(db, "SUBMIT_APPROVAL", f"Submitted {dataset.name} for approval.", user.id, "dataset", dataset.id, client_ip(request))
    managers = db.query(User).filter(User.role.in_(["manager", "admin"]), User.is_active.is_(True)).all()
    for manager in managers:
        notify(db, manager.id, "Approval requested", f"{user.name} submitted {dataset.name} for approval.", "approval_requested")
    db.commit()
    db.refresh(approval)
    return serialize(approval, db)


@router.get("/approvals/pending")
def pending_approvals(
    page: int = 1,
    page_size: int = 12,
    user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    query = db.query(Approval).filter(Approval.status == "pending").order_by(Approval.requested_at.desc())
    result = paginate(query, page, page_size)
    result["items"] = [serialize(item, db) for item in result["items"]]
    return result


@router.get("/approvals/{approval_id}", response_model=ApprovalOut)
def get_approval(approval_id: int, user: User = Depends(require_manager), db: Session = Depends(get_db)):
    item = db.get(Approval, approval_id)
    if not item:
        raise NotFoundError("Approval not found.")
    return serialize(item, db)


def _decide(db, approval_id, user, status, comments, action, request):
    item = db.get(Approval, approval_id)
    if not item:
        raise NotFoundError("Approval not found.")
    if item.status != "pending":
        raise BadRequestError("This approval has already been reviewed.")
    if item.requested_by == user.id:
        raise ForbiddenError("Self-approval is forbidden. Another manager or admin must review this submission.")

    dataset = db.get(Dataset, item.dataset_id)
    item.status = status
    item.comments = comments
    item.reviewed_by = user.id
    item.reviewed_at = utcnow()
    mapping = {"approved": "approved", "rejected": "rejected", "changes_requested": "changes_requested"}
    dataset.status = mapping[status]
    log_action(db, action, f"{action.replace('_', ' ').title()} on {dataset.name}.", user.id, "dataset", dataset.id, client_ip(request))
    titles = {
        "APPROVE_DATASET": ("Dataset approved", "Your dataset was approved. Next: run revalidation, then analytics."),
        "REJECT_DATASET": ("Dataset rejected", comments or "The dataset was rejected."),
        "REQUEST_CHANGES": ("Changes requested", comments or "Please revise the cleaning and resubmit."),
    }
    title, message = titles[action]
    notify(db, item.requested_by, title, message, status)
    db.commit()
    db.refresh(item)
    return serialize(item, db)


@router.post("/approvals/{approval_id}/approve", response_model=ApprovalOut)
def approve(approval_id: int, payload: ApprovalDecision, request: Request, user: User = Depends(require_manager), db: Session = Depends(get_db)):
    return _decide(db, approval_id, user, "approved", payload.comments, "APPROVE_DATASET", request)


@router.post("/approvals/{approval_id}/reject", response_model=ApprovalOut)
def reject(approval_id: int, payload: RejectDecision, request: Request, user: User = Depends(require_manager), db: Session = Depends(get_db)):
    return _decide(db, approval_id, user, "rejected", payload.comments, "REJECT_DATASET", request)


@router.post("/approvals/{approval_id}/request-changes", response_model=ApprovalOut)
def request_changes(approval_id: int, payload: RejectDecision, request: Request, user: User = Depends(require_manager), db: Session = Depends(get_db)):
    return _decide(db, approval_id, user, "changes_requested", payload.comments, "REQUEST_CHANGES", request)
