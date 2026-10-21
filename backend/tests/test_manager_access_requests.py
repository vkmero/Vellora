import uuid
import pytest


from app.config import settings


def test_manager_access_request_lifecycle_and_governance(client):
    if not settings.BOOTSTRAP_ADMIN_EMAIL or not settings.BOOTSTRAP_ADMIN_PASSWORD:
        pytest.skip("Configure bootstrap admin credentials in the local test environment.")
    # 1. Register a fresh analyst
    analyst_email = f"analyst_req_{uuid.uuid4().hex[:8]}@vellora.io"
    reg_resp = client.post(
        "/api/auth/register",
        json={
            "name": "Sarah Connor",
            "email": analyst_email,
            "password": "Password123!",
            "confirm_password": "Password123!",
        },
    )
    assert reg_resp.status_code == 200
    analyst_user_id = reg_resp.json()["id"]

    # Login analyst
    login_resp = client.post("/api/auth/login", json={"email": analyst_email, "password": "Password123!"})
    analyst_token = login_resp.json()["access_token"]
    analyst_headers = {"Authorization": f"Bearer {analyst_token}"}

    # 2. Check me before request
    me_req_resp = client.get("/api/auth/manager-access-request/me", headers=analyst_headers)
    assert me_req_resp.status_code == 200
    assert me_req_resp.json()["has_request"] is False

    # 3. Submit Manager Access Request
    submit_resp = client.post(
        "/api/auth/manager-access-request",
        headers=analyst_headers,
        json={
            "organization_or_team": "Risk & Compliance Data Ops",
            "reason": "Need Governance Manager permissions to review and sign off analytical data audits.",
        },
    )
    assert submit_resp.status_code == 200
    request_data = submit_resp.json()
    assert request_data["status"] == "pending"
    request_id = request_data["id"]

    # 4. Duplicate pending request must be rejected with 409 Conflict
    dup_resp = client.post(
        "/api/auth/manager-access-request",
        headers=analyst_headers,
        json={
            "organization_or_team": "Risk & Compliance",
            "reason": "Duplicate attempt to request manager access.",
        },
    )
    assert dup_resp.status_code == 409

    # 5. Check me after request
    me_req_resp = client.get("/api/auth/manager-access-request/me", headers=analyst_headers)
    assert me_req_resp.status_code == 200
    assert me_req_resp.json()["has_request"] is True
    assert me_req_resp.json()["request"]["status"] == "pending"

    # 6. Admin logs in
    admin_login = client.post("/api/auth/login", json={"email": settings.BOOTSTRAP_ADMIN_EMAIL, "password": settings.BOOTSTRAP_ADMIN_PASSWORD})
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin lists requests
    admin_list_resp = client.get("/api/admin/manager-requests?status=pending", headers=admin_headers)
    assert admin_list_resp.status_code == 200
    items = admin_list_resp.json()["items"]
    assert any(item["id"] == request_id for item in items)

    # 7. Admin reviews and approves
    review_resp = client.post(
        f"/api/admin/manager-requests/{request_id}/review",
        headers=admin_headers,
        json={"status": "approved", "admin_notes": "Verified team lead endorsement. Approved."},
    )
    assert review_resp.status_code == 200
    assert review_resp.json()["status"] == "approved"

    # 8. Check that target user's role is now 'manager'
    updated_user = client.get(f"/api/admin/users/{analyst_user_id}", headers=admin_headers).json()
    assert updated_user["role"] == "manager"

    # 9. Verify notifications received by user
    notif_resp = client.get("/api/notifications", headers=analyst_headers)
    assert notif_resp.status_code == 200
    notifs = notif_resp.json().get("items", [])
    assert any("Manager Access Approved" in n["title"] for n in notifs)


def test_oauth_providers_endpoint(client):
    resp = client.get("/api/auth/oauth/providers")
    assert resp.status_code == 200
    data = resp.json()
    assert "google" in data
    assert "github" in data
    assert "linkedin" in data
    assert data["google"]["name"] == "Google"
    assert data["github"]["name"] == "GitHub"
    assert data["linkedin"]["name"] == "LinkedIn"


def test_oauth_unconfigured_provider_error(client):
    # Calling unconfigured provider returns 501 with helpful instructions
    resp = client.get("/api/auth/oauth/google/url")
    assert resp.status_code == 501
    error_msg = resp.json().get("message") or resp.json().get("detail", "")
    assert "not configured" in error_msg.lower()
