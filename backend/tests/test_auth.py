import uuid


def _email():
    return f"analyst_{uuid.uuid4().hex[:8]}@vellora.io"


def test_register_login_me_jwt(client):
    email = _email()
    register = client.post(
        "/api/auth/register",
        json={
            "name": "Test Analyst",
            "email": email,
            "password": "Password123",
            "confirm_password": "Password123",
        },
    )
    assert register.status_code == 200
    assert register.json()["role"] == "analyst"

    login = client.post("/api/auth/login", json={"email": email, "password": "Password123"})
    assert login.status_code == 200
    token = login.json()["access_token"]
    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == email


def test_duplicate_email(client):
    email = _email()
    payload = {
        "name": "Dup",
        "email": email,
        "password": "Password123",
        "confirm_password": "Password123",
    }
    assert client.post("/api/auth/register", json=payload).status_code == 200
    assert client.post("/api/auth/register", json=payload).status_code == 409


def test_authorization_without_token(client):
    assert client.get("/api/datasets").status_code == 401


def test_forgot_password_no_enumeration(client):
    response = client.post("/api/auth/forgot-password", json={"email": "missing@vellora.io"})
    assert response.status_code == 200
    assert "account" in response.json()["message"].lower()
