from pathlib import Path

from fastapi import APIRouter, Depends, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import client_ip, get_current_user, get_dataset_for_user
from app.exceptions import ForbiddenError, NotFoundError
from app.models.report import Report
from app.models.user import User
from app.schemas.report_schema import ReportOut, ReportRequest
from app.services.audit_service import log_action
from app.services.notification_service import notify
from app.services.report_service import generate_report, resolve_report_file
from app.services.workflow_service import require_report_ready
from app.utils.helpers import paginate

router = APIRouter(tags=["reports"])


@router.post("/datasets/{dataset_id}/reports", response_model=ReportOut)
def create_report(
    dataset_id: int,
    payload: ReportRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset = get_dataset_for_user(dataset_id, user, db)
    require_report_ready(dataset, db, payload.report_type)
    record = generate_report(db, dataset, user.id, payload.report_type, payload.format)
    log_action(db, "GENERATE_REPORT", f"Generated {payload.report_type} report for {dataset.name}.", user.id, "dataset", dataset.id, client_ip(request))
    notify(db, user.id, "Report generated", f"A {payload.report_type} report is ready for {dataset.name}.", "report_generated")
    db.commit()
    db.refresh(record)
    return record


@router.get("/datasets/{dataset_id}/reports")
def list_dataset_reports(
    dataset_id: int,
    page: int = 1,
    page_size: int = 12,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    get_dataset_for_user(dataset_id, user, db)
    query = db.query(Report).filter(Report.dataset_id == dataset_id).order_by(Report.created_at.desc())
    return paginate(query, page, page_size)


@router.get("/reports/{report_id}/download")
def download_report(report_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    report = resolve_report_file(db, report_id)
    if user.role == "analyst":
        from app.models.dataset import Dataset

        dataset = db.get(Dataset, report.dataset_id)
        if dataset and dataset.owner_id != user.id:
            raise ForbiddenError()
    path = Path(report.file_path)
    return FileResponse(path, filename=path.name)
