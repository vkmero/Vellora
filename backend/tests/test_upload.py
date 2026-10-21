import io
import uuid

import pandas as pd
from openpyxl import Workbook


def _auth(client):
    email = f"up_{uuid.uuid4().hex[:8]}@vellora.io"
    client.post(
        "/api/auth/register",
        json={"name": "Uploader", "email": email, "password": "Password123", "confirm_password": "Password123"},
    )
    token = client.post("/api/auth/login", json={"email": email, "password": "Password123"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_csv_upload_and_parse(client):
    headers = _auth(client)
    csv = "revenue,region\n100,Hyderabad\n,hyderabad\n100,HYDERABAD\n"
    response = client.post(
        "/api/datasets/upload",
        headers=headers,
        files={"file": ("sales.csv", io.BytesIO(csv.encode()), "text/csv")},
    )
    assert response.status_code == 200
    assert response.json()["row_count"] == 3


def test_excel_upload(client):
    headers = _auth(client)
    wb = Workbook()
    ws = wb.active
    ws.append(["product", "quantity"])
    ws.append(["Kit", 3])
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    response = client.post(
        "/api/datasets/upload",
        headers=headers,
        files={"file": ("sales.xlsx", buf, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
    )
    assert response.status_code == 200
    assert response.json()["file_type"] == "xlsx"
