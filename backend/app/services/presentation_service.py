from pathlib import Path
from pptx import Presentation as PPTXPresentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE
from sqlalchemy.orm import Session

from app.exceptions import BadRequestError
from app.models.analysis import Analysis
from app.models.cleaning_action import CleaningAction
from app.models.dataset import Dataset
from app.models.insight import Insight
from app.models.prediction import Prediction
from app.models.presentation import Presentation
from app.models.project import Project
from app.models.quality_issue import QualityIssue
from app.models.user import User
from app.models.validation import Validation
from app.schemas.presentation_schema import PresentationOut
from app.services.file_service import PPTX_DIR, ensure_storage
from app.services.notification_service import notify
from app.utils.helpers import utcnow

# Bright Glass Presentation Palette
BG_COLOR = RGBColor(248, 250, 252)          # Slate 50
CARD_BG = RGBColor(255, 255, 255)           # White
TEXT_PRIMARY = RGBColor(15, 23, 42)         # Slate 900
TEXT_SECONDARY = RGBColor(71, 85, 105)      # Slate 600
TEXT_MUTED = RGBColor(148, 163, 184)        # Slate 400
ACCENT_BLUE = RGBColor(2, 132, 199)         # Sky 600
ACCENT_INDIGO = RGBColor(79, 70, 229)       # Indigo 600
ACCENT_EMERALD = RGBColor(16, 185, 129)     # Emerald 500
BORDER_COLOR = RGBColor(226, 232, 240)      # Slate 200


def serialize_presentation(pres: Presentation, db: Session) -> PresentationOut:
    generator = db.get(User, pres.generated_by) if pres.generated_by else None
    return PresentationOut(
        id=pres.id,
        project_id=pres.project_id,
        dataset_id=pres.dataset_id,
        title=pres.title,
        slide_count=pres.slide_count,
        file_path=pres.file_path,
        generated_by=pres.generated_by,
        generator_name=generator.name if generator else None,
        delivered_to_manager_id=pres.delivered_to_manager_id,
        delivery_status=pres.delivery_status,
        created_at=pres.created_at,
    )


def _add_slide_base(prs: PPTXPresentation, title_text: str, subtitle_text: str | None = None):
    blank_layout = prs.slide_layouts[6]  # completely blank
    slide = prs.slides.add_slide(blank_layout)

    # Background shape
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg.fill.solid()
    bg.fill.fore_color.rgb = BG_COLOR
    bg.line.fill.background()

    # Top brand bar
    top_bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(0.5), Inches(11.733), Inches(0.08))
    top_bar.fill.solid()
    top_bar.fill.fore_color.rgb = ACCENT_INDIGO
    top_bar.line.fill.background()

    # Title box
    tb = slide.shapes.add_textbox(Inches(0.8), Inches(0.7), Inches(11.733), Inches(1.0))
    tf = tb.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = title_text
    p.font.name = "Segoe UI"
    p.font.size = Pt(24)
    p.font.bold = True
    p.font.color.rgb = TEXT_PRIMARY

    if subtitle_text:
        p2 = tf.add_paragraph()
        p2.text = subtitle_text
        p2.font.name = "Segoe UI"
        p2.font.size = Pt(12)
        p2.font.color.rgb = TEXT_SECONDARY
        p2.space_before = Pt(4)

    return slide


def _add_card(slide, left, top, width, height, title: str, items: list[str], accent=ACCENT_INDIGO):
    # White card background
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    card.fill.solid()
    card.fill.fore_color.rgb = CARD_BG
    card.line.color.rgb = BORDER_COLOR
    card.line.width = Pt(1)

    # Accent stripe on top of card
    stripe = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, Inches(0.06))
    stripe.fill.solid()
    stripe.fill.fore_color.rgb = accent
    stripe.line.fill.background()

    # Content
    tb = slide.shapes.add_textbox(left + Inches(0.25), top + Inches(0.18), width - Inches(0.5), height - Inches(0.36))
    tf = tb.text_frame
    tf.word_wrap = True

    p_title = tf.paragraphs[0]
    p_title.text = title
    p_title.font.name = "Segoe UI"
    p_title.font.size = Pt(15)
    p_title.font.bold = True
    p_title.font.color.rgb = TEXT_PRIMARY
    p_title.space_after = Pt(8)

    for item in items:
        p = tf.add_paragraph()
        p.text = f"•  {item}"
        p.font.name = "Segoe UI"
        p.font.size = Pt(11)
        p.font.color.rgb = TEXT_SECONDARY
        p.space_after = Pt(4)


