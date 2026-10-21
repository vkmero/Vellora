from fastapi import APIRouter

from app.config import settings
from app.database import check_database_connection

router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
def health():
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}


@router.get("/database")
def database_health():
    try:
        ok = check_database_connection()
        return {"status": "ok" if ok else "error", "database": "connected" if ok else "unavailable"}
    except Exception:
        return {"status": "error", "database": "unavailable"}
