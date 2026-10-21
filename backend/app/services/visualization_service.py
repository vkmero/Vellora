import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from app.exceptions import BadRequestError, UnprocessableError
from app.models.dataset import Dataset
from app.models.quality_issue import QualityIssue
from app.models.visualization import Visualization
from app.services.analytics_service import ensure_analytics_ready
from app.services.ingestion_service import load_dataset_frame
from app.utils.data_types import classify_columns, classify_columns_detailed
from app.utils.helpers import json_safe

CHARTS = {
    "bar",
    "horizontal_bar",
    "line",
    "area",
    "pie",
    "donut",
    "scatter",
    "histogram",
    "box",
    "heatmap",
}

AGG_METHODS = {"sum", "mean", "median", "count", "min", "max", "std"}


def recommend_visualizations(dataset: Dataset, db: Session) -> list[dict]:
    """Inspect dataset columns and quality state to produce intelligent, deterministic chart recommendations."""
    df = load_dataset_frame(dataset)
    if df.empty:
        return []

    kinds = classify_columns(df)
    meta = classify_columns_detailed(df)
    
    # Identify non-ID numeric columns
    numeric_cols = [c for c in kinds["numeric_columns"] if c not in kinds.get("id_columns", [])]
    if not numeric_cols:
        numeric_cols = kinds["numeric_columns"]

    # Filter categorical columns to reasonable cardinality for charts (<= 30)
    cat_cols = []
    for c in kinds["categorical_columns"]:
        card = df[c].dropna().nunique()
        if 2 <= card <= 30:
            cat_cols.append(c)

    date_cols = kinds["date_columns"]
    recommendations = []

    # 1. TIME-BASED ANALYSIS
    if date_cols and numeric_cols:
        primary_date = date_cols[0]
        primary_num = numeric_cols[0]
        recommendations.append({
            "id": "rec_time_series",
            "title": f"Temporal Trajectory of {primary_num} Over Time",
            "category": "time_series",
            "chart_type": "line",
            "x_column": primary_date,
            "y_column": primary_num,
            "aggregation": "sum",
            "reason": f"Column '{primary_date}' contains temporal data and '{primary_num}' provides a continuous measure to analyze period-over-period trends.",
            "interpretation": f"Visualizes long-term trends, momentum, and potential cyclical patterns for {primary_num}.",
        })

    # 2. CATEGORY COMPARISONS
    if cat_cols and numeric_cols:
        primary_cat = cat_cols[0]
        primary_num = numeric_cols[0]
        recommendations.append({
            "id": "rec_category_bar",
            "title": f"Total {primary_num} by {primary_cat}",
            "category": "comparison",
            "chart_type": "bar",
            "x_column": primary_cat,
            "y_column": primary_num,
            "aggregation": "sum",
            "reason": f"Category '{primary_cat}' ({df[primary_cat].nunique()} classes) paired with numeric '{primary_num}' highlights dominant vs underperforming segments.",
            "interpretation": f"Directly compares the aggregate contribution of each {primary_cat} group to identify high-impact segments.",
        })

    # 3. RELATIONSHIP / SCATTER
    if len(numeric_cols) >= 2:
        col_x, col_y = numeric_cols[0], numeric_cols[1]
        recommendations.append({
            "id": "rec_scatter_rel",
            "title": f"Bivariate Relationship: {col_x} vs {col_y}",
            "category": "relationship",
            "chart_type": "scatter",
            "x_column": col_x,
            "y_column": col_y,
            "aggregation": "none",
            "reason": f"Both '{col_x}' and '{col_y}' are continuous variables suitable for dispersion, cluster, and correlation analysis.",
            "interpretation": f"Examines whether changes in {col_x} are associated with proportional changes in {col_y}, identifying clusters and outliers.",
        })

    # 4. NUMERICAL DISTRIBUTION (HISTOGRAM & BOX PLOT)
    if numeric_cols:
        target_num = numeric_cols[0]
        recommendations.append({
            "id": "rec_dist_hist",
            "title": f"Distribution Profile of {target_num}",
            "category": "distribution",
            "chart_type": "histogram",
            "x_column": target_num,
            "y_column": None,
            "aggregation": "count",
            "reason": f"Analyzes frequency density, skewness, and variance spread across bins for '{target_num}'.",
            "interpretation": f"Reveals whether {target_num} follows a normal distribution or exhibits significant right/left-hand skew.",
        })
        recommendations.append({
            "id": "rec_dist_box",
            "title": f"Five-Number Summary & Outlier Spread for {target_num}",
            "category": "distribution",
            "chart_type": "box",
            "x_column": target_num,
            "y_column": None,
            "aggregation": "none",
            "reason": f"Identifies IQR dispersion, median vs mean divergence, and extreme observations for '{target_num}'.",
            "interpretation": f"Pins down the median, 25th/75th percentiles, and isolates points falling outside 1.5x IQR whiskers.",
        })

    # 5. CORRELATION HEATMAP
    if len(numeric_cols) >= 3:
        recommendations.append({
            "id": "rec_corr_matrix",
            "title": "Pearson Correlation Heatmap (Multivariate)",
            "category": "relationship",
            "chart_type": "heatmap",
            "x_column": None,
            "y_column": None,
            "aggregation": "none",
            "reason": f"Dataset contains {len(numeric_cols)} numeric attributes. A heatmap reveals pairwise linear associations.",
            "interpretation": "Discovers collinearities and negative trade-offs across all key quantitative indicators.",
        })

    # 6. PART-TO-WHOLE (PIE/DONUT FOR LOW-CARDINALITY ONLY)
    for c in cat_cols:
        unique_cnt = df[c].dropna().nunique()
        if 2 <= unique_cnt <= 6 and numeric_cols:
            recommendations.append({
                "id": f"rec_part_whole_{c}",
                "title": f"Share of {numeric_cols[0]} by {c}",
                "category": "part_to_whole",
                "chart_type": "pie",
                "x_column": c,
                "y_column": numeric_cols[0],
                "aggregation": "sum",
                "reason": f"Column '{c}' has only {unique_cnt} categories, ideal for a readable part-to-whole contribution chart.",
                "interpretation": f"Shows the proportional percentage share of {numeric_cols[0]} commanded by each {c}.",
            })
            break

    # 7. DATA QUALITY / MISSING VALUES
    issues = db.query(QualityIssue).filter(QualityIssue.dataset_id == dataset.id).all()
    missing_by_col = df.isna().sum()
    cols_with_missing = missing_by_col[missing_by_col > 0]
    if not cols_with_missing.empty:
        recommendations.append({
            "id": "rec_quality_missing",
            "title": "Data Quality: Missing Value Count by Column",
            "category": "quality",
            "chart_type": "bar",
            "x_column": "Column",
            "y_column": "Missing Count",
            "aggregation": "none",
            "reason": f"Found {len(cols_with_missing)} columns with incomplete values requiring quality remediation.",
            "interpretation": "Pinpoints columns with high missing ratios to guide cleaning and validation.",
        })

    return recommendations


