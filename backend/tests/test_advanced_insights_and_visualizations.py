import io
import uuid
import pytest


from app.config import settings


def _create_analyst_and_dataset(client, csv_data, dataset_name="Enterprise Test Dataset"):
    if not settings.BOOTSTRAP_ADMIN_EMAIL or not settings.BOOTSTRAP_ADMIN_PASSWORD:
        pytest.skip("Configure bootstrap admin credentials in the local test environment.")
    email = f"analyst_{uuid.uuid4().hex[:8]}@vellora.io"
    client.post(
        "/api/auth/register",
        json={"name": "Analyst Testing", "email": email, "password": "Password123!", "confirm_password": "Password123!"},
    )
    token = client.post("/api/auth/login", json={"email": email, "password": "Password123!"}).json()["access_token"]
    analyst_headers = {"Authorization": f"Bearer {token}"}

    upload_resp = client.post(
        "/api/datasets/upload",
        headers=analyst_headers,
        data={"name": dataset_name},
        files={"file": ("test_data.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")},
    )
    dataset_id = upload_resp.json()["id"]

    # Profile & Quality
    client.post(f"/api/datasets/{dataset_id}/profile", headers=analyst_headers)
    client.post(f"/api/datasets/{dataset_id}/quality", headers=analyst_headers)

    # Submit for approval
    submit_resp = client.post(f"/api/datasets/{dataset_id}/submit-approval", headers=analyst_headers)
    approval_id = submit_resp.json()["id"]

    # Admin approves
    admin_login = client.post("/api/auth/login", json={"email": settings.BOOTSTRAP_ADMIN_EMAIL, "password": settings.BOOTSTRAP_ADMIN_PASSWORD})
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    client.post(f"/api/approvals/{approval_id}/approve", headers=admin_headers, json={"comments": "Approved for testing."})

    # Validate
    client.post(f"/api/datasets/{dataset_id}/validate", headers=analyst_headers)

    # EDA
    eda_resp = client.post(f"/api/datasets/{dataset_id}/analytics", headers=analyst_headers)
    assert eda_resp.status_code == 200

    return analyst_headers, dataset_id


