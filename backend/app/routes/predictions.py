from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import client_ip, get_current_user, get_dataset_for_user
from app.models.prediction import Prediction
from app.models.user import User
from app.schemas.prediction_schema import PredictionOut, PredictionRequest
from app.services.audit_service import log_action
from app.services.notification_service import notify
from app.services.prediction_service import train_model
from app.services.workflow_service import require_prediction_ready

router = APIRouter(prefix="/datasets", tags=["predictions"])


@router.post("/{dataset_id}/predictions", response_model=PredictionOut)
def create_prediction(
    dataset_id: int,
    payload: PredictionRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset = get_dataset_for_user(dataset_id, user, db)
    require_prediction_ready(dataset, db)
    record = train_model(db, dataset, user.id, payload.model_dump())
    log_action(db, "RUN_PREDICTION", f"Prediction for {dataset.name}.", user.id, "dataset", dataset.id, client_ip(request))
    notify(db, user.id, "Prediction completed", f"Model training finished for {dataset.name}.", "prediction_completed")
    db.commit()
    db.refresh(record)
    return record


@router.get("/{dataset_id}/predictions", response_model=list[PredictionOut])
def list_predictions(dataset_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_dataset_for_user(dataset_id, user, db)
    return (
        db.query(Prediction).filter(Prediction.dataset_id == dataset_id).order_by(Prediction.created_at.desc()).all()
    )