def generate_chart_data(df: pd.DataFrame, chart: str, x_col: str | None, y_col: str | None, payload: dict) -> tuple[list | dict, str]:
    """Execute aggregation, filtering, and transformation to generate visualization payload."""
    aggregation = (payload.get("aggregation") or "sum").lower()
    group_by = payload.get("group_by") or payload.get("category")
    sort_by = payload.get("sort_by", "val_desc")
    filters = payload.get("filters", [])
    time_bucket = payload.get("time_bucket", "month")
    data = []
    interpretation = ""

    # Apply optional filters
    filtered_df = df.copy()
    if filters and isinstance(filters, list):
        for f in filters:
            f_col = f.get("column")
            f_op = f.get("operator")
            f_val = f.get("value")
            if f_col in filtered_df.columns and f_val is not None:
                if f_op == "equals":
                    filtered_df = filtered_df[filtered_df[f_col].astype(str) == str(f_val)]
                elif f_op == "not_equals":
                    filtered_df = filtered_df[filtered_df[f_col].astype(str) != str(f_val)]
                elif f_op == "greater_than":
                    num_val = pd.to_numeric(f_val, errors="coerce")
                    if pd.notna(num_val):
                        filtered_df = filtered_df[pd.to_numeric(filtered_df[f_col], errors="coerce") > num_val]
                elif f_op == "less_than":
                    num_val = pd.to_numeric(f_val, errors="coerce")
                    if pd.notna(num_val):
                        filtered_df = filtered_df[pd.to_numeric(filtered_df[f_col], errors="coerce") < num_val]

    if filtered_df.empty:
        return [], "No records match the active filter criteria."

    # Process by Chart Type
    if chart in {"bar", "horizontal_bar", "line", "area", "pie", "donut"}:
        if not x_col:
            raise BadRequestError("An X axis column is required.")

        # Check if X is datetime and time aggregation is requested
        x_is_dt = False
        parsed_dates = pd.to_datetime(filtered_df[x_col], errors="coerce")
        if parsed_dates.notna().mean() >= 0.7:
            x_is_dt = True
            bucket_code = {"day": "D", "week": "W", "month": "ME", "quarter": "QE", "year": "YE"}.get(time_bucket, "ME")
            filtered_df["_dt_bucket"] = parsed_dates.dt.to_period(time_bucket[0].upper()).astype(str)
            x_key = "_dt_bucket"
        else:
            x_key = x_col

        if y_col and y_col in filtered_df.columns:
            numeric_y = pd.to_numeric(filtered_df[y_col], errors="coerce")
            filtered_df["_y"] = numeric_y

            # Check if group_by is requested
            if group_by and group_by in filtered_df.columns and group_by != x_key:
                top_groups = filtered_df[group_by].dropna().value_counts().head(5).index.tolist()
                sub_df = filtered_df[filtered_df[group_by].isin(top_groups)]
                
                grouped = sub_df.groupby([x_key, group_by])["_y"]
                agg_func = "mean" if aggregation == "mean" else ("count" if aggregation == "count" else "sum")
                res_series = grouped.agg(agg_func).unstack(fill_value=0)
                
                data = []
                for idx, row in res_series.head(25).iterrows():
                    item = {"label": str(idx)}
                    for g in top_groups:
                        val = row.get(g, 0)
                        item[str(g)] = json_safe(round(float(val), 2)) if pd.notna(val) else 0
                    data.append(item)
                interpretation = f"Grouped {chart} showing {aggregation} of {y_col} across {x_col} partitioned by top categories of {group_by}."
            else:
                agg_map = {
                    "sum": "sum",
                    "mean": "mean",
                    "median": "median",
                    "count": "count",
                    "min": "min",
                    "max": "max",
                    "std": "std",
                }
                agg_op = agg_map.get(aggregation, "sum")
                grouped = filtered_df.groupby(x_key, dropna=True)["_y"].agg(agg_op)

                if sort_by == "val_desc":
                    grouped = grouped.sort_values(ascending=False)
                elif sort_by == "val_asc":
                    grouped = grouped.sort_values(ascending=True)
                elif sort_by == "label_asc":
                    grouped = grouped.sort_index(ascending=True)
                elif sort_by == "label_desc":
                    grouped = grouped.sort_index(ascending=False)

                series = grouped.head(30)
                data = [
                    {"label": str(i), "value": json_safe(round(float(v), 2)) if pd.notna(v) else 0}
                    for i, v in series.items()
                ]
                
                # Derive business interpretation
                if not series.empty:
                    top_label = str(series.index[0])
                    top_val = round(float(series.iloc[0]), 2)
                    total_agg = round(float(series.sum()), 2)
                    share_pct = round((top_val / max(total_agg, 0.001)) * 100, 1) if total_agg > 0 else 0
                    interpretation = f"Highest recorded value observed in '{top_label}' with {top_val} ({share_pct}% share of top entries). Total {aggregation} evaluated across {len(series)} categories."
        else:
            # Frequency count of X
            vc = filtered_df[x_key].dropna().value_counts()
            if sort_by == "label_asc":
                vc = vc.sort_index(ascending=True)
            elif sort_by == "val_asc":
                vc = vc.sort_values(ascending=True)
            else:
                vc = vc.sort_values(ascending=False)

            data = [{"label": str(i), "value": int(v)} for i, v in vc.head(30).items()]
            if not vc.empty:
                interpretation = f"Category '{vc.index[0]}' represents the mode frequency with {vc.iloc[0]} occurrences out of {len(filtered_df)} total records."

    elif chart == "scatter":
        if not x_col or not y_col:
            raise BadRequestError("Scatter charts require both X and Y numeric columns.")
        num_x = pd.to_numeric(filtered_df[x_col], errors="coerce")
        num_y = pd.to_numeric(filtered_df[y_col], errors="coerce")
        clean_df = pd.DataFrame({"x": num_x, "y": num_y}).dropna()

        if clean_df.empty:
            raise UnprocessableError("No valid paired numeric points found for scatter plot.")

        corr_val = clean_df["x"].corr(clean_df["y"])
        corr_str = f"r = {corr_val:.2f}" if pd.notna(corr_val) else "N/A"

        sample = clean_df.head(350)
        data = [
            {"x": json_safe(round(float(r["x"]), 3)), "y": json_safe(round(float(r["y"]), 3))}
            for _, r in sample.iterrows()
        ]
        interpretation = f"Scatter plot of {len(sample)} paired observations between {x_col} and {y_col}. Pearson correlation coefficient is {corr_str}. Notice: Correlation illustrates empirical association, not direct causation."

    elif chart == "histogram":
        col = y_col or x_col
        if not col:
            raise BadRequestError("A numeric column is required for a histogram.")
        numeric = pd.to_numeric(filtered_df[col], errors="coerce").dropna()
        if numeric.empty:
            raise UnprocessableError("Selected column contains no numeric data.")

        num_bins = min(15, max(5, int(np.sqrt(len(numeric)))))
        counts, bin_edges = np.histogram(numeric, bins=num_bins)
        data = [
            {
                "label": f"{bin_edges[i]:.1f} - {bin_edges[i+1]:.1f}",
                "value": int(counts[i]),
                "bin_start": json_safe(float(bin_edges[i])),
                "bin_end": json_safe(float(bin_edges[i+1])),
            }
            for i in range(len(counts))
        ]
        mean_v = float(numeric.mean())
        median_v = float(numeric.median())
        skew_v = float(numeric.skew()) if len(numeric) >= 3 else 0.0
        skew_desc = "symmetrical" if abs(skew_v) < 0.5 else ("positively right-skewed" if skew_v > 0 else "negatively left-skewed")
        interpretation = f"Frequency histogram for {col} across {num_bins} bins. Distribution is {skew_desc} (skewness: {skew_v:.2f}), with mean {mean_v:.2f} and median {median_v:.2f}."

    elif chart == "box":
        col = y_col or x_col
        if not col:
            raise BadRequestError("A numeric column is required for a box plot.")
        numeric = pd.to_numeric(filtered_df[col], errors="coerce").dropna()
        if numeric.empty:
            raise UnprocessableError("Selected column contains no numeric data.")

        q1, q2, q3 = numeric.quantile([0.25, 0.5, 0.75])
        iqr = q3 - q1
        min_v = float(numeric.min())
        max_v = float(numeric.max())
        lower_whisker = max(min_v, float(q1 - 1.5 * iqr))
        upper_whisker = min(max_v, float(q3 + 1.5 * iqr))
        outliers_count = int(((numeric < lower_whisker) | (numeric > upper_whisker)).sum())

        data = [{
            "column": col,
            "min": json_safe(round(min_v, 2)),
            "lower_whisker": json_safe(round(lower_whisker, 2)),
            "q1": json_safe(round(float(q1), 2)),
            "median": json_safe(round(float(q2), 2)),
            "q3": json_safe(round(float(q3), 2)),
            "upper_whisker": json_safe(round(upper_whisker, 2)),
            "max": json_safe(round(max_v, 2)),
            "iqr": json_safe(round(float(iqr), 2)),
            "outlier_count": outliers_count,
        }]
        interpretation = f"Box plot five-number summary for {col}. Median is {q2:.2f} with IQR range {q1:.2f} to {q3:.2f}. Identified {outliers_count} points outside the 1.5x IQR whiskers."

    elif chart == "heatmap":
        kinds = classify_columns(filtered_df)
        numeric_cols = [c for c in kinds["numeric_columns"] if c not in kinds.get("id_columns", [])][:8]
        if len(numeric_cols) < 2:
            numeric_cols = kinds["numeric_columns"][:8]
        if len(numeric_cols) < 2:
            raise UnprocessableError("A heatmap requires at least 2 distinct numeric columns.")

        matrix = filtered_df[numeric_cols].apply(pd.to_numeric, errors="coerce").corr()
        data = {
            "columns": numeric_cols,
            "values": [
                [
                    json_safe(round(float(matrix.iloc[i, j]), 2)) if pd.notna(matrix.iloc[i, j]) else None
                    for j in range(len(numeric_cols))
                ]
                for i in range(len(numeric_cols))
            ],
        }
        interpretation = f"Multivariate correlation matrix across {len(numeric_cols)} numeric indicators. Darker cells represent stronger positive or negative relationships. Correlation does not imply causation."

    return data, interpretation


