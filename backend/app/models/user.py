from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.helpers import utcnow


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False, default="analyst")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    reset_token_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    reset_token_expires: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    datasets = relationship("Dataset", back_populates="owner")
    assigned_analyst_projects = relationship(
        "Project", back_populates="analyst", foreign_keys="Project.assigned_analyst_id"
    )
    assigned_manager_projects = relationship(
        "Project", back_populates="manager", foreign_keys="Project.assigned_manager_id"
    )
    cleaning_actions = relationship("CleaningAction", back_populates="performer")
    requested_approvals = relationship(
        "Approval", back_populates="requester", foreign_keys="Approval.requested_by"
    )
    reviewed_approvals = relationship(
        "Approval", back_populates="reviewer", foreign_keys="Approval.reviewed_by"
    )
    analyses = relationship("Analysis", back_populates="creator")
    visualizations = relationship("Visualization", back_populates="creator")
    predictions = relationship("Prediction", back_populates="creator")
    summaries = relationship("Summary", back_populates="creator")
    reports = relationship("Report", foreign_keys="Report.generated_by", back_populates="generator")
    presentations = relationship("Presentation", foreign_keys="Presentation.generated_by", back_populates="generator")
    client_communications = relationship("ClientCommunication", back_populates="manager")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")
