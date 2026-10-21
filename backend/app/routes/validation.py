from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import client_ip, get_current_user, get_dataset_for_user
from app.exceptions import NotFoundError
from app.models.user import User
from app.models.validation import Validation
from app.schemas.validation_schema import ValidationOut
from app.services.audit_service import log_action
from app.services.validation_service import revalidate

router = APIRouter(prefix="/datasets", tags=["validation"])


@router.post("/{dataset_id}/validate", response_model=ValidationOut)
def run_validation(
    dataset_id: int,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset = get_dataset_for_user(dataset_id, user, db)
    record = revalidate(db, dataset)
    log_action(db, "QUALITY_ANALYSIS", f"Revalidated {dataset.name}.", user.id, "dataset", dataset.id, client_ip(request))
    db.commit()
    db.refresh(record)
    return record


@router.get("/{dataset_id}/validation", response_model=ValidationOut)
def get_validation(dataset_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_dataset_for_user(dataset_id, user, db)
    record = (
        db.query(Validation).filter(Validation.dataset_id == dataset_id).order_by(Validation.created_at.desc()).first()
    )
    if not record:
        raise NotFoundError("No validation has been run yet.")
    return record
