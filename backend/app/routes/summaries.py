from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import client_ip, get_current_user, get_dataset_for_user
from app.exceptions import NotFoundError
from app.models.summary import Summary
from app.models.user import User
from app.schemas.summary_schema import SummaryGenerateRequest, SummaryOut, SummaryUpdateRequest
from app.services.audit_service import log_action
from app.services.summary_service import generate_summary, serialize_summary, update_summary

router = APIRouter(prefix="/summaries", tags=["summaries"])


@router.post("/generate", response_model=SummaryOut)
def generate_summary_endpoint(
    data: SummaryGenerateRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset = get_dataset_for_user(data.dataset_id, user, db)
    summary = generate_summary(db, dataset, data.summary_type, user.id, data.project_id)
    log_action(db, "GENERATE_SUMMARY", f"Generated {data.summary_type} summary for '{dataset.name}'.", user.id, "summary", summary.id, client_ip(request))
    db.commit()
    db.refresh(summary)
    return serialize_summary(summary, db)


@router.get("", response_model=list[SummaryOut])
def get_summaries(
    dataset_id: int | None = None,
    project_id: int | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Summary)
    if dataset_id:
        query = query.filter(Summary.dataset_id == dataset_id)
    if project_id:
        query = query.filter(Summary.project_id == project_id)
    summaries = query.order_by(Summary.updated_at.desc()).all()
    return [serialize_summary(s, db) for s in summaries]


@router.get("/{summary_id}", response_model=SummaryOut)
def get_summary_by_id(
    summary_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    summary = db.get(Summary, summary_id)
    if not summary:
        raise NotFoundError("Summary not found.")
    return serialize_summary(summary, db)


@router.put("/{summary_id}", response_model=SummaryOut)
def update_summary_endpoint(
    summary_id: int,
    data: SummaryUpdateRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    summary = update_summary(summary_id, data.content, data.title, user, db)
    log_action(db, "UPDATE_SUMMARY", f"Updated summary #{summary.id}.", user.id, "summary", summary.id, client_ip(request))
    db.commit()
    db.refresh(summary)
    return serialize_summary(summary, db)
