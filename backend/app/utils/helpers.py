from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def safe_filename(original: str) -> str:
    stem = Path(original).stem
    suffix = Path(original).suffix.lower()
    cleaned = "".join(ch if ch.isalnum() or ch in ("-", "_") else "_" for ch in stem)[:80]
    return f"{cleaned}_{uuid4().hex}{suffix}"


def paginate(query, page: int, page_size: int):
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total": total,
        "pages": (total + page_size - 1) // page_size if page_size else 0,
    }


def json_safe(value: Any) -> Any:
    if hasattr(value, "item"):
        try:
            return value.item()
        except Exception:
            return str(value)
    if isinstance(value, float):
        if value != value:  # NaN
            return None
        return value
    return value
