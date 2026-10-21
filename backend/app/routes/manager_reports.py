from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.dependencies import client_ip, require_manager
from app.models.report import Report
from app.models.user import User
from app.schemas.report_schema import ReportOut, ReportReviewRequest
from app.services.audit_service import log_action
from app.services.report_service import review_report, serialize_report

router = APIRouter(prefix="/manager/reports", tags=["manager_reports"])


@router.get("/received")
def get_received_reports(
    user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    query = db.query(Report).filter(
        or_(
            Report.delivered_to_manager_id == user.id,
            Report.delivered_to_manager_id.is_(None),
            Report.delivery_status == "delivered",
        )
    ).order_by(Report.delivered_at.desc(), Report.created_at.desc())

    reports = query.all()
    return [serialize_report(r, db) for r in reports]


@router.post("/{report_id}/review", response_model=ReportOut)
def submit_report_review(
    report_id: int,
    data: ReportReviewRequest,
    request: Request,
    user: User = Depends(require_manager),
    db: Session = Depends(get_db),
):
    record = review_report(db, report_id, user, data.review_status, data.feedback)
    log_action(
        db,
        "REPORT_REVIEW",
        f"Manager {user.name} reviewed deliverable report #{report_id} ({data.review_status}).",
        user.id,
        "report",
        report_id,
        client_ip(request),
    )
    db.commit()
    db.refresh(record)
    return serialize_report(record, db)
