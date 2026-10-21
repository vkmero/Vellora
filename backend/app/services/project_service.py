from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.exceptions import ForbiddenError, NotFoundError
from app.models.dataset import Dataset
from app.models.project import Project
from app.models.user import User
from app.schemas.project_schema import ProjectCreate, ProjectOut, ProjectUpdate
from app.utils.helpers import paginate, utcnow


def serialize_project(project: Project, db: Session) -> ProjectOut:
    analyst = db.get(User, project.assigned_analyst_id) if project.assigned_analyst_id else None
    manager = db.get(User, project.assigned_manager_id) if project.assigned_manager_id else None
    dataset_count = db.query(Dataset).filter(Dataset.project_id == project.id).count()

    return ProjectOut(
        id=project.id,
        name=project.name,
        description=project.description,
        business_objective=project.business_objective,
        client_name=project.client_name,
        client_email=project.client_email,
        assigned_analyst_id=project.assigned_analyst_id,
        assigned_manager_id=project.assigned_manager_id,
        status=project.status,
        approval_policy=project.approval_policy,
        created_at=project.created_at,
        updated_at=project.updated_at,
        assigned_analyst_name=analyst.name if analyst else None,
        assigned_manager_name=manager.name if manager else None,
        dataset_count=dataset_count,
    )


def create_project(db: Session, data: ProjectCreate, current_user: User) -> Project:
    project = Project(
        name=data.name,
        description=data.description,
        business_objective=data.business_objective,
        client_name=data.client_name,
        client_email=str(data.client_email) if data.client_email else None,
        assigned_analyst_id=current_user.id if current_user.role == "analyst" else None,
        assigned_manager_id=data.assigned_manager_id,
        approval_policy=data.approval_policy,
        status="active",
    )
    # If a manager creates the project and no analyst is set, they can assign themselves or leave unassigned
    if current_user.role in {"manager", "admin"} and not project.assigned_manager_id:
        project.assigned_manager_id = current_user.id

    db.add(project)
    db.flush()
    return project


def get_project_for_user(project_id: int, current_user: User, db: Session) -> Project:
    project = db.get(Project, project_id)
    if not project:
        raise NotFoundError("Project not found.")

    if current_user.role == "analyst" and project.assigned_analyst_id and project.assigned_analyst_id != current_user.id:
        # Check if analyst owns any datasets in this project
        has_dataset = db.query(Dataset).filter(
            Dataset.project_id == project.id, Dataset.owner_id == current_user.id
        ).first()
        if not has_dataset:
            raise ForbiddenError("You do not have access to this project.")

    return project


def list_projects_for_user(
    current_user: User,
    db: Session,
    q: str | None = None,
    status: str | None = None,
    page: int = 1,
    page_size: int = 12,
) -> dict:
    query = db.query(Project)

    if current_user.role == "analyst":
        # Analyst sees projects assigned to them or unassigned or where they own datasets
        analyst_datasets = db.query(Dataset.project_id).filter(Dataset.owner_id == current_user.id).subquery()
        query = query.filter(
            or_(
                Project.assigned_analyst_id == current_user.id,
                Project.assigned_analyst_id.is_(None),
                Project.id.in_(analyst_datasets),
            )
        )
    elif current_user.role == "manager":
        # Managers see projects assigned to them or where they manage
        # Also can view all projects for oversight
        pass

    if q:
        query = query.filter(
            or_(
                Project.name.ilike(f"%{q}%"),
                Project.client_name.ilike(f"%{q}%"),
                Project.description.ilike(f"%{q}%"),
            )
        )

    if status:
        query = query.filter(Project.status == status)

    query = query.order_by(Project.updated_at.desc())
    result = paginate(query, page, page_size)
    result["items"] = [serialize_project(p, db) for p in result["items"]]
    return result


def update_project(project: Project, data: ProjectUpdate, db: Session) -> Project:
    if data.name is not None:
        project.name = data.name
    if data.description is not None:
        project.description = data.description
    if data.business_objective is not None:
        project.business_objective = data.business_objective
    if data.client_name is not None:
        project.client_name = data.client_name
    if data.client_email is not None:
        project.client_email = str(data.client_email) if data.client_email else None
    if data.assigned_manager_id is not None:
        project.assigned_manager_id = data.assigned_manager_id
    if data.approval_policy is not None:
        project.approval_policy = data.approval_policy
    if data.status is not None:
        project.status = data.status

    project.updated_at = utcnow()
    db.flush()
    return project
