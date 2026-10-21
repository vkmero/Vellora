import re
import numpy as np
import pandas as pd
from sqlalchemy.orm import Session

from app.exceptions import UnprocessableError
from app.models.dataset import Dataset
from app.models.insight import Insight
from app.models.quality_issue import QualityIssue
from app.services.ingestion_service import load_dataset_frame
from app.services.workflow_service import require_analytics_ready
from app.utils.data_types import classify_columns
from app.utils.helpers import json_safe


KEYWORDS = {
    "revenue": ["revenue", "sales", "turnover", "gross_sales", "income"],
    "profit": ["profit", "net_profit", "margin", "earnings"],
    "cost": ["cost", "expense", "cogs", "expenditure"],
    "quantity": ["quantity", "qty", "volume", "units", "items"],
    "price": ["price", "unit_price", "rate", "cost_per_unit"],
    "discount": ["discount", "rebate", "markdown"],
    "category": ["category", "segment", "type", "department", "genre", "product_category"],
    "product": ["product", "item", "sku", "service", "article"],
    "customer": ["customer", "client", "user", "buyer", "account"],
    "region": ["region", "city", "state", "country", "territory", "location", "zone"],
    "date": ["date", "order_date", "timestamp", "datetime", "created_at", "transaction_date"],
    "score": ["score", "marks", "grade", "rating", "points", "gpa"],
    "attendance": ["attendance", "presence", "participation"],
}


def _match_semantic_columns(df: pd.DataFrame) -> dict[str, str]:
    mapping = {}
    lowered = {c: str(c).strip().lower() for c in df.columns}
    for sem_key, aliases in KEYWORDS.items():
        for col, col_lower in lowered.items():
            if any(alias == col_lower or alias in col_lower for alias in aliases):
                mapping[sem_key] = col
                break
    return mapping


def _assess_reliability(valid_n: int, missing_ratio: float) -> tuple[str, str]:
    if valid_n >= 50 and missing_ratio < 0.05:
        return "High", f"Calculation supported by robust statistical sample (N={valid_n}) with <5% missingness."
    elif valid_n >= 15 and missing_ratio < 0.25:
        return "Moderate", f"Supported by moderate sample (N={valid_n}). Results are directionally indicative."
    else:
        return "Limited evidence", f"Small sample size or higher missingness (N={valid_n}). Treat findings with caution."


