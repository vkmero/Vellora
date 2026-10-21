from fastapi import APIRouter, Depends, File, Form, Request, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import client_ip, get_current_user
from app.models.dataset import Dataset
from app.models.user import User
from app.schemas.dataset_schema import DatasetOut
from app.services.audit_service import log_action
from app.services.file_service import save_upload
from app.services.ingestion_service import load_dataframe

router = APIRouter(tags=["upload"])


@router.post("/datasets/upload", response_model=DatasetOut)
async def upload_dataset(
    request: Request,
    file: UploadFile = File(...),
    name: str | None = Form(default=None),
    project_id: int | None = Form(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    original_name, path, size, file_type = await save_upload(file)
    frame = load_dataframe(path)
    dataset = Dataset(
        name=name or original_name,
        original_filename=original_name,
        original_file_path=path,
        file_type=file_type,
        file_size=size,
        owner_id=user.id,
        project_id=project_id,
        status="uploaded",
        row_count=int(len(frame)),
        column_count=int(len(frame.columns)),
    )
    db.add(dataset)
    db.flush()
    log_action(db, "UPLOAD_DATASET", f"Uploaded {original_name}.", user.id, "dataset", dataset.id, client_ip(request))
    db.commit()
    db.refresh(dataset)
    project_name = dataset.project.name if dataset.project else None
    return DatasetOut.model_validate(dataset).model_copy(
        update={"owner_name": user.name, "has_cleaned_file": False, "project_name": project_name}
    )