def test_chart_recommendations_and_advanced_plotting(client):
    csv_sales = (
        "id,date,product,category,revenue,cost,profit,quantity,region\n"
        "1,2024-01-15,Alpha Sensor,Hardware,1500,800,700,10,North\n"
        "2,2024-01-20,Beta Gateway,Hardware,2400,1600,800,8,North\n"
        "3,2024-02-05,Cloud Analytics,SaaS,3200,600,2600,4,South\n"
        "4,2024-02-18,Edge Node,Hardware,1800,1200,600,6,West\n"
        "5,2024-03-10,Alpha Sensor,Hardware,1650,850,800,11,East\n"
        "6,2024-03-22,Cloud Analytics,SaaS,3400,700,2700,5,North\n"
        "7,2024-04-05,Edge Node,Hardware,1750,1150,600,6,South\n"
        "8,2024-04-19,Support Retainer,Services,900,400,500,2,West\n"
        "9,2024-05-12,Beta Gateway,Hardware,2550,1700,850,9,East\n"
        "10,2024-05-28,Cloud Analytics,SaaS,3600,750,2850,5,South\n"
        "11,2024-06-11,Support Retainer,Services,950,450,500,2,North\n"
        "12,2024-06-25,Alpha Sensor,Hardware,1700,880,820,12,West\n"
    )

    headers, dataset_id = _create_analyst_and_dataset(client, csv_sales, "Q1-Q2 Tech Sales")

    # 1. Test Column Metadata
    meta_resp = client.get(f"/api/datasets/{dataset_id}/visualizations/columns-meta", headers=headers)
    assert meta_resp.status_code == 200
    meta = meta_resp.json()
    assert len(meta["columns"]) == 9
    assert "revenue" in meta["numeric_columns"]
    assert "date" in meta["date_columns"]
    assert "id" in meta["id_columns"]

    # 2. Test Automatic Chart Recommendations
    rec_resp = client.get(f"/api/datasets/{dataset_id}/visualizations/recommendations", headers=headers)
    assert rec_resp.status_code == 200
    recs = rec_resp.json()
    assert len(recs) >= 3
    # Check that recommendation contains reasoning and interpretation
    rec_types = [r["chart_type"] for r in recs]
    assert any(t in rec_types for t in ["line", "bar", "scatter", "histogram", "heatmap"])
    assert "reason" in recs[0]
    assert "interpretation" in recs[0]

    # 3. Test Preview for Bar Chart with Custom Aggregations (Sum, Mean, Median)
    bar_resp = client.post(
        f"/api/datasets/{dataset_id}/visualizations/preview",
        headers=headers,
        json={"chart_type": "bar", "x_column": "region", "y_column": "revenue", "aggregation": "mean"},
    )
    assert bar_resp.status_code == 200
    bar_data = bar_resp.json()
    assert len(bar_data["data"]) == 4
    assert "interpretation" in bar_data

    # 4. Test Preview for Line Chart with Time Bucket
    line_resp = client.post(
        f"/api/datasets/{dataset_id}/visualizations/preview",
        headers=headers,
        json={"chart_type": "line", "x_column": "date", "y_column": "revenue", "time_bucket": "month", "aggregation": "sum"},
    )
    assert line_resp.status_code == 200
    assert len(line_resp.json()["data"]) >= 5

    # 5. Test Preview for Scatter Plot with Correlation
    scatter_resp = client.post(
        f"/api/datasets/{dataset_id}/visualizations/preview",
        headers=headers,
        json={"chart_type": "scatter", "x_column": "revenue", "y_column": "profit"},
    )
    assert scatter_resp.status_code == 200
    scatter_data = scatter_resp.json()
    assert len(scatter_data["data"]) == 12
    assert "Pearson correlation" in scatter_data["interpretation"]

    # 6. Test Preview for Box Plot Five-Number Summary
    box_resp = client.post(
        f"/api/datasets/{dataset_id}/visualizations/preview",
        headers=headers,
        json={"chart_type": "box", "x_column": "revenue"},
    )
    assert box_resp.status_code == 200
    box_data = box_resp.json()["data"][0]
    assert "median" in box_data
    assert "q1" in box_data
    assert "q3" in box_data
    assert "outlier_count" in box_data

    # 7. Test Preview for Heatmap
    heat_resp = client.post(
        f"/api/datasets/{dataset_id}/visualizations/preview",
        headers=headers,
        json={"chart_type": "heatmap"},
    )
    assert heat_resp.status_code == 200
    heat_data = heat_resp.json()["data"]
    assert "columns" in heat_data
    assert len(heat_data["values"]) >= 2

    # 8. Test Data Export (CSV & JSON)
    csv_exp = client.post(
        f"/api/datasets/{dataset_id}/visualizations/export?format=csv",
        headers=headers,
        json={"chart_type": "bar", "x_column": "category", "y_column": "revenue", "aggregation": "sum"},
    )
    assert csv_exp.status_code == 200
    assert "Hardware" in csv_exp.text

    json_exp = client.post(
        f"/api/datasets/{dataset_id}/visualizations/export?format=json",
        headers=headers,
        json={"chart_type": "bar", "x_column": "category", "y_column": "revenue", "aggregation": "sum"},
    )
    assert json_exp.status_code == 200
    assert "data" in json_exp.json()


