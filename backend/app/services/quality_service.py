import pandas as pd
from sqlalchemy.orm import Session

from app.models.dataset import Dataset
from app.models.quality_issue import QualityIssue
from app.services.ingestion_service import load_dataset_frame
from app.utils.data_types import infer_column_kind
from app.utils.quality_scoring import classify_score, composite_quality_score
from app.utils.statistics import iqr_outlier_mask


def _severity(pct: float) -> str:
    if pct >= 25:
        return "Critical"
    if pct >= 10:
        return "High"
    if pct >= 5:
        return "Medium"
    return "Low"


def analyze_quality(db: Session, dataset: Dataset) -> dict:
    df = load_dataset_frame(dataset)
    db.query(QualityIssue).filter(QualityIssue.dataset_id == dataset.id).delete()
    issues: list[QualityIssue] = []
    rows = max(len(df), 1)

    missing_cells = int(df.isna().sum().sum())
    completeness = max(0.0, 100.0 - (missing_cells / (rows * max(len(df.columns), 1)) * 100))

    duplicate_count = int(df.duplicated().sum())
    uniqueness = max(0.0, 100.0 - (duplicate_count / rows * 100))

    invalid = 0
    mixed = 0
    category_inconsistent = 0
    outlier_total = 0
    possible_keys = []

    for column in df.columns:
        series = df[column]
        kind = infer_column_kind(series)
        missing = int(series.isna().sum())
        if missing:
            pct = missing / rows * 100
            issues.append(
                QualityIssue(
                    dataset_id=dataset.id,
                    column_name=str(column),
                    issue_type="missing_values",
                    severity=_severity(pct),
                    description=f"{missing} missing values in {column} ({pct:.1f}%).",
                    recommendation="Review the distribution, then impute with mean, median, or mode, or drop sparse rows.",
                    affected_rows=missing,
                    percentage=round(pct, 2),
                )
            )
        if kind == "numeric":
            mask = iqr_outlier_mask(series)
            count = int(mask.sum())
            outlier_total += count
            if count:
                pct = count / rows * 100
                issues.append(
                    QualityIssue(
                        dataset_id=dataset.id,
                        column_name=str(column),
                        issue_type="outliers",
                        severity=_severity(pct),
                        description=f"{count} IQR outliers detected in {column}.",
                        recommendation="Inspect outliers before removal. Extreme values can be valid business events.",
                        affected_rows=count,
                        percentage=round(pct, 2),
                    )
                )
            if series.dtype == object:
                coerced = pd.to_numeric(series.astype(str).str.replace(",", "", regex=False), errors="coerce")
                text_numeric = int((series.notna() & coerced.notna()).sum())
                if text_numeric:
                    invalid += text_numeric
                    issues.append(
                        QualityIssue(
                            dataset_id=dataset.id,
                            column_name=str(column),
                            issue_type="datatype_problem",
                            severity="Medium",
                            description=f"Numeric values appear stored as text in {column}.",
                            recommendation="Convert the column to a numeric datatype after cleaning separators.",
                            affected_rows=text_numeric,
                            percentage=round(text_numeric / rows * 100, 2),
                        )
                    )
        if kind == "categorical":
            non_null = series.dropna().astype(str)
            lowered = non_null.str.strip().str.lower()
            unique_raw = non_null.nunique()
            unique_norm = lowered.nunique()
            if unique_raw > unique_norm:
                affected = int(unique_raw - unique_norm)
                category_inconsistent += affected
                issues.append(
                    QualityIssue(
                        dataset_id=dataset.id,
                        column_name=str(column),
                        issue_type="inconsistent_categories",
                        severity="Low",
                        description=f"Category casing/spacing variants found in {column} (e.g. Hyderabad vs hyderabad).",
                        recommendation="Standardize categories to a consistent canonical form.",
                        affected_rows=affected,
                        percentage=round(affected / max(unique_raw, 1) * 100, 2),
                    )
                )
            types = non_null.map(lambda v: type(v).__name__).nunique()
            if series.dropna().map(type).nunique() > 1:
                mixed += 1
                issues.append(
                    QualityIssue(
                        dataset_id=dataset.id,
                        column_name=str(column),
                        issue_type="mixed_types",
                        severity="Medium",
                        description=f"Mixed Python types detected in {column}.",
                        recommendation="Normalize the column to a single datatype.",
                        affected_rows=int(series.notna().sum()),
                        percentage=round(series.notna().sum() / rows * 100, 2),
                    )
                )
        unique = series.nunique(dropna=True)
        miss_pct = series.isna().mean() * 100
        if unique == rows and miss_pct == 0 and kind != "numeric" or (unique == rows and miss_pct == 0):
            if unique == len(df) and miss_pct == 0:
                possible_keys.append(
                    {
                        "column": str(column),
                        "uniqueness": 100.0,
                        "missing_pct": 0.0,
                        "type": kind,
                    }
                )

    if duplicate_count:
        issues.append(
            QualityIssue(
                dataset_id=dataset.id,
                column_name=None,
                issue_type="duplicates",
                severity=_severity(duplicate_count / rows * 100),
                description=f"{duplicate_count} exact duplicate rows were found.",
                recommendation="Remove exact duplicates after confirming they are not legitimate repeated events.",
                affected_rows=duplicate_count,
                percentage=round(duplicate_count / rows * 100, 2),
            )
        )

    validity = max(0.0, 100.0 - min(40.0, (invalid / rows) * 20 + (outlier_total / rows) * 15))
    consistency = max(0.0, 100.0 - min(40.0, category_inconsistent * 2 + mixed * 5))
    score = composite_quality_score(completeness, uniqueness, validity, consistency)

    for issue in issues:
        db.add(issue)

    dataset.quality_score = score
    if dataset.status in {"uploaded", "profiled", "quality_checked", "cleaned", "changes_requested"}:
        if dataset.status not in {"cleaned", "pending_approval", "approved", "validated"}:
            dataset.status = "quality_checked"
    db.flush()

    total_cells = rows * max(len(df.columns), 1)
    explanations = {
        "completeness": f"{missing_cells} missing cells out of {total_cells} total cells ({round(completeness, 1)}% complete).",
        "uniqueness": f"{duplicate_count} duplicate rows out of {rows} rows ({round(uniqueness, 1)}% unique).",
        "validity": f"{outlier_total} statistical outliers and {invalid} datatype anomalies detected ({round(validity, 1)}% valid).",
        "consistency": f"{category_inconsistent} category casing/whitespace variations detected ({round(consistency, 1)}% consistent).",
    }

    return {
        "dataset_id": dataset.id,
        "quality_score": score,
        "category": classify_score(score),
        "dimensions": {
            "completeness": round(completeness, 2),
            "uniqueness": round(uniqueness, 2),
            "validity": round(validity, 2),
            "consistency": round(consistency, 2),
        },
        "explanations": explanations,
        "counts": {
            "missing_cells": missing_cells,
            "duplicates": duplicate_count,
            "outliers": outlier_total,
        },
        "possible_primary_keys": possible_keys,
        "issues": issues,
    }