def generate_insights(db: Session, dataset: Dataset) -> list[Insight]:
    """Multi-domain, deterministic insights synthesis engine."""
    require_analytics_ready(dataset)
    df = load_dataset_frame(dataset)
    if df.empty:
        raise UnprocessableError("Insufficient data for insight synthesis. The dataset is empty.")

    kinds = classify_columns(df)
    semantic = _match_semantic_columns(df)
    n_rows = len(df)
    
    numeric_cols = [c for c in kinds["numeric_columns"] if c not in kinds.get("id_columns", [])]
    if not numeric_cols:
        numeric_cols = kinds["numeric_columns"]
        
    cat_cols = kinds["categorical_columns"]
    date_cols = kinds["date_columns"]

    created_insights = []

    def register(category, title, description, metric_label, metric_value, evidence_data, severity, recommendation, interpretation, action, reliability_tuple, chart_preview=None):
        rel_level, rel_reason = reliability_tuple
        full_evidence = {
            "supporting_metric": {"label": metric_label, "value": metric_value},
            "evidence_data": evidence_data,
            "business_interpretation": interpretation,
            "suggested_action": action,
            "reliability": rel_level,
            "reliability_reason": rel_reason,
        }
        if chart_preview:
            full_evidence["chart_preview"] = chart_preview

        insight = Insight(
            dataset_id=dataset.id,
            category=category,
            title=title,
            description=description,
            evidence=full_evidence,
            severity=severity,
            recommendation=recommendation,
        )
        db.add(insight)
        created_insights.append(insight)

    # =========================================================================
    # MODULE A: PERFORMANCE INSIGHTS (Category Contributions & Dominance)
    # =========================================================================
    for cat_col in cat_cols[:4]:
        clean_cat = df[cat_col].dropna()
        if 2 <= clean_cat.nunique() <= 40 and numeric_cols:
            num_col = numeric_cols[0]
            grouped = df.groupby(cat_col, dropna=True)[num_col].apply(lambda s: pd.to_numeric(s, errors="coerce").sum())
            grouped = grouped.sort_values(ascending=False)
            total_sum = grouped.sum()
            
            if total_sum > 0 and len(grouped) >= 2:
                top_cat = str(grouped.index[0])
                top_val = float(grouped.iloc[0])
                top_pct = round((top_val / total_sum) * 100, 1)
                
                # Check for dominance
                if top_pct >= 30.0:
                    sev = "High" if top_pct >= 50.0 else "Medium"
                    preview_data = [{"label": str(k), "value": json_safe(round(float(v), 2))} for k, v in grouped.head(6).items()]
                    register(
                        category="performance",
                        title=f"Category Concentration: '{top_cat}' Commands {top_pct}% of {num_col}",
                        description=f"A single category segment '{top_cat}' accounts for {top_pct}% of total aggregate {num_col} ({json_safe(round(top_val, 2))}).",
                        metric_label="Top Category Share",
                        metric_value=f"{top_pct}%",
                        evidence_data={"category_column": cat_col, "metric_column": num_col, "top_category": top_cat, "total_value": json_safe(round(total_sum, 2))},
                        severity=sev,
                        recommendation=f"Protect and scale operational delivery for '{top_cat}', while cultivating secondary segments to reduce dependency risk.",
                        interpretation=f"When one category commands {top_pct}% of volume, shifts in customer demand or market competition in this segment directly impact overall performance.",
                        action=f"Conduct a deep-dive review into '{top_cat}' growth drivers versus the remaining {len(grouped)-1} categories.",
                        reliability_tuple=_assess_reliability(len(df), df[cat_col].isna().mean()),
                        chart_preview={"type": "bar", "data": preview_data},
                    )

                # Bottom performer
                bottom_cat = str(grouped.index[-1])
                bottom_val = float(grouped.iloc[-1])
                bottom_pct = round((bottom_val / total_sum) * 100, 2)
                if bottom_pct < 5.0 and len(grouped) >= 4:
                    register(
                        category="performance",
                        title=f"Underperforming Category: '{bottom_cat}' (Only {bottom_pct}% of {num_col})",
                        description=f"Category '{bottom_cat}' contributed the lowest aggregate {num_col} ({json_safe(round(bottom_val, 2))}), representing less than {bottom_pct}% of total.",
                        metric_label="Bottom Segment Share",
                        metric_value=f"{bottom_pct}%",
                        evidence_data={"category": bottom_cat, "value": json_safe(round(bottom_val, 2)), "share_pct": bottom_pct},
                        severity="Medium",
                        recommendation=f"Evaluate whether '{bottom_cat}' should be restructured, repriced, bundled, or phased out to optimize resource allocation.",
                        interpretation="Persistently low-yield categories consume overhead and catalog complexity without driving meaningful aggregate return.",
                        action=f"Assess unit economics and cost of service for '{bottom_cat}'.",
                        reliability_tuple=_assess_reliability(len(df), df[cat_col].isna().mean()),
                    )
            break

    # =========================================================================
    # MODULE B: TREND INSIGHTS (Temporal Trajectory)
    # =========================================================================
    if date_cols and numeric_cols:
        d_col = date_cols[0]
        m_col = numeric_cols[0]
        parsed_dates = pd.to_datetime(df[d_col], errors="coerce")
        numeric_vals = pd.to_numeric(df[m_col], errors="coerce")
        time_df = pd.DataFrame({"dt": parsed_dates, "val": numeric_vals}).dropna()
        
        if len(time_df) >= 4:
            monthly = time_df.set_index("dt").resample("ME")["val"].sum()
            monthly = monthly[monthly > 0]
            if len(monthly) >= 2:
                latest_p = float(monthly.iloc[-1])
                prev_p = float(monthly.iloc[-2])
                delta_abs = latest_p - prev_p
                pct_change = round(((latest_p - prev_p) / max(abs(prev_p), 0.001)) * 100, 1)
                
                trend_direction = "Growth" if delta_abs > 0 else "Decline"
                sev = "High" if (delta_abs < 0 and abs(pct_change) > 15) else "Informational"
                chart_pts = [{"label": str(idx.date()), "value": json_safe(round(float(v), 2))} for idx, v in monthly.tail(8).items()]
                
                register(
                    category="trend",
                    title=f"Period-over-Period {trend_direction}: {abs(pct_change)}% Delta in {m_col}",
                    description=f"In the most recent evaluated period, aggregate {m_col} transitioned from {json_safe(round(prev_p, 2))} to {json_safe(round(latest_p, 2))} ({'+' if delta_abs > 0 else ''}{pct_change}%).",
                    metric_label="Period Growth Rate",
                    metric_value=f"{'+' if delta_abs > 0 else ''}{pct_change}%",
                    evidence_data={"metric": m_col, "latest": json_safe(round(latest_p, 2)), "previous": json_safe(round(prev_p, 2)), "delta": json_safe(round(delta_abs, 2))},
                    severity=sev,
                    recommendation=f"Analyze drivers behind the {trend_direction.lower()} (such as seasonal volume, retention changes, or pricing shifts).",
                    interpretation=f"Period-over-period variations in {m_col} reflect operational momentum. Double-digit contractions demand prompt diagnostic inspection.",
                    action=f"Compare cohort or product-level contributions between {monthly.index[-2].strftime('%b %Y')} and {monthly.index[-1].strftime('%b %Y')}.",
                    reliability_tuple=_assess_reliability(len(time_df), 1.0 - (len(time_df) / max(len(df), 1))),
                    chart_preview={"type": "line", "data": chart_pts},
                )

    # =========================================================================
    # MODULE C: DISTRIBUTION INSIGHTS (Skewness & Outlier Variance)
    # =========================================================================
    for num_col in numeric_cols[:4]:
        series = pd.to_numeric(df[num_col], errors="coerce").dropna()
        if len(series) >= 10:
            mean_v = float(series.mean())
            median_v = float(series.median())
            std_v = float(series.std()) if len(series) > 1 else 0.0
            skew_v = float(series.skew()) if len(series) >= 3 else 0.0
            
            # 1. Skewness / Mean vs Median Divergence
            if abs(skew_v) >= 0.8:
                skew_type = "Right-Hand (Positive)" if skew_v > 0 else "Left-Hand (Negative)"
                divergence_pct = round((abs(mean_v - median_v) / max(abs(median_v), 0.001)) * 100, 1)
                register(
                    category="distribution",
                    title=f"Asymmetric Distribution: '{num_col}' Shows {skew_type} Skew",
                    description=f"'{num_col}' exhibits an asymmetric distribution (skewness: {skew_v:.2f}). Mean ({mean_v:.2f}) diverges from median ({median_v:.2f}) by {divergence_pct}%.",
                    metric_label="Skewness Coefficient",
                    metric_value=f"{skew_v:.2f}",
                    evidence_data={"mean": json_safe(round(mean_v, 2)), "median": json_safe(round(median_v, 2)), "skewness": json_safe(round(skew_v, 2)), "std": json_safe(round(std_v, 2))},
                    severity="Informational",
                    recommendation=f"Use median values rather than arithmetic means as baseline KPIs for '{num_col}' to prevent distortion from outlier values.",
                    interpretation="In heavily skewed data, standard averages misrepresent the typical record experience because extreme records pull the mean upwards or downwards.",
                    action="Adopt median and interquartile range (IQR) as standard reporting benchmarks for this metric.",
                    reliability_tuple=_assess_reliability(len(series), df[num_col].isna().mean()),
                )

            # 2. IQR Outliers
            q1, q3 = series.quantile([0.25, 0.75])
            iqr = q3 - q1
            if iqr > 0:
                lower_b = q1 - 1.5 * iqr
                upper_b = q3 + 1.5 * iqr
                outliers = series[(series < lower_b) | (series > upper_b)]
                if len(outliers) > 0:
                    outlier_pct = round((len(outliers) / len(series)) * 100, 1)
                    sev = "High" if outlier_pct > 5.0 else "Medium"
                    register(
                        category="distribution",
                        title=f"Extreme Dispersion: {len(outliers)} Outlier Records Detected in '{num_col}'",
                        description=f"Identified {len(outliers)} values ({outlier_pct}% of valid records) falling outside the 1.5x IQR boundaries (valid range: [{lower_b:.2f}, {upper_b:.2f}]).",
                        metric_label="Outlier Count",
                        metric_value=f"{len(outliers)} ({outlier_pct}%)",
                        evidence_data={"outlier_count": len(outliers), "outlier_percentage": outlier_pct, "lower_bound": json_safe(round(lower_b, 2)), "upper_bound": json_safe(round(upper_b, 2))},
                        severity=sev,
                        recommendation=f"Audit these outlier rows in the Cleaning Studio to determine whether they represent valid enterprise transactions or data entry anomalies.",
                        interpretation="Extreme values skew analytical totals, destabilize linear regression coefficients, and can conceal typical operational patterns.",
                        action="Inspect the top 5 maximum and minimum records in the Dataset Observatory to confirm legitimacy.",
                        reliability_tuple=_assess_reliability(len(series), df[num_col].isna().mean()),
                    )
            break

    # =========================================================================
    # MODULE D: RELATIONSHIP INSIGHTS (Bivariate Correlation & Association)
    # =========================================================================
    if len(numeric_cols) >= 2:
        checked_pairs = 0
        for i in range(len(numeric_cols)):
            for j in range(i + 1, len(numeric_cols)):
                col_a = numeric_cols[i]
                col_b = numeric_cols[j]
                paired = df[[col_a, col_b]].apply(pd.to_numeric, errors="coerce").dropna()
                
                if len(paired) >= 12:
                    r_val = float(paired[col_a].corr(paired[col_b]))
                    rho_val = float(paired[col_a].corr(paired[col_b], method="spearman"))
                    
                    if pd.notna(r_val) and abs(r_val) >= 0.45:
                        direction = "Positive" if r_val > 0 else "Negative"
                        strength = "Strong" if abs(r_val) >= 0.70 else "Moderate"
                        sample_pts = [{"x": json_safe(round(float(r[col_a]), 2)), "y": json_safe(round(float(r[col_b]), 2))} for _, r in paired.head(40).iterrows()]
                        
                        register(
                            category="relationship",
                            title=f"Linear Co-Variation: {strength} {direction} Correlation Between {col_a} and {col_b}",
                            description=f"Pearson correlation coefficient between '{col_a}' and '{col_b}' is r = {r_val:.2f} (Spearman rank rho = {rho_val:.2f}) across {len(paired)} paired observations.",
                            metric_label="Pearson Correlation (r)",
                            metric_value=f"{r_val:.2f}",
                            evidence_data={"column_x": col_a, "column_y": col_b, "pearson_r": json_safe(round(r_val, 3)), "spearman_rho": json_safe(round(rho_val, 3)), "sample_size": len(paired)},
                            severity="Informational",
                            recommendation=f"Leverage '{col_a}' as a predictive feature when modeling '{col_b}' in the Predictive Intelligence Lab.",
                            interpretation=f"Empirical association suggests that when {col_a} shifts, {col_b} reliably shifts in a {direction.lower()} direction. Note: Correlation illustrates statistical co-occurrence and does not prove direct causality.",
                            action=f"Test bivariate interaction terms in machine learning estimators.",
                            reliability_tuple=_assess_reliability(len(paired), 1.0 - (len(paired)/len(df))),
                            chart_preview={"type": "scatter", "data": sample_pts},
                        )
                        checked_pairs += 1
                        if checked_pairs >= 2:
                            break
            if checked_pairs >= 2:
                break

    # =========================================================================
    # MODULE E: DATA QUALITY & GOVERNANCE INSIGHTS
    # =========================================================================
    # Check null percentages across all columns
    high_null_cols = []
    for c in df.columns:
        null_ratio = float(df[c].isna().mean())
        if null_ratio >= 0.05:
            high_null_cols.append({"column": c, "pct": round(null_ratio * 100, 1), "count": int(df[c].isna().sum())})
            
    if high_null_cols:
        worst_col = max(high_null_cols, key=lambda x: x["pct"])
        register(
            category="quality",
            title=f"Data Completeness Risk: {worst_col['pct']}% Missing Values in '{worst_col['column']}'",
            description=f"Column '{worst_col['column']}' is missing {worst_col['count']} values ({worst_col['pct']}% of records). {len(high_null_cols)} column(s) have elevated null ratios.",
            metric_label="Missing Cell Ratio",
            metric_value=f"{worst_col['pct']}%",
            evidence_data={"worst_column": worst_col["column"], "affected_columns": high_null_cols},
            severity="High" if worst_col["pct"] > 20 else "Medium",
            recommendation=f"Execute mean or median imputation in the Cleaning Studio to restore analytical completeness before modeling.",
            interpretation="Missing entries bias statistical samples, reduce statistical power, and trigger unexpected errors in downstream BI tools.",
            action=f"Open Cleaning Studio and apply an imputation remediation to '{worst_col['column']}'.",
            reliability_tuple=("High", "Exact cell audit across entire stored dataset."),
        )

    # Check duplicates
    dup_rows = int(df.duplicated().sum())
    if dup_rows > 0:
        dup_pct = round((dup_rows / max(n_rows, 1)) * 100, 1)
        register(
            category="quality",
            title=f"Redundancy Vulnerability: {dup_rows} Duplicate Records Present",
            description=f"Found {dup_rows} exact duplicate rows ({dup_pct}% of total records) inflating volume and skewing aggregate metrics.",
            metric_label="Duplicate Row Count",
            metric_value=f"{dup_rows} ({dup_pct}%)",
            evidence_data={"duplicate_count": dup_rows, "percentage": dup_pct},
            severity="High",
            recommendation="Apply 'Remove Exact Duplicates' in the Cleaning Studio to ensure data integrity.",
            interpretation="Duplicate entries artificially inflate KPIs such as total revenue, distort count statistics, and create false analytical volume.",
            action="Submit a deduplication transformation to the Governance Manager Gate.",
            reliability_tuple=("High", "Deterministic hash comparison across all dataset rows."),
        )

    # =========================================================================
    # MODULE F: BUSINESS / DOMAIN OPPORTUNITY INSIGHTS (When Domain Columns Exist)
    # =========================================================================
    # 1. Commercial / Financial (Profit Margin & Discrepancies)
    if "revenue" in semantic and "profit" in semantic:
        rev_col = semantic["revenue"]
        prof_col = semantic["profit"]
        rev_series = pd.to_numeric(df[rev_col], errors="coerce")
        prof_series = pd.to_numeric(df[prof_col], errors="coerce")
        valid_fin = pd.DataFrame({"rev": rev_series, "prof": prof_series}).dropna()
        valid_fin = valid_fin[valid_fin["rev"] > 0]
        
        if len(valid_fin) >= 5:
            margins = (valid_fin["prof"] / valid_fin["rev"]) * 100
            avg_margin = float(margins.mean())
            loss_rows = int((valid_fin["prof"] < 0).sum())
            loss_pct = round((loss_rows / len(valid_fin)) * 100, 1)
            
            # Margin health
            margin_sev = "High" if avg_margin < 10.0 or loss_rows > 0 else "Informational"
            register(
                category="opportunity",
                title=f"Profitability Index: Average Margin is {avg_margin:.1f}% ({loss_rows} Unprofitable Transactions)",
                description=f"Enterprise margin averages {avg_margin:.1f}%. Detected {loss_rows} transactions ({loss_pct}%) operating at a negative net margin.",
                metric_label="Average Profit Margin",
                metric_value=f"{avg_margin:.1f}%",
                evidence_data={"average_margin_pct": json_safe(round(avg_margin, 2)), "unprofitable_transactions": loss_rows, "unprofitable_pct": loss_pct},
                severity=margin_sev,
                recommendation="Investigate discount structures and COGS for unprofitable transactions to plug margin leakage.",
                interpretation="High topline revenue can conceal operational losses if individual products or contracts operate at negative net margins.",
                action="Review discount authorizations and cost allocations on transactions where profit < 0.",
                reliability_tuple=_assess_reliability(len(valid_fin), 1.0 - (len(valid_fin)/len(df))),
            )

            # High-Revenue / Low-Margin Discrepancy
            if "product" in semantic or "category" in semantic:
                group_entity = semantic.get("product") or semantic.get("category")
                prod_agg = df.groupby(group_entity).agg(
                    total_rev=(rev_col, lambda s: pd.to_numeric(s, errors="coerce").sum()),
                    total_prof=(prof_col, lambda s: pd.to_numeric(s, errors="coerce").sum())
                )
                prod_agg = prod_agg[prod_agg["total_rev"] > 0]
                prod_agg["margin_pct"] = (prod_agg["total_prof"] / prod_agg["total_rev"]) * 100
                
                # Items with high revenue (> median) but low margin (< 15%)
                drag_items = prod_agg[(prod_agg["total_rev"] > prod_agg["total_rev"].median()) & (prod_agg["margin_pct"] < 15.0)]
                if not drag_items.empty:
                    worst_drag = drag_items.sort_values("margin_pct").index[0]
                    drag_m = float(drag_items.loc[worst_drag, "margin_pct"])
                    drag_r = float(drag_items.loc[worst_drag, "total_rev"])
                    register(
                        category="opportunity",
                        title=f"Margin Drag Discrepancy: '{worst_drag}' Drives High Volume at Sub-par Margin ({drag_m:.1f}%)",
                        description=f"Item '{worst_drag}' generates substantial volume ({json_safe(round(drag_r, 2))}) but produces a constrained net margin of only {drag_m:.1f}%.",
                        metric_label="Low-Margin High-Vol Entity",
                        metric_value=f"{drag_m:.1f}%",
                        evidence_data={"entity": str(worst_drag), "revenue": json_safe(round(drag_r, 2)), "margin_pct": json_safe(round(drag_m, 2))},
                        severity="High",
                        recommendation=f"Review supplier pricing, shipping costs, or list pricing for '{worst_drag}' to recover margin.",
                        interpretation="Entities that generate high topline revenue with low margins tie up capital and logistics capacity while yielding disproportionately low bottom-line profit.",
                        action=f"Model the bottom-line impact of a 3-5% price adjustment on '{worst_drag}'.",
                        reliability_tuple=_assess_reliability(len(df), 0.05),
                    )

    # 2. Academic / Score Dataset Opportunities
    elif "score" in semantic and "attendance" in semantic:
        score_col = semantic["score"]
        att_col = semantic["attendance"]
        sc_clean = pd.to_numeric(df[score_col], errors="coerce")
        att_clean = pd.to_numeric(df[att_col], errors="coerce")
        paired_edu = pd.DataFrame({"score": sc_clean, "att": att_clean}).dropna()
        if len(paired_edu) >= 10:
            corr_edu = paired_edu["score"].corr(paired_edu["att"])
            register(
                category="opportunity",
                title=f"Academic Indicator: {corr_edu:.2f} Association Between {att_col} and {score_col}",
                description=f"Evaluated relationship between attendance and scores. Calculated correlation is r = {corr_edu:.2f}.",
                metric_label="Attendance-Performance Link",
                metric_value=f"r = {corr_edu:.2f}",
                evidence_data={"correlation": json_safe(round(float(corr_edu), 3)), "sample_size": len(paired_edu)},
                severity="Informational",
                recommendation=f"Target attendance intervention programs to lift cohort performance.",
                interpretation="Statistical correlation between attendance and performance provides empirical support for targeted attendance retention.",
                action="Identify students in the lowest attendance quartile for proactive academic advising.",
                reliability_tuple=_assess_reliability(len(paired_edu), 0.05),
            )

    # Fallback to ensure every valid dataset receives rich deterministic findings
    if not created_insights:
        # Generate generic distribution finding
        first_col = df.columns[0]
        n_unique = df[first_col].nunique()
        register(
            category="performance",
            title=f"Structural Breadth: '{first_col}' Spans {n_unique} Unique Observations",
            description=f"The primary dimensional column '{first_col}' contains {n_unique} distinct states across {n_rows} recorded observations.",
            metric_label="Unique Dimension Count",
            metric_value=str(n_unique),
            evidence_data={"column": str(first_col), "unique_count": n_unique, "total_rows": n_rows},
            severity="Informational",
            recommendation="Configure chart axes in the Visual Intelligence Studio to dissect records by this dimension.",
            interpretation="Dimensions with moderate cardinality offer rich opportunities for cross-sectional aggregation and comparative analysis.",
            action="Plot a bar distribution of this dimension in Chart Explorer.",
            reliability_tuple=("High", f"Complete enumeration across {n_rows} rows."),
        )

    db.flush()
    return created_insights
