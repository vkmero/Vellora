import csv
import io
from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import client_ip, get_current_user, get_dataset_for_user
from app.models.insight import Insight
from app.models.user import User
from app.schemas.insight_schema import InsightOut
from app.services.audit_service import log_action
from app.services.insight_service import generate_insights
from app.services.workflow_service import require_insights_ready

router = APIRouter(prefix="/datasets", tags=["insights"])


@router.post("/{dataset_id}/insights", response_model=list[InsightOut])
def create_insights(
    dataset_id: int,
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset = get_dataset_for_user(dataset_id, user, db)
    require_insights_ready(dataset, db)
    db.query(Insight).filter(Insight.dataset_id == dataset_id).delete()
    items = generate_insights(db, dataset)
    log_action(db, "GENERATE_INSIGHTS", f"Insights for {dataset.name}.", user.id, "dataset", dataset.id, client_ip(request))
    db.commit()
    return items


@router.get("/{dataset_id}/insights", response_model=list[InsightOut])
def list_insights(dataset_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_dataset_for_user(dataset_id, user, db)
    return db.query(Insight).filter(Insight.dataset_id == dataset_id).order_by(Insight.created_at.desc()).all()


@router.get("/{dataset_id}/insights/summary")
def get_insights_summary(dataset_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    dataset = get_dataset_for_user(dataset_id, user, db)
    items = db.query(Insight).filter(Insight.dataset_id == dataset_id).all()
    
    total = len(items)
    critical = sum(1 for i in items if i.severity == "Critical")
    high = sum(1 for i in items if i.severity == "High")
    medium = sum(1 for i in items if i.severity == "Medium")
    info = sum(1 for i in items if i.severity in {"Informational", "Low"})
    
    categories = {}
    for i in items:
        categories[i.category] = categories.get(i.category, 0) + 1
        
    high_rel_count = sum(1 for i in items if (i.evidence or {}).get("reliability") == "High")
    rel_pct = round((high_rel_count / max(total, 1)) * 100, 1)

    return {
        "dataset_id": dataset.id,
        "dataset_name": dataset.name,
        "total_insights": total,
        "critical_count": critical,
        "high_count": high,
        "medium_count": medium,
        "informational_count": info,
        "categories": categories,
        "high_reliability_percentage": rel_pct,
        "last_generated": items[0].created_at if items else None,
    }


@router.get("/{dataset_id}/insights/export")
def export_insights_data(
    dataset_id: int,
    format: str = "csv",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset = get_dataset_for_user(dataset_id, user, db)
    items = db.query(Insight).filter(Insight.dataset_id == dataset_id).all()

    if format == "json":
        return [
            {
                "title": i.title,
                "category": i.category,
                "severity": i.severity,
                "description": i.description,
                "recommendation": i.recommendation,
                "evidence": i.evidence,
            }
            for i in items
        ]

    # CSV format
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Title", "Category", "Severity", "Description", "Supporting Metric", "Business Interpretation", "Prescriptive Recommendation", "Reliability"])
    
    for i in items:
        ev = i.evidence or {}
        supp_metric = f"{ev.get('supporting_metric', {}).get('label', '')}: {ev.get('supporting_metric', {}).get('value', '')}"
        writer.writerow([
            i.title,
            i.category,
            i.severity,
            i.description,
            supp_metric,
            ev.get("business_interpretation", ""),
            i.recommendation or "",
            ev.get("reliability", ""),
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=vellora_insights_{dataset.id}.csv"},
    )
