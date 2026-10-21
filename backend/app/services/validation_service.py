from sqlalchemy.orm import Session

from app.models.dataset import Dataset
from app.models.quality_issue import QualityIssue
from app.models.validation import Validation
from app.services.quality_service import analyze_quality
from app.services.workflow_service import DatasetState, require_revalidation_ready, transition_dataset


def revalidate(db: Session, dataset: Dataset) -> Validation:
    require_revalidation_ready(dataset)

    previous_score = dataset.quality_score
    previous_issues = db.query(QualityIssue).filter(QualityIssue.dataset_id == dataset.id).count()
    previous_summary = {
        "missing": sum(
            i.affected_rows
            for i in db.query(QualityIssue).filter(
                QualityIssue.dataset_id == dataset.id, QualityIssue.issue_type == "missing_values"
            ).all()
        ),
        "duplicates": sum(
            i.affected_rows
            for i in db.query(QualityIssue).filter(
                QualityIssue.dataset_id == dataset.id, QualityIssue.issue_type == "duplicates"
            ).all()
        ),
        "outliers": sum(
            i.affected_rows
            for i in db.query(QualityIssue).filter(
                QualityIssue.dataset_id == dataset.id, QualityIssue.issue_type == "outliers"
            ).all()
        ),
    }

    result = analyze_quality(db, dataset)
    issues_after = len(result["issues"])
    summary = {
        "previous_score": previous_score,
        "new_score": result["quality_score"],
        "missing_before": previous_summary["missing"],
        "missing_after": result["counts"]["missing_cells"],
        "duplicates_before": previous_summary["duplicates"],
        "duplicates_after": result["counts"]["duplicates"],
        "outliers_before": previous_summary["outliers"],
        "outliers_after": result["counts"]["outliers"],
        "dimensions": result["dimensions"],
        "category": result["category"],
    }

    record = Validation(
        dataset_id=dataset.id,
        previous_quality_score=previous_score,
        new_quality_score=result["quality_score"],
        issues_before=previous_issues,
        issues_after=issues_after,
        validation_status="completed",
        validation_summary=summary,
    )
    db.add(record)
    transition_dataset(dataset, DatasetState.VALIDATED)
    db.flush()
    return record
