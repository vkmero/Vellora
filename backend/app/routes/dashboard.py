from datetime import timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_manager
from app.models.analysis import Analysis
from app.models.approval import Approval
from app.models.audit_log import AuditLog
from app.models.dataset import Dataset
from app.models.insight import Insight
from app.models.quality_issue import QualityIssue
from app.models.report import Report
from app.models.user import User
from app.utils.helpers import utcnow

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def _dataset_query(db: Session, user: User):
    query = db.query(Dataset)
    if user.role == "analyst":
        query = query.filter(Dataset.owner_id == user.id)
    return query


@router.get("/stats")
def stats(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    datasets = _dataset_query(db, user)
    total = datasets.count()
    analyzed = datasets.filter(Dataset.status.in_(["analyzed", "validated", "approved"])).count()
    avg_quality = datasets.filter(Dataset.quality_score.isnot(None)).with_entities(func.avg(Dataset.quality_score)).scalar()
    pending = db.query(Approval).filter(Approval.status == "pending")
    if user.role == "analyst":
        pending = pending.filter(Approval.requested_by == user.id)
    reports = db.query(Report)
    if user.role == "analyst":
        reports = reports.filter(Report.generated_by == user.id)
    return {
        "total_datasets": total,
        "analyzed_datasets": analyzed,
        "average_quality": round(float(avg_quality), 2) if avg_quality is not None else None,
        "pending_approvals": pending.count(),
        "completed_reports": reports.count(),
    }


@router.get("/activity")
def activity(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(AuditLog).order_by(AuditLog.timestamp.desc())
    if user.role == "analyst":
        query = query.filter(AuditLog.user_id == user.id)
    items = query.limit(20).all()
    return [
        {
            "id": item.id,
            "action": item.action,
            "description": item.description,
            "timestamp": item.timestamp,
            "entity_type": item.entity_type,
            "entity_id": item.entity_id,
        }
        for item in items
    ]


@router.get("/quality-trend")
def quality_trend(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    since = utcnow() - timedelta(days=30)
    query = _dataset_query(db, user).filter(Dataset.created_at >= since, Dataset.quality_score.isnot(None))
    rows = query.order_by(Dataset.created_at.asc()).all()
    return [{"date": row.created_at.date().isoformat(), "score": row.quality_score, "name": row.name} for row in rows]


@router.get("/issue-distribution")
def issue_distribution(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(QualityIssue.issue_type, func.count(QualityIssue.id))
    if user.role == "analyst":
        owned = db.query(Dataset.id).filter(Dataset.owner_id == user.id)
        query = query.filter(QualityIssue.dataset_id.in_(owned))
    rows = query.group_by(QualityIssue.issue_type).all()
    return [{"type": t, "count": c} for t, c in rows]


@router.get("/recent-insights")
def recent_insights(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Insight).order_by(Insight.created_at.desc())
    if user.role == "analyst":
        owned = db.query(Dataset.id).filter(Dataset.owner_id == user.id)
        query = query.filter(Insight.dataset_id.in_(owned))
    return [
        {"id": i.id, "title": i.title, "severity": i.severity, "dataset_id": i.dataset_id, "created_at": i.created_at}
        for i in query.limit(8).all()
    ]


@router.get("/manager")
def manager_stats(user: User = Depends(require_manager), db: Session = Depends(get_db)):
    def count(status):
        return db.query(Approval).filter(Approval.status == status).count()

    attention = (
        db.query(Dataset)
        .filter(Dataset.quality_score.isnot(None), Dataset.quality_score < 75)
        .order_by(Dataset.quality_score.asc())
        .limit(8)
        .all()
    )
    avg = db.query(func.avg(Dataset.quality_score)).scalar()
    return {
        "pending": count("pending"),
        "approved": count("approved"),
        "rejected": count("rejected"),
        "changes_requested": count("changes_requested"),
        "team_quality": round(float(avg), 2) if avg is not None else None,
        "attention": [
            {"id": d.id, "name": d.name, "quality_score": d.quality_score, "status": d.status}
            for d in attention
        ],
    }
