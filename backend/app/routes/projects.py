from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import client_ip, get_current_user
from app.exceptions import NotFoundError
from app.models.dataset import Dataset
from app.models.presentation import Presentation
from app.models.project import Project
from app.models.report import Report
from app.models.user import User
from app.schemas.dataset_schema import DatasetOut
from app.schemas.project_schema import ProjectCreate, ProjectOut, ProjectUpdate
from app.services.audit_service import log_action
from app.services.presentation_service import serialize_presentation
from app.services.project_service import (
    create_project,
    get_project_for_user,
    list_projects_for_user,
    serialize_project,
    update_project,
)
from app.services.report_service import serialize_report

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ProjectOut)
def create_new_project(
    data: ProjectCreate,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = create_project(db, data, user)
    log_action(db, "CREATE_PROJECT", f"Created project '{project.name}'.", user.id, "project", project.id, client_ip(request))
    db.commit()
    db.refresh(project)
    return serialize_project(project, db)


@router.get("")
def list_projects(
    q: str | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 12,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_projects_for_user(user, db, q, status, page, page_size)


@router.get("/{project_id}", response_model=ProjectOut)
def get_project_details(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_project_for_user(project_id, user, db)
    return serialize_project(project, db)


@router.put("/{project_id}", response_model=ProjectOut)
def update_project_details(
    project_id: int,
    data: ProjectUpdate,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_project_for_user(project_id, user, db)
    project = update_project(project, data, db)
    log_action(db, "UPDATE_PROJECT", f"Updated project '{project.name}'.", user.id, "project", project.id, client_ip(request))
    db.commit()
    db.refresh(project)
    return serialize_project(project, db)


@router.get("/{project_id}/datasets")
def list_project_datasets(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_project_for_user(project_id, user, db)
    datasets = db.query(Dataset).filter(Dataset.project_id == project.id).order_by(Dataset.created_at.desc()).all()
    results = []
    for d in datasets:
        owner = db.get(User, d.owner_id)
        results.append(
            DatasetOut.model_validate(d).model_copy(
                update={"owner_name": owner.name if owner else None, "project_name": project.name, "has_cleaned_file": bool(d.cleaned_file_path)}
            )
        )
    return results


@router.get("/{project_id}/deliverables")
def list_project_deliverables(
    project_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = get_project_for_user(project_id, user, db)
    reports = db.query(Report).filter(Report.project_id == project.id).order_by(Report.created_at.desc()).all()
    presentations = db.query(Presentation).filter(Presentation.project_id == project.id).order_by(Presentation.created_at.desc()).all()

    return {
        "project_id": project.id,
        "project_name": project.name,
        "reports": [serialize_report(r, db) for r in reports],
        "presentations": [serialize_presentation(p, db) for p in presentations],
    }
