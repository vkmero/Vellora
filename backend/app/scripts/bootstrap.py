"""Development bootstrap. Does not run automatically in production."""

from app.config import settings
from app.database import SessionLocal
from app.models.user import User
from app.security import hash_password


def bootstrap_admin() -> None:
    if not settings.BOOTSTRAP_ADMIN_EMAIL or not settings.BOOTSTRAP_ADMIN_PASSWORD:
        print("Set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD to create an admin.")
        return
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == settings.BOOTSTRAP_ADMIN_EMAIL.lower()).first()
        if existing:
            print("Admin already exists.")
            return
        user = User(
            name=settings.BOOTSTRAP_ADMIN_NAME,
            email=settings.BOOTSTRAP_ADMIN_EMAIL.lower(),
            password_hash=hash_password(settings.BOOTSTRAP_ADMIN_PASSWORD),
            role="admin",
            is_active=True,
        )
        db.add(user)
        db.commit()
        print(f"Created admin {user.email}")
    finally:
        db.close()


if __name__ == "__main__":
    bootstrap_admin()
