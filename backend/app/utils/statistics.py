import math
import numpy as np
import pandas as pd

from app.utils.helpers import json_safe


def numeric_summary(series: pd.Series) -> dict:
    """Standard 5-number summary plus mean, std, skewness and IQR."""
    clean = pd.to_numeric(series, errors="coerce").dropna()
    if clean.empty:
        return {}
    q1, q2, q3 = clean.quantile([0.25, 0.5, 0.75])
    iqr = q3 - q1
    std_val = float(clean.std()) if len(clean) > 1 else 0.0
    mean_val = float(clean.mean())
    skew_val = float(clean.skew()) if len(clean) >= 3 else 0.0
    kurt_val = float(clean.kurt()) if len(clean) >= 4 else 0.0
    
    # Outlier detection
    lower_bound = q1 - 1.5 * iqr
    upper_bound = q3 + 1.5 * iqr
    outliers_iqr = int(((clean < lower_bound) | (clean > upper_bound)).sum())
    
    coeff_var = round(std_val / abs(mean_val), 4) if mean_val != 0 else 0.0

    return {
        "count": int(clean.count()),
        "mean": json_safe(mean_val),
        "median": json_safe(float(q2)),
        "std": json_safe(std_val),
        "variance": json_safe(float(clean.var()) if len(clean) > 1 else 0.0),
        "min": json_safe(float(clean.min())),
        "max": json_safe(float(clean.max())),
        "q1": json_safe(float(q1)),
        "q3": json_safe(float(q3)),
        "iqr": json_safe(float(iqr)),
        "skewness": json_safe(skew_val),
        "kurtosis": json_safe(kurt_val),
        "coeff_variation": json_safe(coeff_var),
        "outlier_count_iqr": outliers_iqr,
        "null_count": int(series.isna().sum()),
        "zeros_count": int((clean == 0).sum()),
    }


def iqr_outlier_mask(series: pd.Series) -> pd.Series:
    numeric = pd.to_numeric(series, errors="coerce")
    q1 = numeric.quantile(0.25)
    q3 = numeric.quantile(0.75)
    iqr = q3 - q1
    if pd.isna(iqr) or iqr == 0:
        return pd.Series(False, index=series.index)
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr
    return (numeric < lower) | (numeric > upper)


def zscore_outlier_mask(series: pd.Series, threshold: float = 3.0) -> pd.Series:
    numeric = pd.to_numeric(series, errors="coerce")
    std = numeric.std()
    if not std or pd.isna(std):
        return pd.Series(False, index=series.index)
    z = (numeric - numeric.mean()) / std
    return z.abs() > threshold


def calculate_correlation_matrix(df: pd.DataFrame, columns: list[str], method: str = "pearson") -> dict:
    """Calculate Pearson or Spearman correlation matrix with interpretation pairs."""
    if len(columns) < 2:
        return {"columns": columns, "values": [], "notable_pairs": []}
        
    num_df = df[columns].apply(pd.to_numeric, errors="coerce")
    corr = num_df.corr(method=method)
    
    values = []
    for i in range(len(columns)):
        row = []
        for j in range(len(columns)):
            val = corr.iloc[i, j]
            row.append(json_safe(round(float(val), 3)) if pd.notna(val) else None)
        values.append(row)
        
    notable = []
    for i in range(len(columns)):
        for j in range(i + 1, len(columns)):
            col_a = columns[i]
            col_b = columns[j]
            r = corr.iloc[i, j]
            if pd.notna(r) and abs(r) >= 0.35:
                direction = "Positive" if r > 0 else "Negative"
                strength = "Strong" if abs(r) >= 0.7 else ("Moderate" if abs(r) >= 0.5 else "Moderate-Weak")
                notable.append({
                    "column_a": col_a,
                    "column_b": col_b,
                    "coefficient": round(float(r), 3),
                    "relationship": f"{strength} {direction} Correlation",
                    "method": method.title(),
                })
                
    notable.sort(key=lambda x: abs(x["coefficient"]), reverse=True)
    return {
        "columns": columns,
        "values": values,
        "notable_pairs": notable[:8],
        "method": method,
    }


def categorical_summary(series: pd.Series) -> dict:
    """Frequency distribution, mode, concentration index (HHI) for categorical data."""
    clean = series.dropna().astype(str)
    if clean.empty:
        return {"unique_count": 0, "categories": []}
        
    vc = clean.value_counts()
    total = len(clean)
    
    # Herfindahl-Hirschman Index for market/category concentration (0 to 1)
    shares = vc / total
    hhi = float((shares ** 2).sum())
    
    top = []
    for val, count in vc.head(15).items():
        top.append({
            "label": str(val),
            "count": int(count),
            "percentage": round(float(count / total) * 100, 2),
        })
        
    least = []
    for val, count in vc.tail(5).items():
        least.append({
            "label": str(val),
            "count": int(count),
            "percentage": round(float(count / total) * 100, 2),
        })
        
    return {
        "unique_count": int(clean.nunique()),
        "mode": str(vc.index[0]) if not vc.empty else None,
        "mode_count": int(vc.iloc[0]) if not vc.empty else 0,
        "mode_percentage": round(float(vc.iloc[0] / total) * 100, 2) if not vc.empty else 0.0,
        "top_categories": top,
        "least_categories": least,
        "concentration_hhi": round(hhi, 4),
        "is_high_concentration": hhi > 0.25,
    }


def datetime_summary(series: pd.Series) -> dict:
    """Temporal range, timespan in days, and monthly distribution."""
    parsed = pd.to_datetime(series, errors="coerce").dropna()
    if parsed.empty:
        return {}
        
    min_date = parsed.min()
    max_date = parsed.max()
    span_days = int((max_date - min_date).days)
    
    monthly_counts = parsed.dt.to_period("M").value_counts().sort_index()
    monthly = [{"period": str(p), "count": int(c)} for p, c in monthly_counts.items()]
    
    return {
        "earliest_date": str(min_date.date()),
        "latest_date": str(max_date.date()),
        "timespan_days": span_days,
        "total_valid_dates": int(len(parsed)),
        "monthly_distribution": monthly[:24],
    }
