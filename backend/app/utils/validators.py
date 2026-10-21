from pathlib import Path

from app.config import settings
from app.exceptions import BadRequestError, UnprocessableError

ALLOWED_EXTENSIONS = {".csv", ".xlsx"}
ALLOWED_MIME_TYPES = {
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream",
}


def validate_upload(filename: str, content_type: str | None, size: int) -> str:
    if not filename:
        raise BadRequestError("A file name is required.")
    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise UnprocessableError("Only CSV and XLSX files are supported.")
    if content_type and content_type.lower() not in ALLOWED_MIME_TYPES:
        raise UnprocessableError("The uploaded file type is not allowed.")
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if size > max_bytes:
        raise UnprocessableError(f"File exceeds the {settings.MAX_UPLOAD_SIZE_MB} MB limit.")
    if ".." in filename.replace("\\", "/") or filename.startswith("/") or ":" in Path(filename).name:
        raise BadRequestError("Invalid file name.")
    return suffix.lstrip(".")


def ensure_strong_password(password: str) -> None:
    if len(password) < 8:
        raise UnprocessableError("Password must be at least 8 characters.")
    if password.lower() == password or password.upper() == password:
        raise UnprocessableError("Password must include both uppercase and lowercase letters.")
    if not any(ch.isdigit() for ch in password):
        raise UnprocessableError("Password must include at least one number.")
