from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import client_ip, get_current_user, get_dataset_for_user
from app.models.quality_issue import QualityIssue
from app.models.user import User
from app.schemas.quality_schema import QualityIssueOut, QualityOut
from app.services.audit_service import log_action
from app.services.quality_service import analyze_quality
from app.utils.quality_scoring import classify_score

router = APIRouter(prefix="/datasets", tags=["quality"])


@router.post("/{dataset_id}/quality", response_model=QualityOut)
def run_quality(
    dataset_id: int,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset = get_dataset_for_user(dataset_id, user, db)
    result = analyze_quality(db, dataset)
    log_action(db, "QUALITY_ANALYSIS", f"Quality analysis for {dataset.name}.", user.id, "dataset", dataset.id, client_ip(request))
    db.commit()
    return QualityOut(
        dataset_id=dataset.id,
        quality_score=result["quality_score"],
        category=result["category"],
        dimensions=result["dimensions"],
        explanations=result.get("explanations", {}),
        issues=[QualityIssueOut.model_validate(i) for i in result["issues"]],
        possible_primary_keys=result["possible_primary_keys"],
    )


@router.get("/{dataset_id}/quality", response_model=QualityOut)
def get_quality(dataset_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    dataset = get_dataset_for_user(dataset_id, user, db)
    issues = db.query(QualityIssue).filter(QualityIssue.dataset_id == dataset_id).all()
    score = dataset.quality_score or 0
    return QualityOut(
        dataset_id=dataset.id,
        quality_score=score,
        category=classify_score(score),
        dimensions={},
        issues=[QualityIssueOut.model_validate(i) for i in issues],
        possible_primary_keys=[],
    )


@router.get("/{dataset_id}/quality/issues", response_model=list[QualityIssueOut])
def get_issues(dataset_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_dataset_for_user(dataset_id, user, db)
    issues = db.query(QualityIssue).filter(QualityIssue.dataset_id == dataset_id).all()
    return issues
