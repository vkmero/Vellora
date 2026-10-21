import io
import uuid
import pytest


def _create_user(client, role="analyst"):
    uid = uuid.uuid4().hex[:8]
    email = f"{role}_{uid}@vellora.io"
    resp = client.post(
        "/api/auth/register",
        json={
            "name": f"Test {role.title()}",
            "email": email,
            "password": "Password123",
            "confirm_password": "Password123",
        },
    )
    assert resp.status_code == 200

    # If role needs to be manager, update directly via database or login
    token = client.post("/api/auth/login", json={"email": email, "password": "Password123"}).json()["access_token"]
    return token, email, resp.json()["id"]


def test_master_18_step_workflow(client):
    # 1. Auth Setup (Analyst and Manager)
    analyst_token, analyst_email, analyst_id = _create_user(client, "analyst")
    manager_token, manager_email, manager_id = _create_user(client, "analyst")
    
    # Promote manager user in DB
    from app.database import SessionLocal
    from app.models.user import User
    with SessionLocal() as db:
        m_user = db.get(User, manager_id)
        m_user.role = "manager"
        db.commit()

    headers_analyst = {"Authorization": f"Bearer {analyst_token}"}
    headers_manager = {"Authorization": f"Bearer {manager_token}"}

    # 3. Create Project
    proj_resp = client.post(
        "/api/projects",
        headers=headers_analyst,
        json={
            "name": "Global Retail Intelligence Engagement",
            "description": "Comprehensive customer transaction & quality health analysis",
            "business_objective": "Improve data hygiene and uncover cross-category purchase drivers.",
            "client_name": "Acme Global Retail",
            "client_email": "stakeholder@acmeglobal.com",
            "assigned_manager_id": manager_id,
            "approval_policy": "optional",
        },
    )
    assert proj_resp.status_code == 200
    project = proj_resp.json()
    proj_id = project["id"]
    assert project["approval_policy"] == "optional"
    assert project["client_name"] == "Acme Global Retail"

    # 4. Upload Dataset linked to Project
    csv_content = (
        "transaction_id,customer_id,amount,category,region\n"
        "101,C01,250.50,Electronics,North\n"
        "102,C02,120.00,Home,South\n"
        "103,,45.00,Books,East\n"
        "104,C04,,Electronics,West\n"
        "105,C05,950.00,Luxury,North\n"
        "106,C06,120.00,Home,South\n"
        "107,C07,310.00,Electronics,East\n"
    )
    files = {"file": ("retail_sample.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    upload_resp = client.post(
        "/api/datasets/upload",
        headers=headers_analyst,
        data={"name": "Retail Transactions Q3", "project_id": proj_id},
        files=files,
    )
    assert upload_resp.status_code == 200
    dataset = upload_resp.json()
    dataset_id = dataset["id"]
    assert dataset["project_id"] == proj_id

    # 5. Run Profiling
    profile_resp = client.post(f"/api/datasets/{dataset_id}/profile", headers=headers_analyst)
    assert profile_resp.status_code == 200

    # 6. Run Quality Assessment
    quality_resp = client.post(f"/api/datasets/{dataset_id}/quality", headers=headers_analyst)
    assert quality_resp.status_code == 200
    assert quality_resp.json()["quality_score"] > 0

    # 7. Cleaning Studio
    clean_resp = client.post(
        f"/api/datasets/{dataset_id}/clean/apply",
        headers=headers_analyst,
        json={"action_type": "mean_imputation", "column_name": "amount", "value": None},
    )
    assert clean_resp.status_code == 200

    # 8. Revalidation (Must pass directly without mandatory manager approval because policy is optional!)
    val_resp = client.post(f"/api/datasets/{dataset_id}/validate", headers=headers_analyst)
    assert val_resp.status_code == 200
    assert val_resp.json()["validation_status"] == "completed"

    # 10. Exploratory Data Analysis (EDA)
    eda_resp = client.post(f"/api/datasets/{dataset_id}/analytics", headers=headers_analyst)
    assert eda_resp.status_code == 200

    # 12. Statistical Insights
    insights_resp = client.post(f"/api/datasets/{dataset_id}/insights", headers=headers_analyst)
    assert insights_resp.status_code == 200

    # 14. Summary Creator (Executive, Technical, Business, Presentation)
    for stype in ["executive", "technical", "business", "presentation"]:
        s_resp = client.post(
            "/api/summaries/generate",
            headers=headers_analyst,
            json={"dataset_id": dataset_id, "project_id": proj_id, "summary_type": stype},
        )
        assert s_resp.status_code == 200
        assert len(s_resp.json()["content"]) > 50

    # 15. Deliverables Center — Presentation PPTX (12 slides via python-pptx)
    pres_resp = client.post(
        "/api/deliverables/presentations/generate",
        headers=headers_analyst,
        json={"dataset_id": dataset_id, "project_id": proj_id, "custom_title": "Executive Retail Intelligence Deck"},
    )
    assert pres_resp.status_code == 200
    pres_data = pres_resp.json()
    assert pres_data["slide_count"] == 12
    assert pres_data["delivery_status"] == "delivered"
    assert pres_data["delivered_to_manager_id"] == manager_id

    # Verify download of presentation
    down_resp = client.get(f"/api/deliverables/presentations/{pres_data['id']}/download", headers=headers_analyst)
    assert down_resp.status_code == 200
    assert len(down_resp.content) > 1000

    # 15b. Deliverables Center — Comprehensive Report & Auto Delivery to Manager
    rep_resp = client.post(
        f"/api/datasets/{dataset_id}/reports",
        headers=headers_analyst,
        json={"report_type": "complete", "format": "pdf"},
    )
    assert rep_resp.status_code == 200
    report_data = rep_resp.json()
    assert report_data["delivery_status"] == "delivered"
    assert report_data["delivered_to_manager_id"] == manager_id
    rep_id = report_data["id"]

    # 16. Manager Review & Feedback Portal
    mgr_reports = client.get("/api/manager/reports/received", headers=headers_manager)
    assert mgr_reports.status_code == 200
    assert len(mgr_reports.json()) > 0

    rev_resp = client.post(
        f"/api/manager/reports/{rep_id}/review",
        headers=headers_manager,
        json={"review_status": "approved", "feedback": "Quality benchmarks verified and approved for client delivery."},
    )
    assert rev_resp.status_code == 200
    assert rev_resp.json()["manager_review_status"] == "approved"

    # 17. Manager-Controlled Client Communication through Gmail API
    # 17a. Draft generation
    draft_resp = client.post(
        "/api/communications/draft",
        headers=headers_manager,
        json={
            "project_id": proj_id,
            "report_id": rep_id,
            "presentation_id": pres_data["id"],
            "communication_type": "final_delivery",
        },
    )
    assert draft_resp.status_code == 200
    draft = draft_resp.json()
    assert "Acme Global Retail" in draft["body_text"]
    assert draft["recipient_email"] == "stakeholder@acmeglobal.com"

    # 17b. Send/Log Client Communication
    send_resp = client.post(
        "/api/communications/send",
        headers=headers_manager,
        json={
            "project_id": proj_id,
            "to_email": "stakeholder@acmeglobal.com",
            "client_name": "Acme Global Retail",
            "subject": draft["subject"],
            "body_text": draft["body_text"],
            "communication_type": "final_delivery",
            "report_id": rep_id,
            "presentation_id": pres_data["id"],
        },
    )
    assert send_resp.status_code == 200
    comm_log = send_resp.json()
    assert comm_log["status"] in {"sent", "draft"}
    assert comm_log["project_id"] == proj_id

    # 18. Final Results Dashboard / Deliverables list
    deliv_resp = client.get(f"/api/projects/{proj_id}/deliverables", headers=headers_analyst)
    assert deliv_resp.status_code == 200
    assert len(deliv_resp.json()["reports"]) > 0
    assert len(deliv_resp.json()["presentations"]) > 0
