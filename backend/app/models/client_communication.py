from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils.helpers import utcnow


class ClientCommunication(Base):
    __tablename__ = "client_communications"
    __table_args__ = (
        Index("ix_communications_project_id", "project_id"),
        Index("ix_communications_manager_id", "manager_id"),
        Index("ix_communications_status", "status"),
        Index("ix_communications_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    manager_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    client_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    client_email: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    body_text: Mapped[str] = mapped_column(Text, nullable=False)
    communication_type: Mapped[str] = mapped_column(String(64), default="progress_update", nullable=False)  # 'progress_update', 'report_delivery', 'presentation_delivery', 'custom'
    report_id: Mapped[int | None] = mapped_column(ForeignKey("reports.id", ondelete="SET NULL"), nullable=True)
    presentation_id: Mapped[int | None] = mapped_column(ForeignKey("presentations.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="draft", nullable=False)  # 'draft', 'sent', 'failed'
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    gmail_message_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    project = relationship("Project", back_populates="communications")
    manager = relationship("User", back_populates="client_communications")
    report = relationship("Report", back_populates="communications")
    presentation = relationship("Presentation", back_populates="communications")
