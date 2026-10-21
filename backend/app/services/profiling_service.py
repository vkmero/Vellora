import pandas as pd
from sqlalchemy.orm import Session

from app.models.data_profile import DataProfile
from app.models.dataset import Dataset
from app.schemas.profile_schema import ColumnProfile, ProfileOut
from app.services.ingestion_service import load_dataset_frame
from app.services.workflow_service import DatasetState
from app.utils.data_types import classify_columns, infer_column_kind
from app.utils.helpers import json_safe
from app.utils.statistics import numeric_summary


def detect_possible_primary_keys(df: pd.DataFrame) -> list[str]:
    """Detect candidate primary keys based on uniqueness, lack of missingness, and naming conventions."""
    candidates = []
    total_rows = len(df)
    if total_rows == 0:
        return candidates

    for column in df.columns:
        series = df[column]
        if series.isna().sum() > 0:
            continue
        unique_cnt = series.nunique(dropna=True)
        if unique_cnt == total_rows:
            candidates.append(str(column))
        elif total_rows > 10 and (unique_cnt / total_rows) >= 0.99:
            col_lower = str(column).lower()
            if any(term in col_lower for term in ["id", "code", "key", "num", "uuid", "no"]):
                candidates.append(str(column))
    return candidates


def serialize_profile(profile: DataProfile) -> ProfileOut:
    """Serialize a DataProfile model instance to the canonical ProfileOut schema."""
    pdata = profile.profile_data or {}
    memory_bytes = pdata.get("memory_bytes", 0)
    memory_mb = pdata.get("memory_mb", round(memory_bytes / (1024 * 1024), 3) if memory_bytes else 0.0)
    possible_primary_keys = pdata.get("possible_primary_keys", [])

    raw_cols = profile.columns or []
    if raw_cols and isinstance(raw_cols[0], str):
        raw_cols = pdata.get("column_details", [])

    cols = []
    for col in raw_cols:
        if isinstance(col, dict):
            cols.append(
                ColumnProfile(
                    name=str(col.get("name", "")),
                    kind=str(col.get("kind", col.get("type", "unknown"))),
                    datatype=str(col.get("datatype", col.get("type", "unknown"))),
                    unique_count=int(col.get("unique_count", col.get("unique", 0))),
                    missing_count=int(col.get("missing_count", col.get("missing", 0))),
                    missing_percentage=float(col.get("missing_percentage", col.get("missing_pct", 0.0))),
                    min=col.get("min"),
                    max=col.get("max"),
                    mean=col.get("mean"),
                    median=col.get("median"),
                )
            )

    return ProfileOut(
        id=profile.id,
        dataset_id=profile.dataset_id,
        row_count=profile.row_count,
        column_count=profile.column_count,
        memory_bytes=memory_bytes,
        memory_mb=memory_mb,
        columns=cols,
        numeric_columns=profile.numeric_columns or [],
        categorical_columns=profile.categorical_columns or [],
        date_columns=profile.date_columns or [],
        missing_count=profile.missing_count,
        duplicate_count=profile.duplicate_count,
        possible_primary_keys=possible_primary_keys,
        profile_data=pdata,
        created_at=profile.created_at,
    )


def profile_dataset(db: Session, dataset: Dataset) -> ProfileOut:
    df = load_dataset_frame(dataset)
    kinds = classify_columns(df)
    columns_data = []

    for column in df.columns:
        series = df[column]
        kind = infer_column_kind(series)
        missing = int(series.isna().sum())
        unique = int(series.nunique(dropna=True))
        stats = numeric_summary(series) if kind == "numeric" else {}
        missing_pct = round((missing / len(df) * 100) if len(df) else 0.0, 2)

        columns_data.append(
            {
                "name": str(column),
                "kind": kind,
                "datatype": str(series.dtype),
                "unique_count": unique,
                "missing_count": missing,
                "missing_percentage": missing_pct,
                "min": json_safe(stats.get("min")),
                "max": json_safe(stats.get("max")),
                "mean": json_safe(stats.get("mean")),
                "median": json_safe(stats.get("median")),
            }
        )

    memory = int(df.memory_usage(deep=True).sum())
    missing_count = int(df.isna().sum().sum())
    duplicate_count = int(df.duplicated().sum())
    possible_primary_keys = detect_possible_primary_keys(df)

    profile_meta = {
        "memory_bytes": memory,
        "memory_mb": round(memory / (1024 * 1024), 3),
        "possible_primary_keys": possible_primary_keys,
        "column_details": columns_data,
    }

    profile = DataProfile(
        dataset_id=dataset.id,
        row_count=int(len(df)),
        column_count=int(len(df.columns)),
        columns=columns_data,
        numeric_columns=kinds["numeric_columns"],
        categorical_columns=kinds["categorical_columns"],
        date_columns=kinds["date_columns"],
        missing_count=missing_count,
        duplicate_count=duplicate_count,
        profile_data=profile_meta,
    )
    db.add(profile)

    dataset.row_count = profile.row_count
    dataset.column_count = profile.column_count
    if dataset.status in {DatasetState.UPLOADED, "profiling"}:
        dataset.status = DatasetState.PROFILED
    db.flush()

    return serialize_profile(profile)
