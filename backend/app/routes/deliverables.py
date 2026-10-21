from pathlib import Path
from fastapi import APIRouter, Depends, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import client_ip, get_current_user, get_dataset_for_user
from app.exceptions import NotFoundError
from app.models.presentation import Presentation
from app.models.report import Report
from app.models.user import User
from app.schemas.presentation_schema import PresentationGenerateRequest, PresentationOut
from app.services.audit_service import log_action
from app.services.presentation_service import generate_presentation, serialize_presentation
from app.services.report_service import serialize_report

router = APIRouter(prefix="/deliverables", tags=["deliverables"])


@router.post("/presentations/generate", response_model=PresentationOut)
def generate_presentation_deck(
    data: PresentationGenerateRequest,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset = get_dataset_for_user(data.dataset_id, user, db)
    presentation = generate_presentation(
        db=db,
        dataset=dataset,
        user_id=user.id,
        project_id=data.project_id,
        custom_title=data.custom_title,
    )
    log_action(db, "GENERATE_PRESENTATION", f"Generated 12-slide presentation deck for '{dataset.name}'.", user.id, "presentation", presentation.id, client_ip(request))
    db.commit()
    db.refresh(presentation)
    return serialize_presentation(presentation, db)


@router.get("/presentations/{presentation_id}", response_model=PresentationOut)
def get_presentation_details(
    presentation_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    presentation = db.get(Presentation, presentation_id)
    if not presentation:
        raise NotFoundError("Presentation not found.")
    return serialize_presentation(presentation, db)


@router.get("/presentations/{presentation_id}/download")
def download_presentation_file(
    presentation_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    presentation = db.get(Presentation, presentation_id)
    if not presentation:
        raise NotFoundError("Presentation not found.")
    path = Path(presentation.file_path)
    if not path.exists():
        raise NotFoundError("Presentation file does not exist on disk.")

    filename = f"{presentation.title.replace(' ', '_')}.pptx"
    return FileResponse(
        str(path),
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
    )


@router.get("/dataset/{dataset_id}")
def get_dataset_deliverables(
    dataset_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset = get_dataset_for_user(dataset_id, user, db)
    reports = db.query(Report).filter(Report.dataset_id == dataset.id).order_by(Report.created_at.desc()).all()
    presentations = db.query(Presentation).filter(Presentation.dataset_id == dataset.id).order_by(Presentation.created_at.desc()).all()

    return {
        "dataset_id": dataset.id,
        "dataset_name": dataset.name,
        "reports": [serialize_report(r, db) for r in reports],
        "presentations": [serialize_presentation(p, db) for p in presentations],
    }
