from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import client_ip, get_current_user, get_dataset_for_user
from app.models.cleaning_action import CleaningAction
from app.models.user import User
from app.schemas.cleaning_schema import CleanRequest, CleaningActionOut, CleaningPreviewOut
from app.services.audit_service import log_action
from app.services.cleaning_service import preview_or_apply
from app.services.notification_service import notify

router = APIRouter(prefix="/datasets", tags=["cleaning"])


@router.post("/{dataset_id}/clean")
def clean_dataset(
    dataset_id: int,
    payload: CleanRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset = get_dataset_for_user(dataset_id, user, db)
    result = preview_or_apply(
        db, dataset, user.id, payload.action_type, payload.column_name, payload.value, payload.preview
    )
    if payload.preview:
        return CleaningPreviewOut(**result)
    log_action(db, "CLEAN_DATASET", result.description, user.id, "dataset", dataset.id, client_ip(request))
    notify(db, user.id, "Cleaning completed", f"Cleaning finished on {dataset.name}. Next: submit for manager approval.", "cleaning_completed")
    db.commit()
    db.refresh(result)
    return CleaningActionOut.model_validate(result)


@router.post("/{dataset_id}/clean/preview", response_model=CleaningPreviewOut)
def clean_dataset_preview(
    dataset_id: int,
    payload: CleanRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payload.preview = True
    return clean_dataset(dataset_id, payload, request, user, db)


@router.post("/{dataset_id}/clean/apply", response_model=CleaningActionOut)
def clean_dataset_apply(
    dataset_id: int,
    payload: CleanRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    payload.preview = False
    return clean_dataset(dataset_id, payload, request, user, db)


@router.get("/{dataset_id}/cleaning", response_model=list[CleaningActionOut])
@router.get("/{dataset_id}/cleaning/actions", response_model=list[CleaningActionOut])
def cleaning_history(dataset_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_dataset_for_user(dataset_id, user, db)
    return (
        db.query(CleaningAction)
        .filter(CleaningAction.dataset_id == dataset_id)
        .order_by(CleaningAction.created_at.desc())
        .all()
    )
