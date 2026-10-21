"""Centralized dataset state machine and workflow governance service for Vellora."""

from sqlalchemy.orm import Session

from app.exceptions import WorkflowStageError
from app.models.analysis import Analysis
from app.models.dataset import Dataset


class DatasetState:
    UPLOADED = "uploaded"
    PROFILED = "profiled"
    QUALITY_CHECKED = "quality_checked"
    CLEANED = "cleaned"
    PENDING_APPROVAL = "pending_approval"
    CHANGES_REQUESTED = "changes_requested"
    APPROVED = "approved"
    REJECTED = "rejected"
    VALIDATED = "validated"
    ANALYZED = "analyzed"
    ARCHIVED = "archived"


VALID_TRANSITIONS: dict[str, set[str]] = {
    DatasetState.UPLOADED: {DatasetState.PROFILED},
    DatasetState.PROFILED: {DatasetState.PROFILED, DatasetState.QUALITY_CHECKED},
    DatasetState.QUALITY_CHECKED: {
        DatasetState.PROFILED,
        DatasetState.QUALITY_CHECKED,
        DatasetState.CLEANED,
        DatasetState.VALIDATED,
        DatasetState.PENDING_APPROVAL,
    },
    DatasetState.CLEANED: {
        DatasetState.PROFILED,
        DatasetState.QUALITY_CHECKED,
        DatasetState.CLEANED,
        DatasetState.VALIDATED,
        DatasetState.PENDING_APPROVAL,
    },
    DatasetState.CHANGES_REQUESTED: {DatasetState.CLEANED, DatasetState.VALIDATED, DatasetState.PENDING_APPROVAL},
    DatasetState.PENDING_APPROVAL: {
        DatasetState.APPROVED,
        DatasetState.REJECTED,
        DatasetState.CHANGES_REQUESTED,
    },
    DatasetState.REJECTED: {DatasetState.CLEANED, DatasetState.ARCHIVED},
    DatasetState.APPROVED: {DatasetState.VALIDATED, DatasetState.ANALYZED},
    DatasetState.VALIDATED: {DatasetState.PENDING_APPROVAL, DatasetState.ANALYZED, DatasetState.CLEANED},
    DatasetState.ANALYZED: {DatasetState.ANALYZED, DatasetState.ARCHIVED},
    DatasetState.ARCHIVED: set(),
}


def transition_dataset(dataset: Dataset, target_state: str, force: bool = False) -> None:
    """Validate and transition dataset status according to the Vellora state machine."""
    if dataset.status == target_state:
        return

    allowed = VALID_TRANSITIONS.get(dataset.status, set())
    if target_state not in allowed and not force:
        raise WorkflowStageError(
            f"Cannot transition dataset from '{dataset.status}' to '{target_state}'. "
            f"Allowed next stages: {sorted(list(allowed)) or 'None'}."
        )

    dataset.status = target_state


def require_dataset_stage(dataset: Dataset, allowed_stages: set[str], error_message: str | None = None) -> None:
    """Ensure dataset is in one of the required workflow stages."""
    if dataset.status not in allowed_stages:
        msg = error_message or (
            f"Action not permitted in state '{dataset.status}'. "
            f"Required stage(s): {', '.join(sorted(allowed_stages))}."
        )
        raise WorkflowStageError(msg)


def require_revalidation_ready(dataset: Dataset) -> None:
    """Enforce that revalidation requires cleaning to have occurred or quality check completed."""
    if dataset.status not in {DatasetState.CLEANED, DatasetState.QUALITY_CHECKED, DatasetState.APPROVED, DatasetState.VALIDATED}:
        raise WorkflowStageError(
            f"Dataset must be cleaned or assessed before revalidation. Current status: '{dataset.status}'."
        )


def require_analytics_ready(dataset: Dataset) -> None:
    """Enforce that analytics requires dataset to be validated (and approved if project policy is mandatory)."""
    project = getattr(dataset, "project", None)
    if project and project.approval_policy == "mandatory":
        if dataset.status not in {DatasetState.APPROVED, DatasetState.ANALYZED}:
            raise WorkflowStageError(
                "Analytics locked. This project requires mandatory manager approval before analytics."
            )
    else:
        if dataset.status not in {DatasetState.VALIDATED, DatasetState.APPROVED, DatasetState.ANALYZED}:
            raise WorkflowStageError(
                "Analytics locked. Dataset must pass validation before exploratory analytics."
            )


def require_visualization_ready(dataset: Dataset, db: Session) -> None:
    """Enforce visualization gating."""
    require_analytics_ready(dataset)
    has_analysis = db.query(Analysis).filter(Analysis.dataset_id == dataset.id).first()
    if not has_analysis:
        raise WorkflowStageError(
            "Visualizations require exploratory data analysis (EDA) to be completed first."
        )


def require_insights_ready(dataset: Dataset, db: Session) -> None:
    """Enforce insight generation gating."""
    require_analytics_ready(dataset)
    has_analysis = db.query(Analysis).filter(Analysis.dataset_id == dataset.id).first()
    if not has_analysis:
        raise WorkflowStageError(
            "Business insights require exploratory data analysis (EDA) to be completed first."
        )


def require_prediction_ready(dataset: Dataset, db: Session) -> None:
    """Enforce ML prediction gating."""
    require_analytics_ready(dataset)
    has_analysis = db.query(Analysis).filter(Analysis.dataset_id == dataset.id).first()
    if not has_analysis:
        raise WorkflowStageError(
            "Predictive ML requires exploratory data analysis (EDA) to be completed first."
        )


def require_report_ready(dataset: Dataset, db: Session, report_type: str) -> None:
    """Enforce report type gating."""
    if report_type == "quality":
        if dataset.status in {DatasetState.UPLOADED, DatasetState.PROFILED}:
            raise WorkflowStageError("Quality report requires a completed quality assessment.")
    elif report_type in {"analytics", "complete"}:
        if dataset.status not in {DatasetState.VALIDATED, DatasetState.APPROVED, DatasetState.ANALYZED}:
            raise WorkflowStageError(
                f"{report_type.title()} report requires validation and analytics."
            )
        has_analysis = db.query(Analysis).filter(Analysis.dataset_id == dataset.id).first()
        if not has_analysis:
            raise WorkflowStageError(
                f"{report_type.title()} report requires exploratory analytics to be generated first."
            )
