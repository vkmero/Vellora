from pathlib import Path

from fastapi import UploadFile

from app.config import settings
from app.utils.helpers import safe_filename
from app.utils.validators import validate_upload

ROOT = Path(__file__).resolve().parents[2]
ORIGINAL_DIR = ROOT / "uploads" / "original"
CLEANED_DIR = ROOT / "uploads" / "cleaned"
PDF_DIR = ROOT / "reports" / "pdf"
EXCEL_DIR = ROOT / "reports" / "excel"
PPTX_DIR = ROOT / "reports" / "presentations"


def ensure_storage() -> None:
    for path in (ORIGINAL_DIR, CLEANED_DIR, PDF_DIR, EXCEL_DIR, PPTX_DIR):
        path.mkdir(parents=True, exist_ok=True)


async def save_upload(file: UploadFile) -> tuple[str, str, int, str]:
    ensure_storage()
    content = await file.read()
    file_type = validate_upload(file.filename or "", file.content_type, len(content))
    stored = safe_filename(file.filename or "dataset.csv")
    dest = ORIGINAL_DIR / stored
    dest.write_bytes(content)
    return file.filename or stored, str(dest), len(content), file_type


def cleaned_path_for(original_path: str) -> str:
    ensure_storage()
    name = Path(original_path).name
    return str(CLEANED_DIR / name)
