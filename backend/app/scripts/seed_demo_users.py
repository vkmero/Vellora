"""Seed standard demo users for Analyst, Manager, and Admin roles."""

from app.database import SessionLocal
from app.models.user import User
from app.security import hash_password

DEMO_USERS = [
    {
        "name": "System Administrator",
        "email": "admin@vellora.io",
        "password": "Password@123",
        "role": "admin",
    },
    {
        "name": "Governance Manager",
        "email": "manager@vellora.io",
        "password": "Password@123",
        "role": "manager",
    },
    {
        "name": "Data Analyst",
        "email": "analyst@vellora.io",
        "password": "Password@123",
        "role": "analyst",
    },
]


def seed_users() -> None:
    db = SessionLocal()
    try:
        for u in DEMO_USERS:
            existing = db.query(User).filter(User.email == u["email"].lower()).first()
            if existing:
                print(f"[EXISTS] User {u['email']} already exists (Role: {existing.role})")
                # Update role & ensure active
                existing.role = u["role"]
                existing.is_active = True
                db.commit()
            else:
                new_user = User(
                    name=u["name"],
                    email=u["email"].lower(),
                    password_hash=hash_password(u["password"]),
                    role=u["role"],
                    is_active=True,
                )
                db.add(new_user)
                db.commit()
                print(f"[CREATED] User {u['email']} created (Role: {u['role']})")
        print("\nAll demo users successfully verified and seeded!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_users()
