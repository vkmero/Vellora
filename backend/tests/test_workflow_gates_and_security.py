import io
import uuid
import pytest

from app.database import SessionLocal
from app.models.user import User
from app.security import hash_password


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

    if role != "analyst":
        db = SessionLocal()
        u = db.query(User).filter(User.email == email).first()
        u.role = role
        db.commit()
        db.close()

    token = client.post(
        "/api/auth/login",
        json={"email": email, "password": "Password123!"},
    ).json()["access_token"]

    return {"Authorization": f"Bearer {token}"}, email


def _upload_small_dataset(client, headers, name="Sample Data"):
    csv_data = "col1,col2,col3\n10,20,30\n40,50,60\n"
    res = client.post(
        "/api/datasets/upload",
        headers=headers,
        data={"name": name},
        files={"file": ("test.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")},
    )
    assert res.status_code == 200
    return res.json()


def test_dataset_preview_endpoint(client):
    analyst_h, _ = _create_user(client, "Preview Tester")
    ds = _upload_small_dataset(client, analyst_h, "Preview Test Dataset")
    ds_id = ds["id"]

    # Preview works with limit
    prev_res = client.get(f"/api/datasets/{ds_id}/preview?limit=1", headers=analyst_h)
    assert prev_res.status_code == 200
    prev_data = prev_res.json()
    assert prev_data["dataset_id"] == ds_id
    assert prev_data["columns"] == ["col1", "col2", "col3"]
    assert len(prev_data["rows"]) == 1
    assert prev_data["preview_count"] == 1
    assert prev_data["row_count"] == 2


def test_unapproved_dataset_cannot_reach_validation(client):
    analyst_h, _ = _create_user(client, "Validation Gate Tester")
    ds = _upload_small_dataset(client, analyst_h)
    ds_id = ds["id"]

    # Attempt to validate an unapproved dataset
    val_res = client.post(f"/api/datasets/{ds_id}/validate", headers=analyst_h)
    assert val_res.status_code == 422
    assert "WORKFLOW_STAGE_REQUIRED" in val_res.json().get("code", "")


def test_unapproved_dataset_cannot_reach_analytics(client):
    analyst_h, _ = _create_user(client, "Analytics Gate Tester")
    ds = _upload_small_dataset(client, analyst_h)
    ds_id = ds["id"]

    # Attempt to run analytics on raw unapproved dataset
    res = client.post(f"/api/datasets/{ds_id}/analytics", headers=analyst_h)
    assert res.status_code == 422
    assert "WORKFLOW_STAGE_REQUIRED" in res.json().get("code", "")


def test_self_approval_is_prevented(client):
    # Manager uploads a dataset
    mgr_h, _ = _create_user(client, "Manager Submitter", role="manager")
    ds = _upload_small_dataset(client, mgr_h, "Manager Submission")
    ds_id = ds["id"]

    # Profile & quality
    client.post(f"/api/datasets/{ds_id}/profile", headers=mgr_h)
    client.post(f"/api/datasets/{ds_id}/quality", headers=mgr_h)

    # Submit for approval
    sub_res = client.post(f"/api/datasets/{ds_id}/submit-approval", headers=mgr_h)
    assert sub_res.status_code == 200
    approval_id = sub_res.json()["id"]

    # Manager attempts to approve their OWN dataset
    approve_res = client.post(
        f"/api/approvals/{approval_id}/approve",
        headers=mgr_h,
        json={"comments": "Self-approving my own dataset"},
    )
    assert approve_res.status_code == 403
    assert "Self-approval is forbidden" in approve_res.json().get("message", "")


def test_analyst_cannot_approve(client):
    analyst_h, _ = _create_user(client, "Rogue Analyst")
    approve_res = client.post(
        "/api/approvals/1/approve",
        headers=analyst_h,
        json={"comments": "I want to approve"},
    )
    assert approve_res.status_code == 403


def test_manager_cannot_access_admin_endpoints(client):
    mgr_h, _ = _create_user(client, "Manager User", role="manager")
    res = client.get("/api/admin/system-stats", headers=mgr_h)
    assert res.status_code == 403

    users_res = client.get("/api/admin/users", headers=mgr_h)
    assert users_res.status_code == 403


def test_analyst_cannot_access_another_analyst_dataset(client):
    analyst1_h, _ = _create_user(client, "Analyst Alpha")
    analyst2_h, _ = _create_user(client, "Analyst Beta")

    ds = _upload_small_dataset(client, analyst1_h, "Alpha Private Data")
    ds_id = ds["id"]

    # Analyst Beta tries to read Alpha's dataset
    res = client.get(f"/api/datasets/{ds_id}", headers=analyst2_h)
    assert res.status_code == 403


def test_duplicate_pending_approval_prevented(client):
    analyst_h, _ = _create_user(client, "Approval Duplication Tester")
    ds = _upload_small_dataset(client, analyst_h)
    ds_id = ds["id"]

    client.post(f"/api/datasets/{ds_id}/profile", headers=analyst_h)
    client.post(f"/api/datasets/{ds_id}/quality", headers=analyst_h)

    # First submission succeeds
    sub1 = client.post(f"/api/datasets/{ds_id}/submit-approval", headers=analyst_h)
    assert sub1.status_code == 200

    # Second submission is rejected with 409 Conflict
    sub2 = client.post(f"/api/datasets/{ds_id}/submit-approval", headers=analyst_h)
    assert sub2.status_code == 409
    assert "already pending" in sub2.json().get("message", "")
