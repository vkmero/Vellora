from app.database import check_database_connection


def test_database_connection(client):
    assert check_database_connection() is True
    response = client.get("/api/health/database")
    assert response.status_code == 200
    assert response.json()["database"] == "connected"
