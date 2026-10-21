import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from app.exceptions import UnprocessableError
from app.models.analysis import Analysis
from app.models.dataset import Dataset
from app.services.ingestion_service import load_dataset_frame
from app.services.workflow_service import DatasetState, require_analytics_ready, transition_dataset
from app.utils.data_types import classify_columns, classify_columns_detailed
from app.utils.helpers import json_safe
from app.utils.statistics import (
    calculate_correlation_matrix,
    categorical_summary,
    datetime_summary,
    numeric_summary,
)

ensure_analytics_ready = require_analytics_ready


def run_analytics(db: Session, dataset: Dataset, user_id: int) -> Analysis:
    require_analytics_ready(dataset)
    df = load_dataset_frame(dataset)
    if df.empty:
        raise UnprocessableError("Insufficient data for this analysis. The dataset contains 0 rows.")

    detailed_kinds = classify_columns_detailed(df)
    kinds = classify_columns(df)
    
    numeric_stats = {}
    histograms = {}
    boxplots = {}
    
    # Process numeric columns (skip identifier columns for deep stats unless explicitly needed)
    valid_numerics = [c for c in kinds["numeric_columns"] if c not in kinds.get("id_columns", [])]
    if not valid_numerics:
        valid_numerics = kinds["numeric_columns"]

    for column in valid_numerics:
        numeric = pd.to_numeric(df[column], errors="coerce").dropna()
        numeric_stats[column] = numeric_summary(df[column])
        if numeric.empty:
            continue
            
        # Freedman-Diaconis or Sturges rule for bins
        num_bins = min(15, max(5, int(np.sqrt(len(numeric)))))
        counts, bins = np.histogram(numeric, bins=num_bins)
        histograms[column] = {
            "bins": [json_safe(float(b)) for b in bins],
            "counts": [int(c) for c in counts],
        }
        q1, q2, q3 = numeric.quantile([0.25, 0.5, 0.75])
        boxplots[column] = {
            "min": json_safe(float(numeric.min())),
            "q1": json_safe(float(q1)),
            "median": json_safe(float(q2)),
            "q3": json_safe(float(q3)),
            "max": json_safe(float(numeric.max())),
        }

    # Pearson & Spearman correlation matrices
    corr_pearson = {}
    corr_spearman = {}
    if len(valid_numerics) >= 2:
        top_numerics = valid_numerics[:10]
        corr_pearson = calculate_correlation_matrix(df, top_numerics, method="pearson")
        corr_spearman = calculate_correlation_matrix(df, top_numerics, method="spearman")

    # Categorical column analysis with concentration
    categories = {}
    for column in kinds["categorical_columns"][:10]:
        categories[column] = categorical_summary(df[column])

    # Date column temporal analysis
    date_profiles = {}
    for column in kinds["date_columns"][:5]:
        date_profiles[column] = datetime_summary(df[column])

    # Overall dataset metrics
    duplicate_count = int(df.duplicated().sum())
    total_cells = df.shape[0] * df.shape[1]
    missing_cells = int(df.isna().sum().sum())
    missing_pct = round((missing_cells / max(total_cells, 1)) * 100, 2)

    results = {
        "overview": {
            "dataset_name": dataset.name,
            "row_count": int(len(df)),
            "column_count": int(len(df.columns)),
            "memory_usage_bytes": detailed_kinds["memory_bytes"],
            "numeric_count": len(kinds["numeric_columns"]),
            "categorical_count": len(kinds["categorical_columns"]),
            "date_count": len(kinds["date_columns"]),
            "duplicate_row_count": duplicate_count,
            "missing_cell_count": missing_cells,
            "missing_cell_pct": missing_pct,
            "quality_score": dataset.quality_score,
            "columns_detail": detailed_kinds["columns"],
        },
        "numeric": numeric_stats,
        "correlation": corr_pearson,
        "spearman_correlation": corr_spearman,
        "histograms": histograms,
        "boxplots": boxplots,
        "categories": categories,
        "date_profiles": date_profiles,
        "row_count": int(len(df)),
        "column_count": int(len(df.columns)),
    }

    analysis = Analysis(
        dataset_id=dataset.id,
        analysis_type="exploratory",
        parameters={
            "numeric": valid_numerics,
            "categorical": kinds["categorical_columns"],
            "date": kinds["date_columns"],
        },
        results=results,
        created_by=user_id,
    )
    db.add(analysis)
    transition_dataset(dataset, DatasetState.ANALYZED)
    db.flush()
    return analysis
