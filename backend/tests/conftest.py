import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

os.chdir(Path(__file__).resolve().parents[1])

from app.config import get_settings

get_settings.cache_clear()

from app.main import app
from app.database import check_database_connection


@pytest.fixture(scope="session")
def client():
    if not os.environ.get("DATABASE_URL") and not Path(".env").exists():
        pytest.skip("DATABASE_URL is required for API tests.")
    try:
        check_database_connection()
    except Exception:
        pytest.skip("PostgreSQL is not available.")
    return TestClient(app)
