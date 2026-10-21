import io
import uuid
import pytest


from app.config import settings


def _create_user(client, name="Analyst User", role="analyst"):
    email = f"user_{uuid.uuid4().hex[:8]}@vellora.io"
    reg = client.post(
        "/api/auth/register",
        json={
            "name": name,
            "email": email,
            "password": "Password123!",
            "confirm_password": "Password123!",
        },
    )
    assert reg.status_code == 200

    token = client.post(
        "/api/auth/login",
        json={"email": email, "password": "Password123!"},
    ).json()["access_token"]

    return {"Authorization": f"Bearer {token}"}, email


def test_full_governance_and_analytics_pipeline(client):
    if not settings.BOOTSTRAP_ADMIN_EMAIL or not settings.BOOTSTRAP_ADMIN_PASSWORD:
        pytest.skip("Configure bootstrap admin credentials in the local test environment.")
    # 1. Analyst registers and logs in
    analyst_headers, analyst_email = _create_user(client, "Analyst Jane")

    # 2. Upload CSV dataset with realistic business columns & intentional anomalies
    csv_content = (
        "id,product,revenue,profit,quantity,region\n"
        "1,Fiber Kit,1200,300,10,Hyderabad\n"
        "2,Sensor Pack,850,150,5,hyderabad\n"
        "3,Analytics Suite,2400,600,2,HYDERABAD\n"
        "4,Starter Bundle,400,-50,4,Bengaluru\n"
        "1,Fiber Kit,1200,300,10,Hyderabad\n"  # Exact duplicate row
        "6,Sensor Pack,,120,3,Chennai\n"        # Missing revenue
        "7,Analytics Suite,3000,800,3,Chennai\n"
        "8,Starter Bundle,450,50,4,Bengaluru\n"
        "9,Fiber Kit,1300,320,11,Hyderabad\n"
        "10,Sensor Pack,900,180,6,Bengaluru\n"
        "11,Analytics Suite,2600,700,2,Chennai\n"
        "12,Starter Bundle,420,40,4,Hyderabad\n"
        "13,Fiber Kit,1250,310,10,Bengaluru\n"
        "14,Sensor Pack,880,160,5,Chennai\n"
        "15,Analytics Suite,2500,650,2,Hyderabad\n"
        "16,Starter Bundle,410,45,4,Chennai\n"
        "17,Fiber Kit,1220,305,10,Bengaluru\n"
        "18,Sensor Pack,870,155,5,Hyderabad\n"
        "19,Analytics Suite,2550,680,2,Bengaluru\n"
        "20,Starter Bundle,430,48,4,Hyderabad\n"
        "21,Fiber Kit,1280,315,10,Chennai\n"
        "22,Sensor Pack,890,170,6,Bengaluru\n"
        "23,Analytics Suite,2700,720,3,Hyderabad\n"
        "24,Starter Bundle,440,52,4,Chennai\n"
    )

    upload_resp = client.post(
        "/api/datasets/upload",
        headers=analyst_headers,
        data={"name": "Q3 Enterprise Sales"},
        files={"file": ("sales.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")},
    )
    assert upload_resp.status_code == 200
    dataset = upload_resp.json()
    dataset_id = dataset["id"]
    assert dataset["row_count"] == 24
    assert dataset["column_count"] == 6

    # 3. Structural profiling
    prof_resp = client.post(f"/api/datasets/{dataset_id}/profile", headers=analyst_headers)
    assert prof_resp.status_code == 200
    profile = prof_resp.json()
    assert profile["row_count"] == 24

    # 4. Quality Assessment
    qual_resp = client.post(f"/api/datasets/{dataset_id}/quality", headers=analyst_headers)
    assert qual_resp.status_code == 200
    quality = qual_resp.json()
    initial_score = quality["quality_score"]
    assert len(quality["issues"]) > 0

    # 5. Interactive Cleaning Preview
    prev_resp = client.post(
        f"/api/datasets/{dataset_id}/clean/preview",
        headers=analyst_headers,
        json={"action_type": "remove_duplicates", "column_name": None, "value": None},
    )
    assert prev_resp.status_code == 200
    preview = prev_resp.json()
    assert preview["affected_rows"] == 1
    assert preview["after_count"] == 23

    # 6. Apply Cleansing: Remove Duplicates
    clean_resp = client.post(
        f"/api/datasets/{dataset_id}/clean/apply",
        headers=analyst_headers,
        json={"action_type": "remove_duplicates", "column_name": None, "value": None},
    )
    assert clean_resp.status_code == 200

    # 7. Apply Cleansing: Mean Imputation for missing revenue
    impute_resp = client.post(
        f"/api/datasets/{dataset_id}/clean/apply",
        headers=analyst_headers,
        json={"action_type": "mean_imputation", "column_name": "revenue", "value": None},
    )
    assert impute_resp.status_code == 200

    # 8. Apply Cleansing: Standardize Region Categories
    std_resp = client.post(
        f"/api/datasets/{dataset_id}/clean/apply",
        headers=analyst_headers,
        json={"action_type": "standardize_categories", "column_name": "region", "value": None},
    )
    assert std_resp.status_code == 200

    # 9. Submit for Manager Approval
    submit_resp = client.post(f"/api/datasets/{dataset_id}/submit-approval", headers=analyst_headers)
    assert submit_resp.status_code == 200
    approval_id = submit_resp.json()["id"]

    # 10. Manager signs in and approves dataset
    admin_login = client.post(
        "/api/auth/login",
        json={"email": settings.BOOTSTRAP_ADMIN_EMAIL, "password": settings.BOOTSTRAP_ADMIN_PASSWORD},
    )
    assert admin_login.status_code == 200
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    approve_resp = client.post(
        f"/api/approvals/{approval_id}/approve",
        headers=admin_headers,
        json={"comments": "Excellent cleaning pipeline. Quality verified."},
    )
    assert approve_resp.status_code == 200
    assert approve_resp.json()["status"] == "approved"

    # 11. Revalidation Audit
    val_resp = client.post(f"/api/datasets/{dataset_id}/validate", headers=analyst_headers)
    assert val_resp.status_code == 200
    validation = val_resp.json()
    assert validation["validation_status"] == "completed"
    assert validation["new_quality_score"] >= initial_score

    # 12. Exploratory Data Analysis (EDA)
    eda_resp = client.post(f"/api/datasets/{dataset_id}/analytics", headers=analyst_headers)
    assert eda_resp.status_code == 200
    analytics = eda_resp.json()["results"]
    assert "numeric" in analytics
    assert "revenue" in analytics["numeric"]
    assert "correlation" in analytics

    # 13. Interactive Visualizations
    viz_resp = client.post(
        f"/api/datasets/{dataset_id}/visualizations",
        headers=analyst_headers,
        json={
            "chart_type": "bar",
            "x_column": "region",
            "y_column": "revenue",
            "aggregation": "sum",
        },
    )
    assert viz_resp.status_code == 200
    viz_data = viz_resp.json()["configuration"]["data"]
    assert len(viz_data) > 0

    # 14. Algorithmic Business Insights
    insights_resp = client.post(f"/api/datasets/{dataset_id}/insights", headers=analyst_headers)
    assert insights_resp.status_code == 200
    insights = insights_resp.json()
    assert len(insights) > 0
    assert "title" in insights[0]
    assert "evidence" in insights[0]

    # 15. Predictive Machine Learning (Regression on Revenue)
    pred_resp = client.post(
        f"/api/datasets/{dataset_id}/predictions",
        headers=analyst_headers,
        json={
            "target_column": "revenue",
            "features": ["profit", "quantity"],
            "problem_type": "regression",
            "model_type": "linear_regression",
        },
    )
    assert pred_resp.status_code == 200
    pred_data = pred_resp.json()
    assert "r2" in pred_data["metrics"]
    assert len(pred_data["predictions"]["sample"]) > 0

    # 16. Compile ReportLab PDF Dossier
    pdf_resp = client.post(
        f"/api/datasets/{dataset_id}/reports",
        headers=analyst_headers,
        json={"report_type": "complete", "format": "pdf"},
    )
    assert pdf_resp.status_code == 200
    report_id = pdf_resp.json()["id"]

    # 17. Download Report
    download_resp = client.get(f"/api/reports/{report_id}/download", headers=analyst_headers)
    assert download_resp.status_code == 200
    assert len(download_resp.content) > 0

    # 18. Compile Excel Report
    xlsx_resp = client.post(
        f"/api/datasets/{dataset_id}/reports",
        headers=analyst_headers,
        json={"report_type": "complete", "format": "xlsx"},
    )
    assert xlsx_resp.status_code == 200

    # 19. Admin Console Checks (Stats & Audit Logs)
    stats_resp = client.get("/api/admin/system-stats", headers=admin_headers)
    assert stats_resp.status_code == 200
    assert stats_resp.json()["total_datasets"] >= 1

    logs_resp = client.get("/api/admin/audit-logs", headers=admin_headers)
    assert logs_resp.status_code == 200
    assert len(logs_resp.json()["items"]) > 0
