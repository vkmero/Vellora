import io
import csv
from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, get_dataset_for_user
from app.models.user import User
from app.models.visualization import Visualization
from app.schemas.visualization_schema import (
    ChartRecommendation,
    DatasetColumnsMetaOut,
    VisualizationOut,
    VisualizationRequest,
)
from app.services.ingestion_service import load_dataset_frame
from app.services.visualization_service import (
    build_visualization,
    generate_chart_data,
    recommend_visualizations,
)
from app.services.workflow_service import require_visualization_ready
from app.utils.data_types import classify_columns_detailed

router = APIRouter(prefix="/datasets", tags=["visualization"])


@router.get("/{dataset_id}/visualizations/recommendations", response_model=list[ChartRecommendation])
def get_recommendations(
    dataset_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset = get_dataset_for_user(dataset_id, user, db)
    require_visualization_ready(dataset, db)
    return recommend_visualizations(dataset, db)


@router.get("/{dataset_id}/visualizations/columns-meta", response_model=DatasetColumnsMetaOut)
def get_columns_meta(
    dataset_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset = get_dataset_for_user(dataset_id, user, db)
    df = load_dataset_frame(dataset)
    return classify_columns_detailed(df)


@router.post("/{dataset_id}/visualizations/preview")
def preview_visualization_data(
    dataset_id: int,
    payload: VisualizationRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset = get_dataset_for_user(dataset_id, user, db)
    require_visualization_ready(dataset, db)
    df = load_dataset_frame(dataset)
    data, interpretation = generate_chart_data(
        df,
        payload.chart_type,
        payload.x_column,
        payload.y_column,
        payload.model_dump(),
    )
    return {
        "chart_type": payload.chart_type,
        "x_column": payload.x_column,
        "y_column": payload.y_column,
        "data": data,
        "interpretation": interpretation,
    }


@router.post("/{dataset_id}/visualizations/export")
def export_chart_data(
    dataset_id: int,
    payload: VisualizationRequest,
    format: str = "csv",
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset = get_dataset_for_user(dataset_id, user, db)
    require_visualization_ready(dataset, db)
    df = load_dataset_frame(dataset)
    data, interpretation = generate_chart_data(
        df,
        payload.chart_type,
        payload.x_column,
        payload.y_column,
        payload.model_dump(),
    )

    if format == "json":
        return {"data": data, "interpretation": interpretation}

    # Format as CSV
    output = io.StringIO()
    if isinstance(data, list) and data and isinstance(data[0], dict):
        writer = csv.DictWriter(output, fieldnames=list(data[0].keys()))
        writer.writeheader()
        writer.writerows(data)
    elif isinstance(data, dict) and "columns" in data and "values" in data:
        writer = csv.writer(output)
        writer.writerow([""] + data["columns"])
        for i, row in enumerate(data["values"]):
            writer.writerow([data["columns"][i]] + row)

    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=chart_export_{dataset.id}.csv"},
    )


@router.post("/{dataset_id}/visualizations", response_model=VisualizationOut)
def create_viz(
    dataset_id: int,
    payload: VisualizationRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    dataset = get_dataset_for_user(dataset_id, user, db)
    require_visualization_ready(dataset, db)
    viz = build_visualization(db, dataset, user.id, payload.model_dump())
    db.commit()
    db.refresh(viz)
    return viz


@router.get("/{dataset_id}/visualizations", response_model=list[VisualizationOut])
def list_viz(dataset_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_dataset_for_user(dataset_id, user, db)
    return (
        db.query(Visualization)
        .filter(Visualization.dataset_id == dataset_id)
        .order_by(Visualization.created_at.desc())
        .all()
    )
