from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import client_ip, get_current_user, get_dataset_for_user
from app.exceptions import NotFoundError
from app.models.analysis import Analysis
from app.models.user import User
from app.schemas.analysis_schema import AnalysisOut
from app.services.analytics_service import run_analytics
from app.services.audit_service import log_action

router = APIRouter(prefix="/datasets", tags=["analytics"])


@router.post("/{dataset_id}/analytics", response_model=AnalysisOut)
def create_analysis(
    dataset_id: int,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset = get_dataset_for_user(dataset_id, user, db)
    analysis = run_analytics(db, dataset, user.id)
    log_action(db, "RUN_ANALYTICS", f"Analytics for {dataset.name}.", user.id, "dataset", dataset.id, client_ip(request))
    db.commit()
    db.refresh(analysis)
    return analysis


@router.get("/{dataset_id}/analytics", response_model=AnalysisOut)
def get_analysis(dataset_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_dataset_for_user(dataset_id, user, db)
    analysis = db.query(Analysis).filter(Analysis.dataset_id == dataset_id).order_by(Analysis.created_at.desc()).first()
    if not analysis:
        raise NotFoundError("No analytics results yet.")
    return analysis
