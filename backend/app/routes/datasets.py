from pathlib import Path

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import client_ip, get_current_user, get_dataset_for_user
from app.models.dataset import Dataset
from app.models.user import User
from app.schemas.dataset_schema import DatasetListResponse, DatasetOut
from app.services.audit_service import log_action
from app.services.ingestion_service import load_dataset_frame
from app.utils.helpers import json_safe, paginate

router = APIRouter(prefix="/datasets", tags=["datasets"])


def serialize(dataset: Dataset, db: Session) -> DatasetOut:
    owner = db.get(User, dataset.owner_id)
    project_name = dataset.project.name if dataset.project else None
    return DatasetOut.model_validate(dataset).model_copy(
        update={
            "owner_name": owner.name if owner else None,
            "project_name": project_name,
            "has_cleaned_file": bool(dataset.cleaned_file_path),
        }
    )


@router.get("", response_model=DatasetListResponse)
def list_datasets(
    q: str | None = None,
    status: str | None = None,
    file_type: str | None = None,
    project_id: int | None = None,
    page: int = 1,
    page_size: int = 12,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Dataset)
    if user.role == "analyst":
        query = query.filter(Dataset.owner_id == user.id)
    if project_id is not None:
        query = query.filter(Dataset.project_id == project_id)
    if q:
        query = query.filter(Dataset.name.ilike(f"%{q}%"))
    if status:
        query = query.filter(Dataset.status == status)
    if file_type:
        query = query.filter(Dataset.file_type == file_type)
    query = query.order_by(Dataset.created_at.desc())
    result = paginate(query, page, page_size)
    result["items"] = [serialize(item, db) for item in result["items"]]
    return result


@router.get("/{dataset_id}", response_model=DatasetOut)
def get_dataset(dataset_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return serialize(get_dataset_for_user(dataset_id, user, db), db)


@router.get("/{dataset_id}/preview")
def get_dataset_preview(
    dataset_id: int,
    limit: int = Query(25, ge=1, le=100),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset = get_dataset_for_user(dataset_id, user, db)
    df = load_dataset_frame(dataset)
    preview_df = df.head(limit)
    columns = [str(c) for c in preview_df.columns]
    rows = []
    for _, row in preview_df.iterrows():
        row_dict = {}
        for col in columns:
            row_dict[col] = json_safe(row[col])
        rows.append(row_dict)
    return {
        "dataset_id": dataset.id,
        "columns": columns,
        "rows": rows,
        "row_count": int(len(df)),
        "preview_count": len(rows),
    }


@router.delete("/{dataset_id}")
def delete_dataset(
    dataset_id: int,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset = get_dataset_for_user(dataset_id, user, db)
    if user.role == "analyst" and dataset.owner_id != user.id:
        from app.exceptions import ForbiddenError

        raise ForbiddenError()
    for path in (dataset.original_file_path, dataset.cleaned_file_path):
        if path:
            file = Path(path)
            if file.exists():
                file.unlink()
    log_action(db, "DELETE_DATASET", f"Deleted dataset {dataset.name}.", user.id, "dataset", dataset.id, client_ip(request))
    db.delete(dataset)
    db.commit()
    return {"message": "Dataset deleted."}