def build_visualization(db: Session, dataset: Dataset, user_id: int, payload: dict) -> Visualization:
    """Validate, construct, and persist an interactive visualization."""
    ensure_analytics_ready(dataset)
    chart = payload.get("chart_type", "bar").lower()
    if chart not in CHARTS:
        raise BadRequestError(f"Unsupported chart type '{chart}'. Supported types: {sorted(list(CHARTS))}")

    df = load_dataset_frame(dataset)
    if df.empty:
        raise UnprocessableError("Dataset is empty. Cannot generate visual plot.")

    x_col = payload.get("x_column")
    y_col = payload.get("y_column")
    category = payload.get("category")
    aggregation = (payload.get("aggregation") or "sum").lower()
    title = payload.get("title")

    data, interpretation = generate_chart_data(df, chart, x_col, y_col, payload)

    config = {
        "category": category,
        "aggregation": aggregation,
        "data": data,
        "interpretation": interpretation,
        "title": title or f"{chart.title()} of {x_col or ''} {('vs ' + y_col) if y_col else ''}".strip(),
        "filters": payload.get("filters", []),
        "group_by": payload.get("group_by"),
        "sort_by": payload.get("sort_by", "val_desc"),
        "time_bucket": payload.get("time_bucket", "month"),
    }

    viz = Visualization(
        dataset_id=dataset.id,
        chart_type=chart,
        x_column=x_col,
        y_column=y_col,
        configuration=config,
        created_by=user_id,
    )
    db.add(viz)
    db.flush()
    return viz
