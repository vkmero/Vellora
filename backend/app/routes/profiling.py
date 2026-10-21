from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import client_ip, get_current_user, get_dataset_for_user
from app.exceptions import NotFoundError
from app.models.data_profile import DataProfile
from app.models.user import User
from app.schemas.profile_schema import ProfileOut
from app.services.audit_service import log_action
from app.services.profiling_service import profile_dataset, serialize_profile

router = APIRouter(prefix="/datasets", tags=["profiling"])


@router.post("/{dataset_id}/profile", response_model=ProfileOut)
def run_profile(
    dataset_id: int,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset = get_dataset_for_user(dataset_id, user, db)
    profile_out = profile_dataset(db, dataset)
    log_action(db, "PROFILE_DATASET", f"Profiled dataset {dataset.name}.", user.id, "dataset", dataset.id, client_ip(request))
    db.commit()
    return profile_out


@router.get("/{dataset_id}/profile", response_model=ProfileOut)
def get_profile(dataset_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_dataset_for_user(dataset_id, user, db)
    profile = (
        db.query(DataProfile).filter(DataProfile.dataset_id == dataset_id).order_by(DataProfile.created_at.desc()).first()
    )
    if not profile:
        raise NotFoundError("No profile has been generated yet.")
    return serialize_profile(profile)
