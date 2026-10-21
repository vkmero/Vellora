from sqlalchemy.orm import Session
from app.exceptions import NotFoundError
from app.models.analysis import Analysis
from app.models.cleaning_action import CleaningAction
from app.models.dataset import Dataset
from app.models.insight import Insight
from app.models.prediction import Prediction
from app.models.project import Project
from app.models.quality_issue import QualityIssue
from app.models.summary import Summary
from app.models.user import User
from app.models.validation import Validation
from app.schemas.summary_schema import SummaryOut
from app.utils.helpers import utcnow


def serialize_summary(summary: Summary, db: Session) -> SummaryOut:
    creator = db.get(User, summary.created_by) if summary.created_by else None
    return SummaryOut(
        id=summary.id,
        project_id=summary.project_id,
        dataset_id=summary.dataset_id,
        summary_type=summary.summary_type,
        title=summary.title,
        content=summary.content,
        metadata_json=summary.metadata_json,
        created_by=summary.created_by,
        creator_name=creator.name if creator else None,
        created_at=summary.created_at,
        updated_at=summary.updated_at,
    )


def generate_summary(db: Session, dataset: Dataset, summary_type: str, user_id: int, project_id: int | None = None) -> Summary:
    project = None
    if project_id:
        project = db.get(Project, project_id)
    elif dataset.project_id:
        project = db.get(Project, dataset.project_id)

    # Gather data from the pipeline
    issues = db.query(QualityIssue).filter(QualityIssue.dataset_id == dataset.id).all()
    clean_actions = db.query(CleaningAction).filter(CleaningAction.dataset_id == dataset.id).all()
    analysis = db.query(Analysis).filter(Analysis.dataset_id == dataset.id).first()
    insights = db.query(Insight).filter(Insight.dataset_id == dataset.id).all()
    validation = db.query(Validation).filter(Validation.dataset_id == dataset.id).order_by(Validation.created_at.desc()).first()
    prediction = db.query(Prediction).filter(Prediction.dataset_id == dataset.id).order_by(Prediction.created_at.desc()).first()

    quality_score = dataset.quality_score or 0.0
    status_label = "Optimal" if quality_score >= 85 else ("Acceptable" if quality_score >= 70 else "At Risk")
    proj_name = project.name if project else "Vellora Data Intelligence Project"
    client_name = project.client_name if project and project.client_name else "Enterprise Client"
    obj_text = project.business_objective if project and project.business_objective else "Exploratory intelligence, data health audit, and strategic decision modeling."

    missing_issues = sum(i.affected_rows for i in issues if i.issue_type == "missing_values")
    dup_issues = sum(i.affected_rows for i in issues if i.issue_type == "duplicates")
    outlier_issues = sum(i.affected_rows for i in issues if i.issue_type == "outliers")

    top_corrs = []
    analysis_res = analysis.results if analysis and isinstance(analysis.results, dict) else {}
    correlations = analysis_res.get("correlation", {})
    if correlations and isinstance(correlations, dict):
        for col_a, pairs in correlations.items():
            if isinstance(pairs, dict):
                for col_b, val in pairs.items():
                    if col_a != col_b and isinstance(val, (int, float)) and abs(val) > 0.4:
                        top_corrs.append(f"{col_a} <-> {col_b}: {val:.2f}")
    top_corr_str = ", ".join(top_corrs[:4]) if top_corrs else "No dominant linear cross-correlations (>0.4) identified."

    top_insights = [f"- **{i.title}**: {i.description} *(Severity: {getattr(i, 'severity', 'Informational').upper()} | Priority: {i.recommendation or 'Observe trend'})*" for i in insights[:5]]
    insights_block = "\n".join(top_insights) if top_insights else "- Baseline statistical distributions reviewed across numerical indicators."

    metadata = {
        "dataset_rows": dataset.row_count,
        "dataset_cols": dataset.column_count,
        "quality_score": quality_score,
        "validation_score": validation.new_quality_score if validation else quality_score,
        "issues_detected": len(issues),
        "cleaning_steps_count": len(clean_actions),
        "insights_count": len(insights),
        "prediction_model": prediction.model_type if prediction else None,
    }

    if summary_type == "executive":
        title = f"Executive Intelligence Briefing — {dataset.name}"
        content = f"""# Executive Intelligence Briefing
**Project**: {proj_name} | **Client**: {client_name}
**Dataset**: {dataset.name} ({dataset.row_count or 0:,} records across {dataset.column_count or 0} attributes)

---

### 1. Executive Summary & Objective
This report synthesizes data quality, exploratory patterns, and predictive indicators for **{proj_name}**.
The primary business objective is: *"{obj_text}"*.

### 2. Data Health & Integrity Scorecard
- **Quality Score**: **{quality_score:.1f}%** ({status_label})
- **Health Delta**: Initial score improved to **{validation.new_quality_score if validation else quality_score:.1f}%** following governance pipelines.
- **Pipeline Interventions**: Executed {len(clean_actions)} cleaning operations resolving {missing_issues} missing values, {dup_issues} duplicates, and {outlier_issues} extreme variance anomalies.
- **Data Completeness**: Cleaned dataset is certified for executive reporting and algorithmic modeling.

### 3. Key Findings & Market Signals
{insights_block}

### 4. Significant Relationships & Cross-Correlations
{top_corr_str}

### 5. Strategic Recommendations & Action Plan
1. **Accelerate High-Performing Drivers**: Align resource allocation with key positively correlated variables.
2. **Mitigate Risk Nodes**: Monitor attributes exhibiting elevated volatility or data drift.
3. **Automate Pipeline Validation**: Retain Vellora validation rules for subsequent recurring dataset batches.
"""

    elif summary_type == "technical":
        title = f"Technical Data Architecture & Hygiene Report — {dataset.name}"
        clean_steps_str = "\n".join([f"- Step {idx+1} ({a.action_type}): {a.description} (Affected {a.affected_rows} records)" for idx, a in enumerate(clean_actions)]) or "- Default automated preprocessing applied."
        content = f"""# Technical Data Architecture & Hygiene Audit
**Project**: {proj_name} | **Dataset ID**: #{dataset.id} ({dataset.file_type.upper()})
**Architecture**: {dataset.row_count or 0} Rows x {dataset.column_count or 0} Columns | Raw Size: {dataset.file_size / 1024:.1f} KB

---

### 1. Ingestion & Schema Specification
- **Engine**: Vellora Ingestion Pipeline with Pandas / NumPy vectorized parsing.
- **Source Integrity**: Strict columnar type validation and schema conformance verified.

### 2. Quality Diagnostics & Anomaly Breakdown
- **Identified Issues**: {len(issues)} distinct quality flags.
  - Missing Value Cells: {missing_issues:,}
  - Duplicate Row Instances: {dup_issues:,}
  - Statistical Outlier Extremes: {outlier_issues:,}
- **Quality Index**: Pre-cleaning: {validation.previous_quality_score if validation else quality_score:.1f}% -> Post-revalidation: {quality_score:.1f}%.

### 3. Transformation & Cleaning Pipeline Executed
{clean_steps_str}

### 4. Correlation & Multicollinearity Matrix
{top_corr_str}

### 5. Modeling Readiness & Validation Gate
- Status: **{dataset.status.upper()}**
- Post-cleaning validation passed. Feature vectors are normalized and distribution-checked for downstream predictive workloads.
"""

    elif summary_type == "business":
        title = f"Commercial & Operational Business Intelligence — {dataset.name}"
        content = f"""# Commercial & Operational Intelligence Report
**Client**: {client_name} | **Project**: {proj_name}

---

### 1. Commercial Opportunity Framing
The analysis conducted on **{dataset.name}** was evaluated against strategic goals:
*"{obj_text}"*.

### 2. KPI Impact & Quantified Value
- **Data Reliability Index**: {quality_score:.1f}% confidence level ensures robust commercial decisioning without systemic reporting bias.
- **Volume Sampled**: {dataset.row_count or 0:,} transactional / operational observations.
- **Operational Risk Mitigation**: Systematic elimination of duplicate entries prevents inflated budget projections or redundant customer touches.

### 3. Tactical Insights & Domain Observations
{insights_block}

### 4. Revenue & Efficiency Action Items
- **Immediate (0-30 Days)**: Implement operational safeguards addressing the highest-severity findings outlined above.
- **Medium-Term (30-90 Days)**: Leverage positive statistical correlations ({top_corr_str}) to refine customer targeting and cost optimizations.
- **Long-Term**: Institutionalize automated Vellora data quality audits across quarterly operational data ingestions.
"""

    else:  # presentation
        title = f"Executive Presentation Talking Points — {dataset.name}"
        content = f"""# Executive Presentation Deck Narrative
**Target Audience**: Executive Steering Committee & Client Stakeholders ({client_name})
**Project Title**: {proj_name}

---

### Slide 1: Welcome & Executive Intent
- Context: Data intelligence and performance evaluation for {proj_name}.
- Objective: {obj_text}

### Slide 2: Data Foundations & Ingestion Overview
- Ingested {dataset.row_count or 0:,} records across {dataset.column_count or 0} dimensions.
- Standardized data formats, confirmed type safety, and created clean analytical partitions.

### Slide 3: Quality Audit & Health Certification
- Starting Quality Health: {validation.previous_quality_score if validation else quality_score:.1f}%
- Enhanced Quality Health: **{quality_score:.1f}%** ({status_label})
- Zero critical blocker defects remaining in active dataset.

### Slide 4: Key Performance & Empirical Patterns
- Highlight primary statistical correlations: {top_corr_str}.
- Variance distribution indicates stable operational clustering.

### Slide 5: Strategic Business Action Items
{insights_block}

### Slide 6: Governance & Next Phase
- Deliverables submitted for Manager certification and Client progress briefing.
"""

    # Check if a summary of this type already exists for this dataset
    summary = db.query(Summary).filter(
        Summary.dataset_id == dataset.id,
        Summary.summary_type == summary_type,
    ).first()

    if summary:
        summary.title = title
        summary.content = content
        summary.metadata_json = metadata
        summary.project_id = project.id if project else None
        summary.updated_at = utcnow()
    else:
        summary = Summary(
            project_id=project.id if project else None,
            dataset_id=dataset.id,
            summary_type=summary_type,
            title=title,
            content=content,
            metadata_json=metadata,
            created_by=user_id,
        )
        db.add(summary)

    db.flush()
    return summary


def update_summary(summary_id: int, content: str, title: str | None, current_user: User, db: Session) -> Summary:
    summary = db.get(Summary, summary_id)
    if not summary:
        raise NotFoundError("Summary not found.")

    summary.content = content
    if title:
        summary.title = title
    summary.updated_at = utcnow()
    db.flush()
    return summary
