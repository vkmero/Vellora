import re
import pandas as pd
from app.utils.helpers import json_safe


def is_identifier_column(series: pd.Series, col_name: str) -> bool:
    """Detect if a column behaves like a primary key or surrogate record identifier."""
    name_clean = str(col_name).strip().lower()
    id_patterns = [r"^id$", r"_id$", r"id_", r"^uuid$", r"^guid$", r"^code$", r"^key$", r"^index$", r"^row_id$"]
    name_suggests_id = any(re.search(pat, name_clean) for pat in id_patterns)
    
    clean = series.dropna()
    if clean.empty:
        return False
        
    unique_ratio = clean.nunique() / len(clean)
    if name_suggests_id and unique_ratio > 0.8:
        return True
    if unique_ratio == 1.0 and len(clean) > 20 and pd.api.types.is_integer_dtype(series):
        # Monotonically increasing or continuous unique integers
        return True
    return False


def infer_column_kind(series: pd.Series) -> str:
    """Infer the general semantic kind of a pandas Series."""
    if pd.api.types.is_bool_dtype(series):
        return "boolean"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "datetime"
    if pd.api.types.is_numeric_dtype(series):
        return "numeric"
    
    sample = series.dropna().astype(str).head(60)
    if sample.empty:
        return "categorical"
        
    # Check if string date
    parsed = pd.to_datetime(sample, errors="coerce")
    if parsed.notna().mean() >= 0.8:
        return "datetime"
        
    # Check if formatted numeric (e.g. currency, commas)
    numeric = pd.to_numeric(sample.str.replace(",", "", regex=False).str.replace("$", "", regex=False), errors="coerce")
    if numeric.notna().mean() >= 0.8:
        return "numeric"
        
    # Check if boolean strings
    lowered = sample.str.lower()
    if lowered.isin(["true", "false", "yes", "no", "0", "1", "t", "f"]).mean() >= 0.9:
        return "boolean"
        
    return "categorical"


def classify_columns(df: pd.DataFrame) -> dict[str, list[str]]:
    """Legacy backward-compatible column classifier."""
    numeric, categorical, dates, booleans, ids = [], [], [], [], []
    for column in df.columns:
        kind = infer_column_kind(df[column])
        is_id = is_identifier_column(df[column], column)
        if is_id:
            ids.append(column)
            
        if kind == "numeric":
            numeric.append(column)
        elif kind == "datetime":
            dates.append(column)
        elif kind == "boolean":
            booleans.append(column)
        else:
            categorical.append(column)
            
    return {
        "numeric_columns": numeric,
        "categorical_columns": categorical,
        "date_columns": dates,
        "boolean_columns": booleans,
        "id_columns": ids,
    }


def classify_columns_detailed(df: pd.DataFrame) -> dict:
    """Detailed structural and statistical classification for Chart Explorer and profiling."""
    classified = classify_columns(df)
    meta_columns = []
    
    for col in df.columns:
        series = df[col]
        kind = infer_column_kind(series)
        is_id = is_identifier_column(series, col)
        clean = series.dropna()
        cardinality = int(clean.nunique())
        null_count = int(series.isna().sum())
        null_pct = round(float(null_count / max(len(series), 1)) * 100, 2)
        
        sample_vals = [str(v) for v in clean.unique()[:5]]
        
        min_val, max_val = None, None
        if kind == "numeric":
            num = pd.to_numeric(clean, errors="coerce").dropna()
            if not num.empty:
                min_val = json_safe(float(num.min()))
                max_val = json_safe(float(num.max()))
        elif kind == "datetime":
            dt = pd.to_datetime(clean, errors="coerce").dropna()
            if not dt.empty:
                min_val = str(dt.min().date())
                max_val = str(dt.max().date())
                
        meta_columns.append({
            "name": str(col),
            "kind": kind,
            "is_identifier": is_id,
            "cardinality": cardinality,
            "null_count": null_count,
            "null_pct": null_pct,
            "sample_values": sample_vals,
            "min": min_val,
            "max": max_val,
        })
        
    return {
        "columns": meta_columns,
        "numeric_columns": classified["numeric_columns"],
        "categorical_columns": classified["categorical_columns"],
        "date_columns": classified["date_columns"],
        "boolean_columns": classified.get("boolean_columns", []),
        "id_columns": classified.get("id_columns", []),
        "row_count": int(len(df)),
        "column_count": int(len(df.columns)),
        "memory_bytes": int(df.memory_usage(deep=True).sum()),
    }