def test_deterministic_insights_engine_and_domain_synthesis(client):
    csv_sales = (
        "id,date,product,category,revenue,cost,profit,quantity,region\n"
        "1,2024-01-15,Alpha Sensor,Hardware,1500,800,700,10,North\n"
        "2,2024-01-20,Beta Gateway,Hardware,2400,1600,800,8,North\n"
        "3,2024-02-05,Cloud Analytics,SaaS,3200,600,2600,4,South\n"
        "4,2024-02-18,Edge Node,Hardware,1800,1200,600,6,West\n"
        "5,2024-03-10,Alpha Sensor,Hardware,1650,850,800,11,East\n"
        "6,2024-03-22,Cloud Analytics,SaaS,3400,700,2700,5,North\n"
        "7,2024-04-05,Edge Node,Hardware,1750,1150,600,6,South\n"
        "8,2024-04-19,Support Retainer,Services,900,400,500,2,West\n"
        "9,2024-05-12,Beta Gateway,Hardware,2550,1700,850,9,East\n"
        "10,2024-05-28,Cloud Analytics,SaaS,3600,750,2850,5,South\n"
        "11,2024-06-11,Support Retainer,Services,950,450,500,2,North\n"
        "12,2024-06-25,Alpha Sensor,Hardware,1700,880,820,12,West\n"
    )

    headers, dataset_id = _create_analyst_and_dataset(client, csv_sales, "Sales Intelligence")

    # Generate Insights
    ins_resp = client.post(f"/api/datasets/{dataset_id}/insights", headers=headers)
    assert ins_resp.status_code == 200
    insights = ins_resp.json()
    assert len(insights) >= 3

    # Check evidence structure on all insights
    for item in insights:
        assert "title" in item
        assert "category" in item
        assert "severity" in item
        assert "recommendation" in item
        ev = item["evidence"]
        assert ev is not None
        assert "supporting_metric" in ev
        assert "business_interpretation" in ev
        assert "suggested_action" in ev
        assert "reliability" in ev
        assert "reliability_reason" in ev

    # Check categories represented
    categories = [i["category"] for i in insights]
    assert any(c in categories for c in ["performance", "distribution", "relationship", "opportunity"])

    # Test Summary Endpoint
    sum_resp = client.get(f"/api/datasets/{dataset_id}/insights/summary", headers=headers)
    assert sum_resp.status_code == 200
    summary = sum_resp.json()
    assert summary["total_insights"] == len(insights)
    assert "categories" in summary
    assert "high_reliability_percentage" in summary

    # Test Insights Export
    csv_resp = client.get(f"/api/datasets/{dataset_id}/insights/export?format=csv", headers=headers)
    assert csv_resp.status_code == 200
    assert "Business Interpretation" in csv_resp.text

    json_resp = client.get(f"/api/datasets/{dataset_id}/insights/export?format=json", headers=headers)
    assert json_resp.status_code == 200
    assert isinstance(json_resp.json(), list)


def test_non_sales_dataset_insights_generalization(client):
    """Verify that datasets without commercial columns (e.g. Student Performance) generate robust insights without crashing."""
    csv_students = (
        "student_id,subject,marks,attendance,grade\n"
        "101,Mathematics,88,94,A\n"
        "102,Mathematics,72,80,B\n"
        "103,Physics,91,96,A\n"
        "104,Physics,65,70,C\n"
        "105,Chemistry,78,85,B\n"
        "106,Chemistry,84,89,B\n"
        "107,Mathematics,95,98,A\n"
        "108,Physics,58,62,D\n"
        "109,Chemistry,81,86,B\n"
        "110,Mathematics,60,65,D\n"
        "111,Physics,89,92,A\n"
        "112,Chemistry,76,82,B\n"
    )

    headers, dataset_id = _create_analyst_and_dataset(client, csv_students, "Student Academic Cohort")

    # Generate insights on academic dataset
    ins_resp = client.post(f"/api/datasets/{dataset_id}/insights", headers=headers)
    assert ins_resp.status_code == 200
    insights = ins_resp.json()
    assert len(insights) >= 2

    # Verify no financial hallucination occurred
    titles = [i["title"].lower() for i in insights]
    assert not any("revenue" in t or "profit" in t for t in titles)

    # Verify academic distribution and relationship were detected
    categories = [i["category"] for i in insights]
    assert any(c in categories for c in ["performance", "distribution", "relationship", "opportunity"])
