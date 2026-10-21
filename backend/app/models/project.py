from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.helpers import utcnow


class Project(Base):
    __tablename__ = "projects"
    __table_args__ = (
        Index("ix_projects_assigned_analyst_id", "assigned_analyst_id"),
        Index("ix_projects_assigned_manager_id", "assigned_manager_id"),
        Index("ix_projects_status", "status"),
        Index("ix_projects_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    business_objective: Mapped[str | None] = mapped_column(Text, nullable=True)
    client_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    client_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    assigned_analyst_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    assigned_manager_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="active", nullable=False)
    approval_policy: Mapped[str] = mapped_column(String(40), default="mandatory", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    analyst = relationship("User", foreign_keys=[assigned_analyst_id], back_populates="assigned_analyst_projects")
    manager = relationship("User", foreign_keys=[assigned_manager_id], back_populates="assigned_manager_projects")
    datasets = relationship("Dataset", back_populates="project")
    summaries = relationship("Summary", back_populates="project", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="project")
    presentations = relationship("Presentation", back_populates="project", cascade="all, delete-orphan")
    communications = relationship("ClientCommunication", back_populates="project", cascade="all, delete-orphan")