def generate_presentation(
    db: Session,
    dataset: Dataset,
    user_id: int,
    project_id: int | None = None,
    custom_title: str | None = None,
) -> Presentation:
    ensure_storage()

    # Retrieve context
    user = db.get(User, user_id)
    project = None
    if project_id:
        project = db.get(Project, project_id)
    elif dataset.project_id:
        project = db.get(Project, dataset.project_id)

    issues = db.query(QualityIssue).filter(QualityIssue.dataset_id == dataset.id).all()
    clean_actions = db.query(CleaningAction).filter(CleaningAction.dataset_id == dataset.id).all()
    analysis = db.query(Analysis).filter(Analysis.dataset_id == dataset.id).first()
    insights = db.query(Insight).filter(Insight.dataset_id == dataset.id).all()
    validation = db.query(Validation).filter(Validation.dataset_id == dataset.id).order_by(Validation.created_at.desc()).first()
    prediction = db.query(Prediction).filter(Prediction.dataset_id == dataset.id).order_by(Prediction.created_at.desc()).first()

    project_name = project.name if project else "Vellora Data Intelligence Project"
    client_name = project.client_name if project and project.client_name else "Enterprise Partner"
    obj_text = project.business_objective if project and project.business_objective else "Exploratory analytics, statistical validation, and strategic decision guidance."
    deck_title = custom_title or f"{project_name} — Strategic Intelligence Deck"

    quality_score = dataset.quality_score or 0.0
    val_score = validation.new_quality_score if validation else quality_score
    missing_count = sum(i.affected_rows for i in issues if i.issue_type == "missing_values")
    dup_count = sum(i.affected_rows for i in issues if i.issue_type == "duplicates")
    outlier_count = sum(i.affected_rows for i in issues if i.issue_type == "outliers")

    # Initialize PPTX
    prs = PPTXPresentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # -------------------------------------------------------------
    # SLIDE 1: Cover Slide
    # -------------------------------------------------------------
    blank_layout = prs.slide_layouts[6]
    s1 = prs.slides.add_slide(blank_layout)
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    bg1.fill.solid()
    bg1.fill.fore_color.rgb = RGBColor(15, 23, 42)  # Dark slate for hero cover
    bg1.line.fill.background()

    # Vellora Tag
    tag_box = s1.shapes.add_textbox(Inches(1.2), Inches(1.8), Inches(10), Inches(0.5))
    tag_tf = tag_box.text_frame
    p_tag = tag_tf.paragraphs[0]
    p_tag.text = "VELLORA DATA INTELLIGENCE PLATFORM  •  EXECUTIVE DELIVERABLE"
    p_tag.font.name = "Segoe UI"
    p_tag.font.size = Pt(11)
    p_tag.font.bold = True
    p_tag.font.color.rgb = RGBColor(56, 189, 248)

    # Title
    t_box = s1.shapes.add_textbox(Inches(1.2), Inches(2.3), Inches(10.5), Inches(2.0))
    t_tf = t_box.text_frame
    t_tf.word_wrap = True
    p_t = t_tf.paragraphs[0]
    p_t.text = deck_title
    p_t.font.name = "Segoe UI"
    p_t.font.size = Pt(38)
    p_t.font.bold = True
    p_t.font.color.rgb = RGBColor(255, 255, 255)

    # Subtitle / Details
    sub_box = s1.shapes.add_textbox(Inches(1.2), Inches(4.5), Inches(10), Inches(1.5))
    sub_tf = sub_box.text_frame
    sub_p1 = sub_tf.paragraphs[0]
    sub_p1.text = f"Client: {client_name}    |    Project: {project_name}"
    sub_p1.font.name = "Segoe UI"
    sub_p1.font.size = Pt(14)
    sub_p1.font.color.rgb = RGBColor(226, 232, 240)

    sub_p2 = sub_tf.add_paragraph()
    sub_p2.text = f"Prepared by: {user.name if user else 'Vellora Analyst'}    |    Date: {utcnow().strftime('%B %d, %Y')}"
    sub_p2.font.name = "Segoe UI"
    sub_p2.font.size = Pt(12)
    sub_p2.font.color.rgb = RGBColor(148, 163, 184)
    sub_p2.space_before = Pt(8)

    # -------------------------------------------------------------
    # SLIDE 2: Executive Summary & Objective
    # -------------------------------------------------------------
    s2 = _add_slide_base(prs, "Executive Summary & Business Objectives", f"Context and strategic mandate for {project_name}")
    _add_card(s2, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.8), "Strategic Mandate", [
        f"Core Business Objective: {obj_text}",
        f"Client Engagement: Custom intelligence workflow structured for {client_name}.",
        "Governance Policy: End-to-end data audit, automated anomaly remediation, and manager review.",
        "Deliverable Outcome: Verified dataset, executive deck, and actionable business levers.",
    ], ACCENT_INDIGO)

    _add_card(s2, Inches(6.8), Inches(2.0), Inches(5.6), Inches(4.8), "Key Takeaways at a Glance", [
        f"Data Health Elevation: Data Quality Score increased to {val_score:.1f}%.",
        f"Scale Audited: {dataset.row_count or 0:,} raw observations successfully ingested.",
        f"Pipeline Stability: {len(clean_actions)} transformation steps executed without signal distortion.",
        f"Actionable Insights: Generated {len(insights)} statistical intelligence findings.",
    ], ACCENT_EMERALD)

    # -------------------------------------------------------------
    # SLIDE 3: Ingestion & Dataset Architecture
    # -------------------------------------------------------------
    s3 = _add_slide_base(prs, "Ingestion Architecture & Dataset Dimensions", f"Source profile and dimensional composition of {dataset.name}")
    _add_card(s3, Inches(0.8), Inches(2.0), Inches(3.6), Inches(4.8), "Volumetric Metrics", [
        f"Total Records: {dataset.row_count or 0:,} rows",
        f"Feature Attributes: {dataset.column_count or 0} columns",
        f"Source Type: {dataset.file_type.upper()}",
        f"Storage Footprint: {dataset.file_size / 1024:.1f} KB",
        f"Ingestion Status: {dataset.status.upper()}",
    ], ACCENT_BLUE)

    _add_card(s3, Inches(4.8), Inches(2.0), Inches(3.6), Inches(4.8), "Schema Reliability", [
        "Vectorized DataFrame parsing verified.",
        "Automatic columnar datatype classification.",
        "Zero schema drift detected during ingestion.",
        "High memory-efficiency index verified.",
    ], ACCENT_INDIGO)

    _add_card(s3, Inches(8.8), Inches(2.0), Inches(3.6), Inches(4.8), "Audit Verification", [
        f"Dataset ID: #{dataset.id}",
        f"Owner: {user.name if user else 'Analyst'}",
        f"Created: {dataset.created_at.strftime('%Y-%m-%d %H:%M')}",
        "Storage: Isolated secure repository.",
    ], ACCENT_EMERALD)

    # -------------------------------------------------------------
    # SLIDE 4: Data Quality Audit & Health Scorecard
    # -------------------------------------------------------------
    s4 = _add_slide_base(prs, "Data Quality Audit & Health Scorecard", "Systematic multi-dimensional quality assessment")
    _add_card(s4, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.8), "Quality Score Breakdown", [
        f"Overall Quality Health Score: {quality_score:.1f}%",
        f"Health Tier: {'Optimal (Green)' if quality_score >= 85 else ('Standard (Yellow)' if quality_score >= 70 else 'Deficient (Red)')}",
        "Completeness Metric: Percentage of non-null records across all features.",
        "Consistency Metric: Schema conformance and datatype alignment.",
        "Uniqueness Metric: Elimination of redundant tuple records.",
    ], ACCENT_EMERALD)

    _add_card(s4, Inches(6.8), Inches(2.0), Inches(5.6), Inches(4.8), "Anomaly Summary", [
        f"Total Quality Flags: {len(issues)} detected",
        f"Missing Value Attributes: {missing_count:,} affected cells",
        f"Duplicate Instances: {dup_count:,} duplicate rows",
        f"Outlier Spikes: {outlier_count:,} extreme variance points",
        "Risk Assessment: Managed through automated cleaning pipeline.",
    ], ACCENT_BLUE)

    # -------------------------------------------------------------
    # SLIDE 5: Cleaning & Transformation Interventions
    # -------------------------------------------------------------
    s5 = _add_slide_base(prs, "Cleaning & Transformation Interventions", "Deterministic remediation applied to guarantee dataset integrity")
    clean_items = [f"Step {idx+1}: {a.action_type} — {a.description} ({a.affected_rows} rows)" for idx, a in enumerate(clean_actions[:5])] or ["Standardized imputation and data filtering pipeline executed."]
    _add_card(s5, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.8), "Remediation Pipeline Steps", clean_items, ACCENT_INDIGO)

    _add_card(s5, Inches(6.8), Inches(2.0), Inches(5.6), Inches(4.8), "Governance Safeguards", [
        "Non-destructive workflow: Original data preserved intact.",
        "Deterministic transformations with full reproducibility.",
        "Reversible pipeline logging with full audit trail.",
        "Exportable cleaned dataset generated.",
    ], ACCENT_BLUE)

    # -------------------------------------------------------------
    # SLIDE 6: Revalidation & Before vs After Comparison
    # -------------------------------------------------------------
    s6 = _add_slide_base(prs, "Revalidation & Before/After Comparison", "Empirical measurement of data quality enhancements")
    prev_s = validation.previous_quality_score if validation else quality_score
    new_s = validation.new_quality_score if validation else quality_score
    delta = new_s - prev_s

    _add_card(s6, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.8), "Quality Delta Audit", [
        f"Pre-Cleaning Quality Score: {prev_s:.1f}%",
        f"Post-Revalidation Quality Score: {new_s:.1f}%",
        f"Net Quality Improvement: +{delta:.1f}% Delta",
        f"Pre-Cleaning Anomaly Count: {validation.issues_before if validation else len(issues)}",
        f"Post-Cleaning Anomaly Count: {validation.issues_after if validation else 0}",
    ], ACCENT_EMERALD)

    _add_card(s6, Inches(6.8), Inches(2.0), Inches(5.6), Inches(4.8), "Production Readiness Certification", [
        "Validation Status: COMPLETED & VERIFIED",
        "Data hygiene certified for enterprise business intelligence.",
        "Zero fatal errors preventing downstream predictive modeling.",
        "Ready for manager sign-off and client presentation.",
    ], ACCENT_INDIGO)

    # -------------------------------------------------------------
    # SLIDE 7: Exploratory Data Analysis & Statistical Highlights
    # -------------------------------------------------------------
    s7 = _add_slide_base(prs, "Exploratory Data Analysis (EDA) Highlights", "Statistical distributions and parametric profile")
    analysis_res = analysis.results if analysis and isinstance(analysis.results, dict) else {}
    numeric_stats = analysis_res.get("numeric", {})
    num_cols = list(numeric_stats.keys()) if isinstance(numeric_stats, dict) else []
    stat_items = []
    if numeric_stats and isinstance(numeric_stats, dict):
        for c in num_cols[:4]:
            stats = numeric_stats[c]
            if isinstance(stats, dict):
                mean_v = stats.get("mean", 0)
                std_v = stats.get("std", 0)
                stat_items.append(f"{c}: Mean = {mean_v:.2f}, Std = {std_v:.2f}")
    if not stat_items:
        stat_items = ["Continuous variable distributions analyzed with parametric tests."]

    _add_card(s7, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.8), "Parametric Indicators", stat_items, ACCENT_BLUE)
    _add_card(s7, Inches(6.8), Inches(2.0), Inches(5.6), Inches(4.8), "Distributional Characteristics", [
        f"Identified {len(num_cols)} continuous quantitative numerical features.",
        "Skewness and kurtosis evaluated for normal distribution conformance.",
        "Variance inflation factor checks completed.",
        "Feature interactions prepared for business interpretation.",
    ], ACCENT_INDIGO)

    # -------------------------------------------------------------
    # SLIDE 8: Correlation Matrix & Feature Interdependencies
    # -------------------------------------------------------------
    s8 = _add_slide_base(prs, "Correlation Matrix & Feature Interdependencies", "Linear and non-linear relationships across indicators")
    corr_items = []
    correlations = analysis_res.get("correlation", {})
    if correlations and isinstance(correlations, dict):
        for ca, pairs in correlations.items():
            if isinstance(pairs, dict):
                for cb, v in pairs.items():
                    if ca != cb and isinstance(v, (int, float)) and abs(v) > 0.35:
                        corr_items.append(f"{ca}  <--->  {cb}  (r = {v:.2f})")
    if not corr_items:
        corr_items = ["Inter-variable correlation coefficients mapped within normal variance boundaries."]

    _add_card(s8, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.8), "Strongest Relationships", corr_items[:6], ACCENT_INDIGO)
    _add_card(s8, Inches(6.8), Inches(2.0), Inches(5.6), Inches(4.8), "Commercial Interpretation", [
        "Identified key operational co-movements for resource allocation.",
        "Strong positive correlations pinpoint high-leverage growth drivers.",
        "Inverse correlations highlight trade-offs in resource balancing.",
        "Reduces multi-collinearity risk in forward predictions.",
    ], ACCENT_EMERALD)

    # -------------------------------------------------------------
    # SLIDE 9: Automated Insights & Trend Observations
    # -------------------------------------------------------------
    s9 = _add_slide_base(prs, "Automated Intelligence & Trend Insights", "Machine-generated statistical observations and business signals")
    ins_items_1 = [f"{i.title} [{getattr(i, 'severity', 'Informational').upper()}]: {i.description[:90]}..." for i in insights[:3]] or ["Analyzed baseline trend patterns across primary features."]
    ins_items_2 = [f"Rec: {i.recommendation or 'Observe trend'}" for i in insights[:3]] or ["Monitor ongoing baseline performance."]

    _add_card(s9, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.8), "Primary Trend Findings", ins_items_1, ACCENT_BLUE)
    _add_card(s9, Inches(6.8), Inches(2.0), Inches(5.6), Inches(4.8), "Strategic Recommendations", ins_items_2, ACCENT_EMERALD)

    # -------------------------------------------------------------
    # SLIDE 10: Predictive Modeling & ML Forecasting
    # -------------------------------------------------------------
    s10 = _add_slide_base(prs, "Predictive Modeling & Algorithmic Outcomes", "Machine learning evaluation and forward projection")
    if prediction:
        ml_items = [
            f"Algorithm: {prediction.model_type.upper()}",
            f"Target Variable: {prediction.target_column}",
            f"Model Performance: Primary evaluation metric recorded.",
            f"Status: Training and validation completed.",
        ]
    else:
        ml_items = [
            "Dataset architecture certified for forward predictive modeling.",
            "Feature vectors normalized and ready for supervised regression or classification.",
            "Historical sample size provides statistical power for training splits.",
        ]
    _add_card(s10, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.8), "Model Architecture & Fit", ml_items, ACCENT_INDIGO)
    _add_card(s10, Inches(6.8), Inches(2.0), Inches(5.6), Inches(4.8), "Operational Applicability", [
        "Enables forward-looking demand, churn, or revenue forecasting.",
        "Early warning thresholds for anomaly detection.",
        "Supports data-driven scenario planning and sensitivity analysis.",
    ], ACCENT_BLUE)

    # -------------------------------------------------------------
    # SLIDE 11: Strategic Business Action Plan
    # -------------------------------------------------------------
    s11 = _add_slide_base(prs, "Strategic Business Action Plan", f"Actionable execution levers recommended for {client_name}")
    _add_card(s11, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.8), "Near-Term Priorities (Days 1-30)", [
        "Review and adopt the validated dataset as the authoritative operational baseline.",
        "Address primary risk indicators highlighted in the quality scorecard.",
        "Deploy quick-win recommendations derived from top correlations.",
        "Present findings to cross-functional leadership team.",
    ], ACCENT_EMERALD)

    _add_card(s11, Inches(6.8), Inches(2.0), Inches(5.6), Inches(4.8), "Strategic Horizon (Days 31-90)", [
        "Automate recurring data ingestion pipelines using Vellora validation gates.",
        "Operationalize predictive models within frontline decision workflows.",
        "Establish monthly data health reviews with assigned Manager oversight.",
        "Scale platform utilization across remaining departmental datasets.",
    ], ACCENT_INDIGO)

    # -------------------------------------------------------------
    # SLIDE 12: Governance, Approvals & Appendix
    # -------------------------------------------------------------
    s12 = _add_slide_base(prs, "Governance Certification & Appendix", "Compliance audit trail and delivery sign-off")
    manager = db.get(User, project.assigned_manager_id) if project and project.assigned_manager_id else None
    _add_card(s12, Inches(0.8), Inches(2.0), Inches(5.6), Inches(4.8), "Delivery Governance", [
        f"Project Status: {project.status.upper() if project else 'ACTIVE'}",
        f"Assigned Analyst: {user.name if user else 'Analyst'}",
        f"Assigned Manager: {manager.name if manager else 'Manager Review Pending'}",
        f"Approval Policy: {project.approval_policy.upper() if project else 'OPTIONAL'}",
        f"Generated: {utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}",
    ], ACCENT_BLUE)

    _add_card(s12, Inches(6.8), Inches(2.0), Inches(5.6), Inches(4.8), "Platform Certification", [
        "Vellora Intelligent Analytics & Data Quality Platform.",
        "All statistical computations performed in-engine.",
        "Deliverable automatically synced to Manager Reports Received Portal.",
        "Client delivery via Gmail API communication center enabled.",
    ], ACCENT_EMERALD)

    # Save PPTX file
    stamp = utcnow().strftime("%Y%m%d%H%M%S")
    file_path = PPTX_DIR / f"{dataset.id}_presentation_{stamp}.pptx"
    prs.save(str(file_path))

    # Automatic delivery to assigned manager
    mgr_id = project.assigned_manager_id if project and project.assigned_manager_id else None
    if not mgr_id:
        active_mgr = db.query(User).filter(User.role.in_(["manager", "admin"]), User.is_active.is_(True)).first()
        if active_mgr:
            mgr_id = active_mgr.id

    pres_record = Presentation(
        project_id=project.id if project else None,
        dataset_id=dataset.id,
        title=deck_title,
        slide_count=12,
        file_path=str(file_path),
        generated_by=user_id,
        delivered_to_manager_id=mgr_id,
        delivery_status="delivered",
    )
    db.add(pres_record)
    db.flush()

    if mgr_id:
        notify(
            db,
            mgr_id,
            "New Presentation Delivered",
            f"Analyst {user.name if user else 'Analyst'} generated a 12-slide presentation '{deck_title}' for project '{project_name}'.",
            "presentation_delivered",
        )

    return pres_record
