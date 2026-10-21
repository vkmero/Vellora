import io
import uuid


def _dataset(client):
    email = f"q_{uuid.uuid4().hex[:8]}@vellora.io"
    client.post(
        "/api/auth/register",
        json={"name": "Quality", "email": email, "password": "Password123", "confirm_password": "Password123"},
    )
    token = client.post("/api/auth/login", json={"email": email, "password": "Password123"}).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    csv = "id,revenue,region\n1,10,Hyderabad\n2,,hyderabad\n3,10,HYDERABAD\n3,10,HYDERABAD\n"
    dataset = client.post(
        "/api/datasets/upload",
        headers=headers,
        files={"file": ("q.csv", io.BytesIO(csv.encode()), "text/csv")},
    ).json()
    return headers, dataset["id"]


def test_profile_and_quality(client):
    headers, dataset_id = _dataset(client)
    profile = client.post(f"/api/datasets/{dataset_id}/profile", headers=headers)
    assert profile.status_code == 200
    assert profile.json()["row_count"] == 4
    quality = client.post(f"/api/datasets/{dataset_id}/quality", headers=headers)
    assert quality.status_code == 200
    body = quality.json()
    assert 0 <= body["quality_score"] <= 100
    assert body["issues"]
